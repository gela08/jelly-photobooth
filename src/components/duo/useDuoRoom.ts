'use client';

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DuoCustomState,
  DuoPhase,
  DuoPoseShot,
  DuoRole,
  DuoRoomSettings,
  DuoRoomSnapshot,
  DuoServerMessage,
} from '@/lib/duoProtocol'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return 'ssr'
  const key = 'jellybooth_duo_client_id'
  let existing = sessionStorage.getItem(key)
  if (!existing) {
    existing =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `duo_${Math.random().toString(36).slice(2)}_${Date.now()}`
    sessionStorage.setItem(key, existing)
  }
  return existing
}

export type RtcTransportStatus = 'idle' | 'connecting' | 'connected' | 'relay'

export interface UseDuoRoomReturn {
  clientId: string
  wsConnected: boolean
  room: DuoRoomSnapshot | null
  myRole: DuoRole | null
  shots: DuoPoseShot[]
  error: string | null
  clearError: () => void
  latencyMs: number | null
  rtcStatus: RtcTransportStatus
  remoteStream: MediaStream | null
  remoteFallbackFrame: string | null
  countdownRemaining: number | null
  activePoseIndex: number | null
  shutterFlash: boolean
  createRoom: (displayName: string) => void
  joinRoom: (roomCode: string, displayName: string) => void
  leaveRoom: () => void
  updateSettings: (patch: Partial<DuoRoomSettings>) => void
  setLocalCameraStream: (stream: MediaStream | null, videoEl: HTMLVideoElement | null) => void
  setReadyForSession: (ready: boolean) => void
  startShoot: () => void
  retryPose: (poseIndex: number) => void
  retakeAll: () => void
  updateCustomState: (patch: Partial<DuoCustomState>) => void
}

export function useDuoRoom(): UseDuoRoomReturn {
  const [clientId] = useState<string>(() => getOrCreateClientId())
  const [wsConnected, setWsConnected] = useState(false)
  const [room, setRoom] = useState<DuoRoomSnapshot | null>(null)
  const [myRole, setMyRole] = useState<DuoRole | null>(null)
  const [shots, setShots] = useState<DuoPoseShot[]>([])
  const [error, setError] = useState<string | null>(null)
  const [latencyMs, setLatencyMs] = useState<number | null>(null)
  const [rtcStatus, setRtcStatus] = useState<RtcTransportStatus>('idle')
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [remoteFallbackFrame, setRemoteFallbackFrame] = useState<string | null>(null)
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null)
  const [activePoseIndex, setActivePoseIndex] = useState<number | null>(null)
  const [shutterFlash, setShutterFlash] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const clockOffsetMsRef = useRef(0)
  const bestRttRef = useRef<number>(Infinity)

  const activeRoomCodeRef = useRef<string | null>(null)
  const displayNameRef = useRef<string>('Guest')
  const myRoleRef = useRef<DuoRole | null>(null)
  const roomRef = useRef<DuoRoomSnapshot | null>(null)
  const intentionalLeaveRef = useRef(false)

  const localStreamRef = useRef<MediaStream | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([])
  const rtcFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const liveRelayIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const countdownRafRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const burstIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const burstBufferRef = useRef<string[]>([])
  const capturedPoseSetRef = useRef<Set<number>>(new Set())

  const clearError = useCallback(() => setError(null), [])

  const sendWs = useCallback((payload: unknown) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    try {
      ws.send(JSON.stringify(payload))
      return true
    } catch {
      return false
    }
  }, [])

  const stopCountdownTimers = useCallback(() => {
    if (countdownRafRef.current) {
      clearInterval(countdownRafRef.current)
      countdownRafRef.current = null
    }
    if (burstIntervalRef.current) {
      clearInterval(burstIntervalRef.current)
      burstIntervalRef.current = null
    }
    burstBufferRef.current = []
    setCountdownRemaining(null)
  }, [])

  const stopRelayFallback = useCallback(() => {
    if (rtcFallbackTimerRef.current) {
      clearTimeout(rtcFallbackTimerRef.current)
      rtcFallbackTimerRef.current = null
    }
    if (liveRelayIntervalRef.current) {
      clearInterval(liveRelayIntervalRef.current)
      liveRelayIntervalRef.current = null
    }
  }, [])

  const closePeerConnection = useCallback(() => {
    stopRelayFallback()
    if (pcRef.current) {
      try {
        pcRef.current.close()
      } catch {
        // ignore close error
      }
      pcRef.current = null
    }
    pendingIceRef.current = []
    setRemoteStream(null)
    setRemoteFallbackFrame(null)
    setRtcStatus('idle')
  }, [stopRelayFallback])

  const captureMirroredDataUrl = useCallback(
    (maxWidth: number, quality: number): string | null => {
      const video = localVideoRef.current
      if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null
      const ratio = Math.min(1, maxWidth / video.videoWidth)
      const w = Math.max(160, Math.round(video.videoWidth * ratio))
      const h = Math.max(120, Math.round(video.videoHeight * ratio))

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      // Mirror horizontally to match natural photobooth selfie view
      ctx.translate(w, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0, w, h)
      return canvas.toDataURL('image/jpeg', quality)
    },
    []
  )

  const startLiveRelayFallback = useCallback(() => {
    if (liveRelayIntervalRef.current) return
    setRtcStatus('relay')
    liveRelayIntervalRef.current = setInterval(() => {
      const rCode = activeRoomCodeRef.current
      const currentRoom = roomRef.current
      if (!rCode || !currentRoom || currentRoom.phase === 'customizing') return
      if (!currentRoom.participants.some((p) => p.clientId !== clientId && p.connected)) return

      const frame = captureMirroredDataUrl(280, 0.54)
      if (frame) {
        sendWs({ type: 'duo:live_frame', roomCode: rCode, clientId, frame })
      }
    }, 125)
  }, [captureMirroredDataUrl, clientId, sendWs])

  const setupPeerConnection = useCallback(() => {
    if (pcRef.current) {
      try {
        pcRef.current.close()
      } catch {
        // ignore
      }
      pcRef.current = null
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pcRef.current = pc
    setRtcStatus('connecting')

    const localStream = localStreamRef.current
    if (localStream) {
      for (const track of localStream.getTracks()) {
        pc.addTrack(track, localStream)
      }
    }

    pc.ontrack = (event) => {
      const [stream] = event.streams
      if (stream) {
        setRemoteStream(stream)
        setRtcStatus('connected')
        stopRelayFallback()
      }
    }

    pc.onicecandidate = (event) => {
      const rCode = activeRoomCodeRef.current
      if (event.candidate && rCode) {
        sendWs({
          type: 'duo:rtc_ice',
          roomCode: rCode,
          clientId,
          candidate: event.candidate.toJSON(),
        })
      }
    }

    pc.oniceconnectionstatechange = () => {
      const st = pc.iceConnectionState
      if (st === 'connected' || st === 'completed') {
        setRtcStatus('connected')
        stopRelayFallback()
      } else if (st === 'failed' || st === 'disconnected') {
        startLiveRelayFallback()
      }
    }

    // If P2P stream doesn't establish within 4.5s (e.g., strict symmetric NAT), enable clean live relay fallback
    if (rtcFallbackTimerRef.current) clearTimeout(rtcFallbackTimerRef.current)
    rtcFallbackTimerRef.current = setTimeout(() => {
      if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
        startLiveRelayFallback()
      }
    }, 4500)

    return pc
  }, [clientId, sendWs, startLiveRelayFallback, stopRelayFallback])

  const initiateRtcOffer = useCallback(async () => {
    const rCode = activeRoomCodeRef.current
    if (!rCode || myRoleRef.current !== 'host' || !localStreamRef.current) return

    const pc = setupPeerConnection()
    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      sendWs({
        type: 'duo:rtc_offer',
        roomCode: rCode,
        clientId,
        sdp: pc.localDescription,
      })
    } catch {
      startLiveRelayFallback()
    }
  }, [clientId, sendWs, setupPeerConnection, startLiveRelayFallback])

  const handleServerMessage = useCallback(
    async (msg: DuoServerMessage) => {
      switch (msg.type) {
        case 'duo:error': {
          setError(msg.message)
          break
        }
        case 'duo:pong': {
          const now = Date.now()
          const rtt = Math.max(0, now - msg.clientSentMs)
          setLatencyMs(rtt)
          if (rtt <= bestRttRef.current + 30) {
            bestRttRef.current = Math.min(bestRttRef.current, rtt)
            clockOffsetMsRef.current = msg.serverTimeMs - (msg.clientSentMs + rtt / 2)
          }
          break
        }
        case 'duo:room_joined': {
          activeRoomCodeRef.current = msg.room.roomCode
          myRoleRef.current = msg.role
          roomRef.current = msg.room
          setMyRole(msg.role)
          setRoom(msg.room)
          setShots(msg.shots)
          setError(null)

          // Re-announce camera readiness on join/reconnect
          if (localStreamRef.current) {
            sendWs({
              type: 'duo:camera_state',
              roomCode: msg.room.roomCode,
              clientId,
              cameraReady: true,
            })
          }

          const hasPartner = msg.room.participants.some((p) => p.clientId !== clientId && p.connected)
          if (msg.role === 'host' && hasPartner && localStreamRef.current) {
            initiateRtcOffer()
          }
          break
        }
        case 'duo:room_state': {
          const prevPhase: DuoPhase | undefined = roomRef.current?.phase
          const prevPartner = roomRef.current?.participants.find((p) => p.clientId !== clientId)
          const nextPartner = msg.room.participants.find((p) => p.clientId !== clientId)

          roomRef.current = msg.room
          setRoom(msg.room)
          const me = msg.room.participants.find((p) => p.clientId === clientId)
          if (me) {
            myRoleRef.current = me.role
            setMyRole(me.role)
          }

          if (msg.room.phase === 'lobby' && prevPhase === 'shooting') {
            stopCountdownTimers()
            setActivePoseIndex(null)
          }
          if (msg.room.phase === 'customizing') {
            stopCountdownTimers()
            stopRelayFallback()
          }
          if (msg.room.shooting.status === 'pose_incomplete') {
            stopCountdownTimers()
          }

          if (!nextPartner || !nextPartner.connected) {
            closePeerConnection()
          } else if (
            me?.role === 'host' &&
            localStreamRef.current &&
            (!prevPartner?.connected || (!prevPartner.cameraReady && nextPartner.cameraReady))
          ) {
            initiateRtcOffer()
          }
          break
        }
        case 'duo:pose_countdown': {
          stopCountdownTimers()
          capturedPoseSetRef.current.delete(msg.poseIndex)
          setActivePoseIndex(msg.poseIndex)

          const targetLocalMs = msg.captureAtServerMs - clockOffsetMsRef.current

          const updateTick = () => {
            const remainingMs = targetLocalMs - Date.now()
            if (remainingMs <= 0) {
              if (!capturedPoseSetRef.current.has(msg.poseIndex)) {
                capturedPoseSetRef.current.add(msg.poseIndex)
                stopCountdownTimers()

                setShutterFlash(true)
                setTimeout(() => setShutterFlash(false), 300)

                const crisp = captureMirroredDataUrl(960, 0.9)
                const burst = roomRef.current?.settings.liveMotionEnabled
                  ? [...burstBufferRef.current]
                  : undefined
                burstBufferRef.current = []

                if (crisp && activeRoomCodeRef.current) {
                  sendWs({
                    type: 'duo:pose_photo',
                    roomCode: activeRoomCodeRef.current,
                    clientId,
                    poseIndex: msg.poseIndex,
                    photo: crisp,
                    burst,
                  })
                }
              }
              return
            }

            const sec = Math.min(msg.countdownSeconds, Math.max(1, Math.ceil(remainingMs / 1000)))
            setCountdownRemaining(sec)

            // Collect sliding Live burst frames during the final 1.3s before shutter
            if (
              remainingMs <= 1350 &&
              roomRef.current?.settings.liveMotionEnabled &&
              !burstIntervalRef.current
            ) {
              burstIntervalRef.current = setInterval(() => {
                const frame = captureMirroredDataUrl(300, 0.68)
                if (frame) {
                  burstBufferRef.current = [...burstBufferRef.current, frame].slice(-8)
                }
              }, 160)
            }
          }

          updateTick()
          countdownRafRef.current = setInterval(updateTick, 50)
          break
        }
        case 'duo:pose_shot': {
          setShots((prev) => {
            const idx = prev.findIndex((s) => s.poseIndex === msg.shot.poseIndex)
            if (idx === -1) {
              return [...prev, msg.shot].sort((a, b) => a.poseIndex - b.poseIndex)
            }
            const next = [...prev]
            next[idx] = msg.shot
            return next
          })
          break
        }
        case 'duo:sync_shots': {
          setShots(msg.shots)
          break
        }
        case 'duo:custom_synced': {
          setRoom((prev) => (prev ? { ...prev, custom: msg.custom } : prev))
          break
        }
        case 'duo:rtc_offer': {
          if (!localStreamRef.current) {
            startLiveRelayFallback()
            return
          }
          const pc = setupPeerConnection()
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
            while (pendingIceRef.current.length > 0) {
              const cand = pendingIceRef.current.shift()
              if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand))
            }
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            if (activeRoomCodeRef.current) {
              sendWs({
                type: 'duo:rtc_answer',
                roomCode: activeRoomCodeRef.current,
                clientId,
                sdp: pc.localDescription,
              })
            }
          } catch {
            startLiveRelayFallback()
          }
          break
        }
        case 'duo:rtc_answer': {
          const pc = pcRef.current
          if (!pc) return
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp))
            while (pendingIceRef.current.length > 0) {
              const cand = pendingIceRef.current.shift()
              if (cand) await pc.addIceCandidate(new RTCIceCandidate(cand))
            }
          } catch {
            startLiveRelayFallback()
          }
          break
        }
        case 'duo:rtc_ice': {
          const pc = pcRef.current
          if (!pc || !pc.remoteDescription) {
            pendingIceRef.current.push(msg.candidate)
            return
          }
          try {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate))
          } catch {
            // ignore stale candidate
          }
          break
        }
        case 'duo:live_frame': {
          setRemoteFallbackFrame(msg.frame)
          break
        }
      }
    },
    [
      captureMirroredDataUrl,
      clientId,
      closePeerConnection,
      initiateRtcOffer,
      sendWs,
      setupPeerConnection,
      startLiveRelayFallback,
      stopCountdownTimers,
      stopRelayFallback,
    ]
  )

  const handleServerMessageRef = useRef(handleServerMessage)
  useEffect(() => {
    handleServerMessageRef.current = handleServerMessage
  }, [handleServerMessage])

  const ensureSocket = useCallback(
    (onOpenAction?: () => void) => {
      const existing = wsRef.current
      if (existing && existing.readyState === WebSocket.OPEN) {
        onOpenAction?.()
        return
      }
      if (existing && existing.readyState === WebSocket.CONNECTING) {
        if (onOpenAction) {
          existing.addEventListener('open', onOpenAction, { once: true })
        }
        return
      }

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${proto}//${window.location.host}/api/duo-ws`)
      wsRef.current = ws

      ws.onopen = () => {
        setWsConnected(true)
        sendWs({ type: 'duo:ping', clientSentMs: Date.now() })
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = setInterval(() => {
          sendWs({ type: 'duo:ping', clientSentMs: Date.now() })
        }, 4000)

        if (activeRoomCodeRef.current && !onOpenAction) {
          sendWs({
            type: 'duo:join_room',
            roomCode: activeRoomCodeRef.current,
            clientId,
            name: displayNameRef.current,
          })
        }
        onOpenAction?.()
      }

      ws.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(String(evt.data)) as DuoServerMessage
          handleServerMessageRef.current(parsed)
        } catch {
          // ignore malformed messages
        }
      }

      ws.onclose = () => {
        setWsConnected(false)
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }
        if (!intentionalLeaveRef.current && activeRoomCodeRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            ensureSocket()
          }, 2000)
        }
      }
    },
    [clientId, sendWs]
  )

  useEffect(() => {
    return () => {
      intentionalLeaveRef.current = true
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current)
      stopCountdownTimers()
      closePeerConnection()
      if (wsRef.current) {
        try {
          wsRef.current.close()
        } catch {
          // ignore
        }
      }
    }
  }, [closePeerConnection, stopCountdownTimers])

  const createRoom = useCallback(
    (displayName: string) => {
      intentionalLeaveRef.current = false
      displayNameRef.current = displayName.trim() || 'Host'
      ensureSocket(() => {
        sendWs({
          type: 'duo:create_room',
          clientId,
          name: displayNameRef.current,
        })
      })
    },
    [clientId, ensureSocket, sendWs]
  )

  const joinRoom = useCallback(
    (roomCode: string, displayName: string) => {
      intentionalLeaveRef.current = false
      const normalized = roomCode.trim().toUpperCase()
      if (!normalized) {
        setError('Enter a room code to join.')
        return
      }
      displayNameRef.current = displayName.trim() || 'Partner'
      ensureSocket(() => {
        sendWs({
          type: 'duo:join_room',
          roomCode: normalized,
          clientId,
          name: displayNameRef.current,
        })
      })
    },
    [clientId, ensureSocket, sendWs]
  )

  const leaveRoom = useCallback(() => {
    intentionalLeaveRef.current = true
    const rCode = activeRoomCodeRef.current
    if (rCode) {
      sendWs({ type: 'duo:leave_room', roomCode: rCode, clientId })
    }
    activeRoomCodeRef.current = null
    myRoleRef.current = null
    roomRef.current = null
    setRoom(null)
    setMyRole(null)
    setShots([])
    stopCountdownTimers()
    closePeerConnection()
  }, [clientId, closePeerConnection, sendWs, stopCountdownTimers])

  const updateSettings = useCallback(
    (patch: Partial<DuoRoomSettings>) => {
      const rCode = activeRoomCodeRef.current
      if (!rCode) return
      sendWs({ type: 'duo:update_settings', roomCode: rCode, clientId, settings: patch })
    },
    [clientId, sendWs]
  )

  const setLocalCameraStream = useCallback(
    (stream: MediaStream | null, videoEl: HTMLVideoElement | null) => {
      const prevStream = localStreamRef.current
      localStreamRef.current = stream
      localVideoRef.current = videoEl

      const rCode = activeRoomCodeRef.current
      if (rCode) {
        sendWs({
          type: 'duo:camera_state',
          roomCode: rCode,
          clientId,
          cameraReady: Boolean(stream),
        })
      }

      const hasPartner = roomRef.current?.participants.some((p) => p.clientId !== clientId && p.connected)
      if (stream && prevStream !== stream && hasPartner && myRoleRef.current === 'host') {
        initiateRtcOffer()
      }
    },
    [clientId, initiateRtcOffer, sendWs]
  )

  const setReadyForSession = useCallback(
    (ready: boolean) => {
      const rCode = activeRoomCodeRef.current
      if (!rCode) return
      sendWs({ type: 'duo:ready_state', roomCode: rCode, clientId, readyForSession: ready })
    },
    [clientId, sendWs]
  )

  const startShoot = useCallback(() => {
    const rCode = activeRoomCodeRef.current
    if (!rCode) return
    sendWs({ type: 'duo:start_shoot', roomCode: rCode, clientId })
  }, [clientId, sendWs])

  const retryPose = useCallback(
    (poseIndex: number) => {
      const rCode = activeRoomCodeRef.current
      if (!rCode) return
      sendWs({ type: 'duo:retry_pose', roomCode: rCode, clientId, poseIndex })
    },
    [clientId, sendWs]
  )

  const retakeAll = useCallback(() => {
    const rCode = activeRoomCodeRef.current
    if (!rCode) return
    stopCountdownTimers()
    setShots([])
    sendWs({ type: 'duo:retake_all', roomCode: rCode, clientId })
  }, [clientId, sendWs, stopCountdownTimers])

  const updateCustomState = useCallback(
    (patch: Partial<DuoCustomState>) => {
      const rCode = activeRoomCodeRef.current
      setRoom((prev) => (prev ? { ...prev, custom: { ...prev.custom, ...patch } } : prev))
      if (!rCode) return
      sendWs({ type: 'duo:customize_update', roomCode: rCode, clientId, custom: patch })
    },
    [clientId, sendWs]
  )

  return {
    clientId,
    wsConnected,
    room,
    myRole,
    shots,
    error,
    clearError,
    latencyMs,
    rtcStatus,
    remoteStream,
    remoteFallbackFrame,
    countdownRemaining,
    activePoseIndex,
    shutterFlash,
    createRoom,
    joinRoom,
    leaveRoom,
    updateSettings,
    setLocalCameraStream,
    setReadyForSession,
    startShoot,
    retryPose,
    retakeAll,
    updateCustomState,
  }
}
