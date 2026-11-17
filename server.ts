import http from 'http'
import { parse } from 'url'
import type { Socket } from 'net'
import next from 'next'
import { WebSocketServer, WebSocket } from 'ws'

const dev = process.env.NODE_ENV !== 'production'
const wsOnly = process.env.WS_ONLY === 'true'
const hostname = '0.0.0.0'
const port = Number(process.env.PORT || 3000)

type DuoRole = 'host' | 'guest'
type DuoPhase = 'lobby' | 'shooting' | 'customizing'
type DuoShootingStatus = 'idle' | 'counting' | 'capturing' | 'pose_incomplete' | 'complete'
type PoseCount = 2 | 3 | 4 | 6
type CountdownSeconds = 3 | 5 | 10

interface ServerParticipant {
  clientId: string
  role: DuoRole
  name: string
  connected: boolean
  cameraReady: boolean
  readyForSession: boolean
  ws: WebSocket | null
  disconnectTimer: ReturnType<typeof setTimeout> | null
}

interface ServerPoseShot {
  poseIndex: number
  hostPhoto?: string
  guestPhoto?: string
  hostBurst?: string[]
  guestBurst?: string[]
}

interface ServerRoom {
  roomCode: string
  phase: DuoPhase
  participants: ServerParticipant[]
  settings: {
    poseCount: PoseCount
    countdownSeconds: CountdownSeconds
    composeMode: 'side_by_side' | 'stacked' | 'twin_strip'
    liveMotionEnabled: boolean
  }
  shooting: {
    currentPose: number
    totalPoses: number
    status: DuoShootingStatus
    captureAtServerMs: number | null
    countdownSeconds: CountdownSeconds
  }
  custom: {
    filter: string
    layout: string
    composeMode: 'side_by_side' | 'stacked' | 'twin_strip'
    caption: string
    showDate: boolean
    stripTheme: string
    borderStyle: string
    stripDecoration: string
    stickers: unknown[]
    hostTransforms: { x: number; y: number; zoom: number }[]
    guestTransforms: { x: number; y: number; zoom: number }[]
  }
  shots: Map<number, ServerPoseShot>
  countdownTimer: ReturnType<typeof setTimeout> | null
  poseTimeoutTimer: ReturnType<typeof setTimeout> | null
  nextPoseTimer: ReturnType<typeof setTimeout> | null
  lastActivityAt: number
}

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const rooms = new Map<string, ServerRoom>()
const socketToMember = new Map<WebSocket, { roomCode: string; clientId: string }>()

function generateRoomCode(): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += ROOM_ALPHABET[Math.floor(Math.random() * ROOM_ALPHABET.length)]
    }
    if (!rooms.has(code)) return code
  }
  return `JLY${Math.floor(100 + Math.random() * 900)}`
}

function defaultTransforms(count: number) {
  return Array.from({ length: count }, () => ({ x: 0, y: 0, zoom: 1 }))
}

function getDefaultLayoutForPose(poseCount: PoseCount): string {
  switch (poseCount) {
    case 2:
    case 3:
    case 4:
    case 6:
    default:
      return 'classic'
  }
}

function createRoom(roomCode: string): ServerRoom {
  return {
    roomCode,
    phase: 'lobby',
    participants: [],
    settings: {
      poseCount: 4,
      countdownSeconds: 3,
      composeMode: 'side_by_side',
      liveMotionEnabled: true,
    },
    shooting: {
      currentPose: 0,
      totalPoses: 4,
      status: 'idle',
      captureAtServerMs: null,
      countdownSeconds: 3,
    },
    custom: {
      filter: 'none',
      layout: 'classic',
      composeMode: 'side_by_side',
      caption: '',
      showDate: true,
      stripTheme: 'auto',
      borderStyle: 'classic',
      stripDecoration: 'none',
      stickers: [],
      hostTransforms: defaultTransforms(4),
      guestTransforms: defaultTransforms(4),
    },
    shots: new Map(),
    countdownTimer: null,
    poseTimeoutTimer: null,
    nextPoseTimer: null,
    lastActivityAt: Date.now(),
  }
}

function clearRoomTimers(room: ServerRoom) {
  if (room.countdownTimer) {
    clearTimeout(room.countdownTimer)
    room.countdownTimer = null
  }
  if (room.poseTimeoutTimer) {
    clearTimeout(room.poseTimeoutTimer)
    room.poseTimeoutTimer = null
  }
  if (room.nextPoseTimer) {
    clearTimeout(room.nextPoseTimer)
    room.nextPoseTimer = null
  }
}

function getCompletedPoseCount(room: ServerRoom): number {
  let count = 0
  for (let i = 0; i < room.shooting.totalPoses; i++) {
    const shot = room.shots.get(i)
    if (shot?.hostPhoto && shot?.guestPhoto) count++
  }
  return count
}

function toRoomSnapshot(room: ServerRoom) {
  const capturedHostPoses: number[] = []
  const capturedGuestPoses: number[] = []
  for (const [poseIdx, shot] of Array.from(room.shots.entries())) {
    if (shot.hostPhoto) capturedHostPoses.push(poseIdx)
    if (shot.guestPhoto) capturedGuestPoses.push(poseIdx)
  }

  return {
    roomCode: room.roomCode,
    phase: room.phase,
    participants: room.participants.map((p) => ({
      clientId: p.clientId,
      role: p.role,
      name: p.name,
      connected: p.connected,
      cameraReady: p.cameraReady,
      readyForSession: p.readyForSession,
    })),
    settings: room.settings,
    shooting: {
      currentPose: room.shooting.currentPose,
      totalPoses: room.shooting.totalPoses,
      status: room.shooting.status,
      captureAtServerMs: room.shooting.captureAtServerMs,
      countdownSeconds: room.shooting.countdownSeconds,
      capturedHostPoses,
      capturedGuestPoses,
    },
    custom: room.custom,
    completedPoseCount: getCompletedPoseCount(room),
  }
}

function sendJson(ws: WebSocket | null, payload: unknown) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  try {
    ws.send(JSON.stringify(payload))
  } catch {
    // ignore closed/broken socket send errors
  }
}

function broadcastRoom(room: ServerRoom, payload: unknown, excludeClientId?: string) {
  for (const p of room.participants) {
    if (excludeClientId && p.clientId === excludeClientId) continue
    sendJson(p.ws, payload)
  }
}

function broadcastRoomState(room: ServerRoom) {
  broadcastRoom(room, {
    type: 'duo:room_state',
    room: toRoomSnapshot(room),
  })
}

function removeParticipant(room: ServerRoom, clientId: string) {
  const idx = room.participants.findIndex((p) => p.clientId === clientId)
  if (idx === -1) return
  const [removed] = room.participants.splice(idx, 1)
  if (removed.disconnectTimer) {
    clearTimeout(removed.disconnectTimer)
    removed.disconnectTimer = null
  }
  if (removed.ws) {
    socketToMember.delete(removed.ws)
  }

  if (room.participants.length === 0) {
    clearRoomTimers(room)
    rooms.delete(room.roomCode)
    return
  }

  // Promote remaining participant to host if host departed
  if (removed.role === 'host' && room.participants[0]) {
    room.participants[0].role = 'host'
  }

  // If still shooting while partner left permanently, cancel active countdown safely
  if (room.phase === 'shooting') {
    clearRoomTimers(room)
    room.phase = 'lobby'
    room.shooting.status = 'idle'
    room.shooting.captureAtServerMs = null
  }

  broadcastRoomState(room)
}

function startCountdownForPose(room: ServerRoom, poseIndex: number) {
  clearRoomTimers(room)
  const countdownSeconds = room.settings.countdownSeconds
  const leadInMs = 350
  const serverNowMs = Date.now()
  const captureAtServerMs = serverNowMs + countdownSeconds * 1000 + leadInMs

  room.phase = 'shooting'
  room.shooting.currentPose = poseIndex
  room.shooting.totalPoses = room.settings.poseCount
  room.shooting.countdownSeconds = countdownSeconds
  room.shooting.status = 'counting'
  room.shooting.captureAtServerMs = captureAtServerMs
  room.lastActivityAt = Date.now()

  broadcastRoom(room, {
    type: 'duo:pose_countdown',
    poseIndex,
    totalPoses: room.settings.poseCount,
    countdownSeconds,
    serverNowMs,
    captureAtServerMs,
  })
  broadcastRoomState(room)

  room.countdownTimer = setTimeout(() => {
    room.countdownTimer = null
    if (room.phase !== 'shooting' || room.shooting.currentPose !== poseIndex) return
    room.shooting.status = 'capturing'
    broadcastRoomState(room)

    room.poseTimeoutTimer = setTimeout(() => {
      room.poseTimeoutTimer = null
      const shot = room.shots.get(poseIndex)
      if (!shot?.hostPhoto || !shot?.guestPhoto) {
        room.shooting.status = 'pose_incomplete'
        room.shooting.captureAtServerMs = null
        broadcastRoomState(room)
      }
    }, 9500)
  }, Math.max(0, captureAtServerMs - Date.now()))
}

function sanitizeName(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string') return fallback
  const trimmed = raw.trim().slice(0, 24)
  return trimmed || fallback
}

// Purge abandoned rooms periodically
setInterval(() => {
  const cutoff = Date.now() - 45 * 60 * 1000
  for (const [code, room] of Array.from(rooms.entries())) {
    if (room.lastActivityAt < cutoff) {
      clearRoomTimers(room)
      for (const p of room.participants) {
        if (p.disconnectTimer) clearTimeout(p.disconnectTimer)
      }
      rooms.delete(code)
    }
  }
}, 5 * 60 * 1000)

appPrepare()

async function appPrepare() {
  let handle: ReturnType<ReturnType<typeof next>['getRequestHandler']> | null = null
  let nextUpgradeHandler: ((req: http.IncomingMessage, socket: Socket, head: Buffer) => void) | undefined

  if (!wsOnly) {
    const app = next({ dev, hostname, port })
    handle = app.getRequestHandler()
    await app.prepare()
    nextUpgradeHandler = (
      app as unknown as {
        getUpgradeHandler?: () => (req: http.IncomingMessage, socket: Socket, head: Buffer) => void
      }
    ).getUpgradeHandler?.()
  }

  const server = http.createServer((req, res) => {
    const parsedUrl = parse(req.url || '/', true)
    if (wsOnly) {
      if (parsedUrl.pathname === '/' || parsedUrl.pathname === '/health' || parsedUrl.pathname === '/api/duo-health') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, service: 'jelly-duo-ws', activeRooms: rooms.size }))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'Not found' }))
      }
      return
    }
    void handle?.(req, res, parsedUrl)
  })

  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 12 * 1024 * 1024,
  })

  server.on('upgrade', (req, socket, head) => {
    const parsedUrl = parse(req.url || '/', true)
    if (parsedUrl.pathname === '/api/duo-ws' || (wsOnly && parsedUrl.pathname === '/')) {
      wss.handleUpgrade(req, socket as Socket, head, (ws) => {
        wss.emit('connection', ws, req)
      })
      return
    }

    if (nextUpgradeHandler) {
      nextUpgradeHandler(req, socket as Socket, head)
    } else {
      socket.destroy()
    }
  })

    wss.on('connection', (ws) => {
      ws.on('message', (raw) => {
        let msg: Record<string, unknown>
        try {
          msg = JSON.parse(raw.toString()) as Record<string, unknown>
        } catch {
          sendJson(ws, { type: 'duo:error', code: 'BAD_JSON', message: 'Invalid message payload.' })
          return
        }

        const type = typeof msg.type === 'string' ? msg.type : ''

        if (type === 'duo:ping') {
          sendJson(ws, {
            type: 'duo:pong',
            clientSentMs: Number(msg.clientSentMs || 0),
            serverTimeMs: Date.now(),
          })
          return
        }

        const clientId = typeof msg.clientId === 'string' ? msg.clientId.trim() : ''
        if (!clientId) {
          sendJson(ws, { type: 'duo:error', code: 'MISSING_CLIENT', message: 'Missing client identifier.' })
          return
        }

        if (type === 'duo:create_room') {
          const prev = socketToMember.get(ws)
          if (prev) {
            const oldRoom = rooms.get(prev.roomCode)
            if (oldRoom) removeParticipant(oldRoom, prev.clientId)
          }

          const roomCode = generateRoomCode()
          const room = createRoom(roomCode)
          const participant: ServerParticipant = {
            clientId,
            role: 'host',
            name: sanitizeName(msg.name, 'Host'),
            connected: true,
            cameraReady: false,
            readyForSession: false,
            ws,
            disconnectTimer: null,
          }
          room.participants.push(participant)
          rooms.set(roomCode, room)
          socketToMember.set(ws, { roomCode, clientId })

          sendJson(ws, {
            type: 'duo:room_joined',
            role: 'host',
            room: toRoomSnapshot(room),
            shots: [],
          })
          return
        }

        const roomCode = typeof msg.roomCode === 'string' ? msg.roomCode.trim().toUpperCase() : ''
        const room = rooms.get(roomCode)

        if (type === 'duo:join_room') {
          if (!room) {
            sendJson(ws, {
              type: 'duo:error',
              code: 'ROOM_NOT_FOUND',
              message: `Room "${roomCode || '???'}" was not found. Double-check the code or create a new room.`,
            })
            return
          }

          room.lastActivityAt = Date.now()
          const existing = room.participants.find((p) => p.clientId === clientId)

          if (existing) {
            if (existing.disconnectTimer) {
              clearTimeout(existing.disconnectTimer)
              existing.disconnectTimer = null
            }
            if (existing.ws && existing.ws !== ws) {
              socketToMember.delete(existing.ws)
            }
            existing.ws = ws
            existing.connected = true
            existing.name = sanitizeName(msg.name, existing.name)
            socketToMember.set(ws, { roomCode, clientId })

            sendJson(ws, {
              type: 'duo:room_joined',
              role: existing.role,
              room: toRoomSnapshot(room),
              shots: Array.from(room.shots.values()).sort((a, b) => a.poseIndex - b.poseIndex),
            })
            broadcastRoomState(room)
            return
          }

          if (room.participants.length >= 2) {
            sendJson(ws, {
              type: 'duo:error',
              code: 'ROOM_FULL',
              message: 'This Remote Duo room already has two participants.',
            })
            return
          }

          const role: DuoRole = room.participants.some((p) => p.role === 'host') ? 'guest' : 'host'
          const participant: ServerParticipant = {
            clientId,
            role,
            name: sanitizeName(msg.name, role === 'host' ? 'Host' : 'Partner'),
            connected: true,
            cameraReady: false,
            readyForSession: false,
            ws,
            disconnectTimer: null,
          }
          room.participants.push(participant)
          socketToMember.set(ws, { roomCode, clientId })

          sendJson(ws, {
            type: 'duo:room_joined',
            role,
            room: toRoomSnapshot(room),
            shots: Array.from(room.shots.values()).sort((a, b) => a.poseIndex - b.poseIndex),
          })
          broadcastRoomState(room)
          return
        }

        if (!room) {
          sendJson(ws, {
            type: 'duo:error',
            code: 'ROOM_EXPIRED',
            message: 'Room session has ended or expired.',
          })
          return
        }

        const member = room.participants.find((p) => p.clientId === clientId)
        if (!member) {
          sendJson(ws, {
            type: 'duo:error',
            code: 'NOT_IN_ROOM',
            message: 'You are not an active participant in this room.',
          })
          return
        }

        room.lastActivityAt = Date.now()

        if (type === 'duo:leave_room') {
          removeParticipant(room, clientId)
          return
        }

        if (type === 'duo:update_settings') {
          if (member.role !== 'host' || room.phase !== 'lobby') return
          const settings = (msg.settings || {}) as Record<string, unknown>

          if (settings.poseCount === 2 || settings.poseCount === 3 || settings.poseCount === 4 || settings.poseCount === 6) {
            room.settings.poseCount = settings.poseCount
            room.shooting.totalPoses = settings.poseCount
            room.custom.layout = getDefaultLayoutForPose(settings.poseCount)
            room.custom.hostTransforms = defaultTransforms(settings.poseCount)
            room.custom.guestTransforms = defaultTransforms(settings.poseCount)
          }
          if (settings.countdownSeconds === 3 || settings.countdownSeconds === 5 || settings.countdownSeconds === 10) {
            room.settings.countdownSeconds = settings.countdownSeconds
            room.shooting.countdownSeconds = settings.countdownSeconds
          }
          if (
            settings.composeMode === 'side_by_side' ||
            settings.composeMode === 'stacked' ||
            settings.composeMode === 'twin_strip'
          ) {
            room.settings.composeMode = settings.composeMode
            room.custom.composeMode = settings.composeMode
          }
          if (typeof settings.liveMotionEnabled === 'boolean') {
            room.settings.liveMotionEnabled = settings.liveMotionEnabled
          }
          broadcastRoomState(room)
          return
        }

        if (type === 'duo:camera_state') {
          member.cameraReady = Boolean(msg.cameraReady)
          if (!member.cameraReady) member.readyForSession = false
          broadcastRoomState(room)
          return
        }

        if (type === 'duo:ready_state') {
          member.readyForSession = Boolean(msg.readyForSession)
          broadcastRoomState(room)
          return
        }

        if (type === 'duo:start_shoot') {
          if (room.phase !== 'lobby') return
          if (room.participants.length < 2) {
            sendJson(ws, {
              type: 'duo:error',
              code: 'NEED_PARTNER',
              message: 'Wait for your partner to join before starting.',
            })
            return
          }
          const allReady = room.participants.every((p) => p.connected && p.cameraReady && p.readyForSession)
          if (!allReady) {
            sendJson(ws, {
              type: 'duo:error',
              code: 'NOT_READY',
              message: 'Both participants must have their camera active and toggle Ready first.',
            })
            return
          }

          room.shots.clear()
          room.custom.hostTransforms = defaultTransforms(room.settings.poseCount)
          room.custom.guestTransforms = defaultTransforms(room.settings.poseCount)
          startCountdownForPose(room, 0)
          return
        }

        if (type === 'duo:retry_pose') {
          if (room.phase !== 'shooting') return
          const poseIndex = Number(msg.poseIndex)
          if (!Number.isInteger(poseIndex) || poseIndex < 0 || poseIndex >= room.shooting.totalPoses) return
          room.shots.delete(poseIndex)
          startCountdownForPose(room, poseIndex)
          return
        }

        if (type === 'duo:retake_all') {
          clearRoomTimers(room)
          room.shots.clear()
          room.phase = 'lobby'
          room.shooting.currentPose = 0
          room.shooting.status = 'idle'
          room.shooting.captureAtServerMs = null
          for (const p of room.participants) {
            p.readyForSession = false
          }
          broadcastRoom(room, { type: 'duo:sync_shots', shots: [] })
          broadcastRoomState(room)
          return
        }

        if (type === 'duo:pose_photo') {
          const poseIndex = Number(msg.poseIndex)
          const photo = typeof msg.photo === 'string' ? msg.photo : ''
          if (!photo || !Number.isInteger(poseIndex) || poseIndex < 0 || poseIndex >= room.shooting.totalPoses) {
            return
          }
          const burst = Array.isArray(msg.burst)
            ? msg.burst.filter((f): f is string => typeof f === 'string').slice(-10)
            : undefined

          const existingShot = room.shots.get(poseIndex) || { poseIndex }
          if (member.role === 'host') {
            existingShot.hostPhoto = photo
            if (burst?.length) existingShot.hostBurst = burst
          } else {
            existingShot.guestPhoto = photo
            if (burst?.length) existingShot.guestBurst = burst
          }
          room.shots.set(poseIndex, existingShot)

          broadcastRoom(room, { type: 'duo:pose_shot', shot: existingShot })

          // Check whether both host and guest have submitted this pose
          if (
            existingShot.hostPhoto &&
            existingShot.guestPhoto &&
            room.phase === 'shooting' &&
            room.shooting.currentPose === poseIndex
          ) {
            clearRoomTimers(room)
            if (poseIndex + 1 < room.shooting.totalPoses) {
              broadcastRoomState(room)
              room.nextPoseTimer = setTimeout(() => {
                room.nextPoseTimer = null
                startCountdownForPose(room, poseIndex + 1)
              }, 1350)
            } else {
              room.shooting.status = 'complete'
              room.shooting.captureAtServerMs = null
              room.phase = 'customizing'
              for (const p of room.participants) {
                p.readyForSession = false
              }
              broadcastRoomState(room)
            }
          } else {
            broadcastRoomState(room)
          }
          return
        }

        if (type === 'duo:customize_update') {
          const patch = (msg.custom || {}) as Record<string, unknown>
          if (typeof patch.filter === 'string') room.custom.filter = patch.filter
          if (typeof patch.layout === 'string') room.custom.layout = patch.layout
          if (
            patch.composeMode === 'side_by_side' ||
            patch.composeMode === 'stacked' ||
            patch.composeMode === 'twin_strip'
          ) {
            room.custom.composeMode = patch.composeMode
          }
          if (typeof patch.caption === 'string') room.custom.caption = patch.caption.slice(0, 80)
          if (typeof patch.showDate === 'boolean') room.custom.showDate = patch.showDate
          if (typeof patch.stripTheme === 'string') room.custom.stripTheme = patch.stripTheme
          if (typeof patch.borderStyle === 'string') room.custom.borderStyle = patch.borderStyle
          if (typeof patch.stripDecoration === 'string') room.custom.stripDecoration = patch.stripDecoration
          if (Array.isArray(patch.stickers)) room.custom.stickers = patch.stickers.slice(0, 40)
          if (Array.isArray(patch.hostTransforms)) {
            room.custom.hostTransforms = patch.hostTransforms as { x: number; y: number; zoom: number }[]
          }
          if (Array.isArray(patch.guestTransforms)) {
            room.custom.guestTransforms = patch.guestTransforms as { x: number; y: number; zoom: number }[]
          }

          broadcastRoom(
            room,
            {
              type: 'duo:custom_synced',
              custom: room.custom,
              fromClientId: clientId,
            },
            clientId
          )
          return
        }

        if (type === 'duo:rtc_offer' || type === 'duo:rtc_answer' || type === 'duo:rtc_ice' || type === 'duo:live_frame') {
          broadcastRoom(
            room,
            {
              ...msg,
              fromClientId: clientId,
            },
            clientId
          )
          return
        }
      })

      ws.on('close', () => {
        const info = socketToMember.get(ws)
        socketToMember.delete(ws)
        if (!info) return

        const room = rooms.get(info.roomCode)
        if (!room) return

        const member = room.participants.find((p) => p.clientId === info.clientId)
        if (!member || member.ws !== ws) return

        member.ws = null
        member.connected = false
        member.cameraReady = false
        member.readyForSession = false
        broadcastRoomState(room)

        if (member.disconnectTimer) clearTimeout(member.disconnectTimer)
        member.disconnectTimer = setTimeout(() => {
          removeParticipant(room, info.clientId)
        }, 45000)
      })
    })

    server.listen(port, hostname, () => {
      console.log(
        wsOnly
          ? `> Jelly's Duo WebSocket Relay ready on ws://${hostname}:${port}/api/duo-ws`
          : `> Jelly's Photobooth ready on http://${hostname}:${port}`
      )
    })
}
