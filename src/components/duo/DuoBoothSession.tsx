'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Camera,
  Check,
  Copy,
  Download,
  Film,
  Heart,
  LogOut,
  RefreshCw,
  Share2,
  Sparkles,
  Users,
  VideoOff,
  Wifi,
  WifiOff,
} from 'lucide-react'
import Nav from '@/components/Nav'
import FilterSelector from '@/components/FilterSelector'
import LayoutSelector from '@/components/LayoutSelector'
import StripDesignSelector from '@/components/StripDesignSelector'
import StickerEditor from '@/components/StickerEditor'
import PhotoFrameEditor from '@/components/PhotoFrameEditor'
import BoothPrinterAnimation from '@/components/BoothPrinterAnimation'
import {
  COUNTDOWN_OPTIONS,
  DEFAULT_PHOTO_TRANSFORM,
  FILTERS,
  PhotoSession,
  POSE_COUNT_OPTIONS,
} from '@/lib/types'
import { DuoComposeMode } from '@/lib/duoProtocol'
import {
  downloadDuoPhoto,
  generateDuoLiveStripGif,
  generateDuoPhotoboothCanvas,
} from '@/lib/duoCompose'
import { downloadUrl } from '@/lib/liveExport'
import { useDuoRoom } from './useDuoRoom'

type DuoCustomizeTab = 'looks' | 'framing' | 'stickers'

const COMPOSE_MODE_OPTIONS: { id: DuoComposeMode; label: string; desc: string }[] = [
  { id: 'side_by_side', label: 'Side-by-Side', desc: 'Standing together in each frame' },
  { id: 'stacked', label: 'Stacked', desc: 'Top & bottom duo split' },
  { id: 'twin_strip', label: 'Twin Strips', desc: 'Two parallel classic strips' },
]

export default function DuoBoothSession({ initialRoomCode = '' }: { initialRoomCode?: string }) {
  const {
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
  } = useDuoRoom()

  const [displayName, setDisplayName] = useState('')
  const [joinCodeInput, setJoinCodeInput] = useState(initialRoomCode.toUpperCase())
  const [copiedInvite, setCopiedInvite] = useState(false)

  // Local camera state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isStartingCam, setIsStartingCam] = useState(false)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)

  // Customize & Export UI state
  const [localView, setLocalView] = useState<'customize' | 'export'>('customize')
  const [customTab, setCustomTab] = useState<DuoCustomizeTab>('looks')
  const [framingSubject, setFramingSubject] = useState<'host' | 'guest'>('host')
  const [enlargePhoto, setEnlargePhoto] = useState<string | null>(null)

  const [stripPreviewUrl, setStripPreviewUrl] = useState<string | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [printerDone, setPrinterDone] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const [duoGifUrl, setDuoGifUrl] = useState<string | null>(null)
  const [duoGifProgress, setDuoGifProgress] = useState(0)
  const [isEncodingDuoGif, setIsEncodingDuoGif] = useState(false)
  const [duoGifError, setDuoGifError] = useState<string | null>(null)

  const previewJobRef = useRef(0)
  const gifJobRef = useRef(0)
  const duoGifUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (initialRoomCode && !joinCodeInput) {
      setJoinCodeInput(initialRoomCode.toUpperCase())
    }
  }, [initialRoomCode, joinCodeInput])

  // Clear GIF blob URL on unmount or phase reset
  const revokeDuoGif = useCallback(() => {
    if (duoGifUrlRef.current) {
      URL.revokeObjectURL(duoGifUrlRef.current)
      duoGifUrlRef.current = null
    }
    setDuoGifUrl(null)
    setDuoGifProgress(0)
    setDuoGifError(null)
  }, [])

  useEffect(() => {
    return () => {
      revokeDuoGif()
    }
  }, [revokeDuoGif])

  // Reset local export view when leaving customize phase
  useEffect(() => {
    if (room?.phase !== 'customizing') {
      setLocalView('customize')
      setPrinterDone(false)
      revokeDuoGif()
    }
  }, [room?.phase, revokeDuoGif])

  const stopLocalCamera = useCallback(() => {
    setLocalStream((prev) => {
      if (prev) {
        prev.getTracks().forEach((t) => t.stop())
      }
      return null
    })
    setLocalCameraStream(null, null)
  }, [setLocalCameraStream])

  const startLocalCamera = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported in this browser.')
      return
    }
    setIsStartingCam(true)
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localVideoRef.current.play().catch(() => {})
      }
      setLocalCameraStream(stream, localVideoRef.current)
    } catch {
      setCameraError('Could not access camera. Allow camera permission in your browser and tap Retry Camera.')
    } finally {
      setIsStartingCam(false)
    }
  }, [setLocalCameraStream])

  // Start camera once joined into lobby/shooting; stop when customizing or leaving
  useEffect(() => {
    if (room && (room.phase === 'lobby' || room.phase === 'shooting')) {
      if (!localStream && !cameraError && !isStartingCam) {
        startLocalCamera()
      }
    } else if (!room || room.phase === 'customizing') {
      if (localStream) {
        stopLocalCamera()
      }
    }
  }, [room, localStream, cameraError, isStartingCam, startLocalCamera, stopLocalCamera])

  // Keep video element srcObject synced whenever mounted/switched
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream
      }
      localVideoRef.current.play().catch(() => {})
      setLocalCameraStream(localStream, localVideoRef.current)
    }
  }, [localStream, setLocalCameraStream, room?.phase])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream
      }
      remoteVideoRef.current.play().catch(() => {})
    }
  }, [remoteStream, room?.phase])

  // Cleanup camera tracks on page unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [localStream])

  const me = room?.participants.find((p) => p.clientId === clientId) || null
  const partner = room?.participants.find((p) => p.clientId !== clientId) || null

  const hostParticipant = room?.participants.find((p) => p.role === 'host') || null
  const guestParticipant = room?.participants.find((p) => p.role === 'guest') || null

  const duoSpec = useMemo(() => {
    if (!room) return null
    return {
      shots,
      poseCount: room.settings.poseCount,
      custom: room.custom,
      hostName: hostParticipant?.name || 'Host',
      guestName: guestParticipant?.name || 'Partner',
    }
  }, [room, shots, hostParticipant?.name, guestParticipant?.name])

  // Render combined strip preview cleanly when in customizing or export
  const renderDuoPreview = useCallback(async () => {
    if (!duoSpec || room?.phase !== 'customizing') return
    const id = ++previewJobRef.current
    setIsGeneratingPreview(true)
    try {
      const canvas = await generateDuoPhotoboothCanvas(duoSpec)
      if (previewJobRef.current === id) {
        setStripPreviewUrl(canvas.toDataURL('image/png'))
      }
    } catch (err) {
      console.error('Duo strip render failed:', err)
    } finally {
      if (previewJobRef.current === id) {
        setIsGeneratingPreview(false)
      }
    }
  }, [duoSpec, room?.phase])

  useEffect(() => {
    const timer = setTimeout(() => {
      renderDuoPreview()
    }, 100)
    return () => clearTimeout(timer)
  }, [renderDuoPreview])

  const hasDuoBurstFrames = useMemo(
    () => shots.some((s) => (s.hostBurst && s.hostBurst.length > 0) || (s.guestBurst && s.guestBurst.length > 0)),
    [shots]
  )

  const buildDuoGif = useCallback(async (): Promise<string | null> => {
    if (!duoSpec || !hasDuoBurstFrames) return null
    if (duoGifUrlRef.current) return duoGifUrlRef.current
    const jobId = ++gifJobRef.current
    setIsEncodingDuoGif(true)
    setDuoGifError(null)
    setDuoGifProgress(0)
    try {
      const result = await generateDuoLiveStripGif(duoSpec, (pct) => {
        if (gifJobRef.current === jobId) setDuoGifProgress(pct)
      })
      if (gifJobRef.current === jobId) {
        duoGifUrlRef.current = result.url
        setDuoGifUrl(result.url)
        return result.url
      } else {
        URL.revokeObjectURL(result.url)
        return null
      }
    } catch {
      if (gifJobRef.current === jobId) {
        setDuoGifError('Could not render Duo Live GIF strip.')
      }
      return null
    } finally {
      if (gifJobRef.current === jobId) setIsEncodingDuoGif(false)
    }
  }, [duoSpec, hasDuoBurstFrames])

  useEffect(() => {
    if (
      localView === 'export' &&
      printerDone &&
      hasDuoBurstFrames &&
      !duoGifUrlRef.current &&
      !isEncodingDuoGif
    ) {
      buildDuoGif()
    }
  }, [localView, printerDone, hasDuoBurstFrames, isEncodingDuoGif, buildDuoGif])

  // Render base canvas callback for StickerEditor (without stickers)
  const renderStickerBackdrop = useCallback(async () => {
    if (!duoSpec) {
      const c = document.createElement('canvas')
      c.width = 400
      c.height = 600
      return c
    }
    return generateDuoPhotoboothCanvas(duoSpec, { includeStickers: false, pairTargetWidth: 640 })
  }, [duoSpec])

  const stickerRenderKey = useMemo(() => {
    if (!room) return ''
    return JSON.stringify({
      filter: room.custom.filter,
      layout: room.custom.layout,
      composeMode: room.custom.composeMode,
      caption: room.custom.caption,
      showDate: room.custom.showDate,
      stripTheme: room.custom.stripTheme,
      borderStyle: room.custom.borderStyle,
      stripDecoration: room.custom.stripDecoration,
      hostTransforms: room.custom.hostTransforms,
      guestTransforms: room.custom.guestTransforms,
      shotsLen: shots.length,
    })
  }, [room, shots.length])

  const pseudoStickerSession: PhotoSession = useMemo(
    () => ({
      photos: shots.map((s) => s.hostPhoto || s.guestPhoto || '').filter(Boolean),
      filter: room?.custom.filter || 'none',
      layout: room?.custom.layout || 'classic',
      caption: room?.custom.caption || '',
      showDate: room?.custom.showDate ?? true,
      poseCount: room?.settings.poseCount ?? 4,
      stickers: room?.custom.stickers ?? [],
      stripTheme: room?.custom.stripTheme ?? 'auto',
      borderStyle: room?.custom.borderStyle ?? 'classic',
      stripDecoration: room?.custom.stripDecoration ?? 'none',
    }),
    [room, shots]
  )

  const handleCopyInvite = () => {
    if (!room || typeof window === 'undefined') return
    const url = `${window.location.origin}/duo?room=${room.roomCode}`
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedInvite(true)
      setTimeout(() => setCopiedInvite(false), 2000)
    }).catch(() => {})
  }

  const handleDownloadDuo = async (format: 'print' | 'social') => {
    if (!duoSpec || isDownloading) return
    setIsDownloading(true)
    try {
      await downloadDuoPhoto(duoSpec, format)
    } finally {
      setTimeout(() => setIsDownloading(false), 1200)
    }
  }

  const handleDownloadDuoGif = async () => {
    const dateStr = new Date().toISOString().split('T')[0]
    const url = duoGifUrl || (await buildDuoGif())
    if (url) {
      downloadUrl(url, `jellybooth_duo_${dateStr}_live.gif`)
    }
  }

  // Ordered photos for framing adjustment
  const hostPhotosList = useMemo(
    () =>
      Array.from({ length: room?.settings.poseCount ?? 4 }, (_, i) => {
        return shots.find((s) => s.poseIndex === i)?.hostPhoto || ''
      }).filter(Boolean),
    [room?.settings.poseCount, shots]
  )

  const guestPhotosList = useMemo(
    () =>
      Array.from({ length: room?.settings.poseCount ?? 4 }, (_, i) => {
        return shots.find((s) => s.poseIndex === i)?.guestPhoto || ''
      }).filter(Boolean),
    [room?.settings.poseCount, shots]
  )

  const bothConnected = Boolean(room && room.participants.filter((p) => p.connected).length === 2)
  const bothReady = Boolean(
    room &&
      room.participants.length === 2 &&
      room.participants.every((p) => p.connected && p.cameraReady && p.readyForSession)
  )

  return (
    <div className="min-h-screen film-grain" style={{ background: 'var(--cream)' }}>
      <Nav insideBooth={Boolean(room)} onLeaveConfirm={leaveRoom} />

      {/* Enlarge single photo modal */}
      {enlargePhoto && (
        <div
          className="fixed inset-0 z-[260] flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(10,8,6,0.9)', backdropFilter: 'blur(6px)' }}
          onClick={() => setEnlargePhoto(null)}
        >
          <img
            src={enlargePhoto}
            alt="Pose preview"
            className="max-w-[90vw] max-h-[85vh] object-contain border-4 border-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <main className="pt-20 pb-20 px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Global error banner */}
        {error && (
          <div
            className="mb-6 p-4 rounded-sm flex items-center justify-between gap-3 animate-fade-in"
            style={{ background: 'var(--surface)', border: '1px solid #b5544a', color: '#a83c32' }}
          >
            <p className="font-body text-sm">{error}</p>
            <button
              type="button"
              onClick={clearError}
              className="font-display text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-sm"
              style={{ border: '1px solid rgba(168,60,50,0.4)' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ── VIEW 1: CREATE OR JOIN ROOM ──────────────────────────────────────── */}
        {!room && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            <div className="text-center space-y-2">
              <p className="font-display text-xs tracking-[0.35em] uppercase" style={{ color: 'var(--sepia)' }}>
                ✦ Live Synchronized Photobooth
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
                Remote Duo Booth
              </h1>
              <p className="font-body text-sm sm:text-base max-w-lg mx-auto" style={{ color: 'var(--text-muted)' }}>
                Pose together from anywhere in real time. Open a private room, share the invite link, and take synchronized film strips side by side.
              </p>
              <div className="pt-1">
                <Link
                  href="/photobooth"
                  className="inline-block font-display text-[10px] tracking-widest uppercase underline opacity-75 hover:opacity-100"
                  style={{ color: 'var(--sepia)' }}
                >
                  Looking for Solo Mode? Open Solo Booth →
                </Link>
              </div>
            </div>

            {/* Name input */}
            <div className="section-card space-y-2">
              <label
                htmlFor="duo-display-name"
                className="block font-display text-xs tracking-widest uppercase"
                style={{ color: 'var(--text-secondary)' }}
              >
                Your Display Name
              </label>
              <input
                id="duo-display-name"
                type="text"
                maxLength={24}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Jelly, Alex, Sam..."
                className="w-full px-3.5 py-2.5 rounded-sm font-body text-sm focus:outline-none"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--vintage-brown)',
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Create Room */}
              <div className="section-card flex flex-col justify-between gap-5">
                <div className="space-y-2">
                  <div className="flex items-center gap-2" style={{ color: 'var(--vintage-brown)' }}>
                    <Users className="w-5 h-5" />
                    <h2 className="font-display text-lg font-bold">Start a Room</h2>
                  </div>
                  <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                    Generate a private 6-character room code and invite link to send to one friend.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => createRoom(displayName || 'Host')}
                  className="w-full font-display text-xs tracking-widest uppercase py-4 rounded-sm transition-all active:scale-95 shadow-md"
                  style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                >
                  Create Private Room
                </button>
              </div>

              {/* Join Room */}
              <div className="section-card flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2" style={{ color: 'var(--sepia)' }}>
                    <Heart className="w-5 h-5" />
                    <h2 className="font-display text-lg font-bold" style={{ color: 'var(--vintage-brown)' }}>
                      Join a Friend
                    </h2>
                  </div>
                  <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                    Paste or enter the 6-character code from your friend&apos;s invite link.
                  </p>
                  <input
                    type="text"
                    maxLength={8}
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="ROOM CODE (E.G. JLY4K9)"
                    className="w-full px-3.5 py-2.5 rounded-sm font-mono text-sm tracking-[0.2em] uppercase focus:outline-none"
                    style={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      color: 'var(--vintage-brown)',
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => joinRoom(joinCodeInput, displayName || 'Partner')}
                  disabled={!joinCodeInput.trim()}
                  className="w-full font-display text-xs tracking-widest uppercase py-4 rounded-sm transition-all active:scale-95 disabled:opacity-45"
                  style={{ background: 'var(--sepia)', color: 'var(--cream)' }}
                >
                  Join Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVE ROOM BAR ────────────────────────────────────────────────── */}
        {room && (
          <div className="space-y-6 animate-fade-in">
            <div
              className="section-card flex flex-wrap items-center justify-between gap-3 py-3.5"
              style={{ background: 'var(--surface)' }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <span className="font-display text-[10px] tracking-widest uppercase block" style={{ color: 'var(--text-muted)' }}>
                    Remote Duo Room
                  </span>
                  <span className="font-mono text-base font-bold tracking-[0.18em]" style={{ color: 'var(--vintage-brown)' }}>
                    {room.roomCode}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCopyInvite}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-display text-[10px] tracking-widest uppercase transition-all active:scale-95"
                  style={{
                    border: '1px solid var(--border)',
                    background: copiedInvite ? 'var(--vintage-brown)' : 'var(--surface-2)',
                    color: copiedInvite ? 'var(--cream)' : 'var(--vintage-brown)',
                  }}
                >
                  {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedInvite ? 'Invite Copied!' : 'Copy Invite Link'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {wsConnected ? (
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>{wsConnected ? (latencyMs !== null ? `${latencyMs}ms sync` : 'Synced') : 'Reconnecting...'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    stopLocalCamera()
                    leaveRoom()
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-display text-[10px] tracking-widest uppercase transition-all active:scale-95"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--surface-2)' }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Leave
                </button>
              </div>
            </div>

            {/* ── PHASE: LOBBY & SHOOTING STAGE ─────────────────────────────── */}
            {(room.phase === 'lobby' || room.phase === 'shooting') && (
              <div className="space-y-6">
                {/* Dual Camera Split Booth */}
                <div className="relative">
                  {/* Shared Flash Overlay */}
                  {shutterFlash && (
                    <div
                      className="fixed inset-0 z-[220] pointer-events-none bg-white/90 animate-fade-in"
                      style={{ transition: 'opacity 150ms ease-out' }}
                    />
                  )}

                  {/* Shared Countdown Overlay across the booth */}
                  {room.phase === 'shooting' && countdownRemaining !== null && (
                    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center">
                      <div
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center shadow-2xl"
                        style={{
                          background: 'rgba(26,20,16,0.78)',
                          border: '2px solid rgba(245,240,232,0.75)',
                          backdropFilter: 'blur(6px)',
                        }}
                      >
                        <span className="font-display text-5xl sm:text-6xl font-bold text-[#f5f0e8]">
                          {countdownRemaining}
                        </span>
                      </div>
                      <p
                        className="mt-2 px-3 py-1 rounded-sm font-display text-[10px] tracking-widest uppercase"
                        style={{ background: 'rgba(26,20,16,0.82)', color: '#f5f0e8' }}
                      >
                        Shot {(activePoseIndex ?? room.shooting.currentPose) + 1} / {room.shooting.totalPoses}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left Slot: You (or Host) */}
                    {[
                      {
                        label: me?.role === 'host' ? `${me.name} (You · Host)` : `${me?.name || 'You'} (You)`,
                        participant: me,
                        isLocal: true,
                      },
                      {
                        label: partner
                          ? `${partner.name} (${partner.role === 'host' ? 'Host' : 'Partner'})`
                          : 'Waiting for Partner…',
                        participant: partner,
                        isLocal: false,
                      },
                    ].map((slot, slotIdx) => (
                      <div
                        key={slotIdx}
                        className="rounded-sm overflow-hidden flex flex-col"
                        style={{ background: '#14110f', border: '1px solid var(--border)' }}
                      >
                        <div className="px-3 py-2 flex items-center justify-between gap-2" style={{ background: '#1c1714' }}>
                          <span className="font-display text-[11px] tracking-wider uppercase text-[#f5f0e8] truncate">
                            {slot.label}
                          </span>
                          {slot.participant ? (
                            <span
                              className="font-display text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-sm"
                              style={{
                                background: slot.participant.readyForSession
                                  ? 'rgba(52,211,153,0.18)'
                                  : slot.participant.cameraReady
                                    ? 'rgba(196,168,130,0.2)'
                                    : 'rgba(255,255,255,0.08)',
                                color: slot.participant.readyForSession ? '#6ee7b7' : '#e6d8c3',
                              }}
                            >
                              {slot.participant.readyForSession
                                ? 'Ready ✓'
                                : slot.participant.cameraReady
                                  ? 'Cam Live'
                                  : 'Connecting Cam'}
                            </span>
                          ) : (
                            <span className="font-display text-[9px] tracking-widest uppercase text-[#a39482]">
                              Empty Slot
                            </span>
                          )}
                        </div>

                        <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
                          {slot.isLocal ? (
                            localStream ? (
                              <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={{ transform: 'scaleX(-1)' }}
                              />
                            ) : (
                              <div className="p-6 text-center space-y-3 text-[#f5f0e8]">
                                <VideoOff className="w-8 h-8 mx-auto opacity-60" />
                                <p className="font-body text-xs opacity-80">
                                  {cameraError || 'Starting your camera…'}
                                </p>
                                <button
                                  type="button"
                                  onClick={startLocalCamera}
                                  className="px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase"
                                  style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                                >
                                  {isStartingCam ? 'Starting…' : 'Enable Camera'}
                                </button>
                              </div>
                            )
                          ) : !partner || !partner.connected ? (
                            <div className="p-6 text-center space-y-3 text-[#d7cab8]">
                              <Users className="w-8 h-8 mx-auto opacity-50" />
                              <p className="font-body text-sm">Share room code <strong className="font-mono text-[#f5f0e8]">{room.roomCode}</strong></p>
                              <button
                                type="button"
                                onClick={handleCopyInvite}
                                className="px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase"
                                style={{ border: '1px solid rgba(245,240,232,0.3)', color: '#f5f0e8' }}
                              >
                                {copiedInvite ? 'Link Copied!' : 'Copy Invite Link'}
                              </button>
                            </div>
                          ) : remoteStream ? (
                            <video
                              ref={remoteVideoRef}
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          ) : remoteFallbackFrame ? (
                            <img
                              src={remoteFallbackFrame}
                              alt="Partner live camera"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="p-6 text-center space-y-2 text-[#d7cab8]">
                              <div className="w-6 h-6 mx-auto rounded-full border-2 border-[#f5f0e8] border-t-transparent animate-spin" />
                              <p className="font-body text-xs">
                                {rtcStatus === 'relay'
                                  ? 'Syncing live video relay…'
                                  : 'Establishing live peer camera…'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lobby Settings & Readiness */}
                {room.phase === 'lobby' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="section-card lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--vintage-brown)' }}>
                          Session Setup
                        </h2>
                        <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                          {myRole === 'host' ? 'Host controls shared booth settings' : 'Host configures booth settings'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="font-display text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Poses
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {POSE_COUNT_OPTIONS.map((n) => (
                              <button
                                key={n}
                                type="button"
                                disabled={myRole !== 'host'}
                                onClick={() => updateSettings({ poseCount: n })}
                                className={`py-2.5 rounded-sm font-display text-xs transition-all ${
                                  myRole !== 'host' ? 'opacity-75 cursor-default' : 'active:scale-95'
                                }`}
                                style={
                                  room.settings.poseCount === n
                                    ? { background: 'var(--vintage-brown)', color: 'var(--cream)' }
                                    : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                                }
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="font-display text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>
                            Countdown
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {COUNTDOWN_OPTIONS.map((s) => (
                              <button
                                key={s}
                                type="button"
                                disabled={myRole !== 'host'}
                                onClick={() => updateSettings({ countdownSeconds: s })}
                                className={`py-2.5 rounded-sm font-display text-xs transition-all ${
                                  myRole !== 'host' ? 'opacity-75 cursor-default' : 'active:scale-95'
                                }`}
                                style={
                                  room.settings.countdownSeconds === s
                                    ? { background: 'var(--vintage-brown)', color: 'var(--cream)' }
                                    : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                                }
                              >
                                {s}s
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="font-display text-[10px] tracking-widest uppercase mb-2" style={{ color: 'var(--text-secondary)' }}>
                          Duo Frame Style
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {COMPOSE_MODE_OPTIONS.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              disabled={myRole !== 'host'}
                              onClick={() => updateSettings({ composeMode: opt.id })}
                              className="p-2.5 rounded-sm text-left transition-all"
                              style={
                                room.settings.composeMode === opt.id
                                  ? { background: 'var(--vintage-brown)', color: 'var(--cream)' }
                                  : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                              }
                            >
                              <div className="font-display text-[11px] font-bold">{opt.label}</div>
                              <div className="font-body text-[10px] opacity-80 leading-tight mt-0.5">{opt.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div
                        className="flex items-center justify-between pt-3"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <div>
                          <p className="font-display text-xs font-bold" style={{ color: 'var(--vintage-brown)' }}>
                            Live Motion Duo Strip (GIF)
                          </p>
                          <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                            Capture a short pre-shutter burst from both cameras for an animated GIF strip
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={myRole !== 'host'}
                          onClick={() => updateSettings({ liveMotionEnabled: !room.settings.liveMotionEnabled })}
                          className={`toggle-track ${room.settings.liveMotionEnabled ? 'on' : ''}`}
                          aria-label="Toggle live motion duo capture"
                        >
                          <div className="toggle-thumb" />
                        </button>
                      </div>
                    </div>

                    {/* Readiness Gate & Start Shoot */}
                    <div className="section-card flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <h2 className="font-display text-sm font-bold tracking-widest uppercase" style={{ color: 'var(--vintage-brown)' }}>
                          Ready Check
                        </h2>
                        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                          Both cameras must be live and marked Ready before starting the synchronized countdown.
                        </p>

                        <button
                          type="button"
                          disabled={!localStream}
                          onClick={() => setReadyForSession(!me?.readyForSession)}
                          className="w-full py-3.5 px-4 rounded-sm font-display text-xs tracking-widest uppercase transition-all active:scale-95 disabled:opacity-45"
                          style={
                            me?.readyForSession
                              ? { background: '#2f6f4e', color: '#f5f0e8' }
                              : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--vintage-brown)' }
                          }
                        >
                          {me?.readyForSession ? 'You Are Ready ✓' : 'Mark Yourself Ready'}
                        </button>
                      </div>

                      <div className="space-y-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                        {myRole === 'host' ? (
                          <button
                            type="button"
                            disabled={!bothConnected || !bothReady}
                            onClick={startShoot}
                            className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-sm font-display text-xs tracking-widest uppercase transition-all active:scale-95 disabled:opacity-45 shadow-md"
                            style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                          >
                            <Camera className="w-4 h-4" />
                            Start Duo Shoot
                          </button>
                        ) : (
                          <p className="font-body text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
                            {bothReady
                              ? 'Both ready! Waiting for Host to press Start…'
                              : 'Tap Mark Yourself Ready when you are set.'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Shooting Progress & Incomplete Recovery */}
                {room.phase === 'shooting' && (
                  <div className="section-card space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--vintage-brown)' }}>
                          {room.shooting.status === 'pose_incomplete'
                            ? `Pose ${room.shooting.currentPose + 1} Incomplete`
                            : room.shooting.status === 'capturing'
                              ? `Saving Pose ${room.shooting.currentPose + 1} from both cameras…`
                              : `Pose ${room.shooting.currentPose + 1} of ${room.shooting.totalPoses}`}
                        </p>
                        <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                          {room.shooting.status === 'pose_incomplete'
                            ? 'One participant’s snap timed out or missed. Retry this pose without losing earlier shots.'
                            : 'Stay in frame — shutter fires simultaneously for both cameras.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {room.shooting.status === 'pose_incomplete' && (
                          <button
                            type="button"
                            onClick={() => retryPose(room.shooting.currentPose)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase"
                            style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Retry Pose
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={retakeAll}
                          className="px-3 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase"
                          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--surface-2)' }}
                        >
                          Cancel Shoot
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {Array.from({ length: room.shooting.totalPoses }, (_, i) => {
                        const s = shots.find((item) => item.poseIndex === i)
                        return (
                          <div
                            key={i}
                            className="p-1.5 rounded-sm space-y-1"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                          >
                            <div className="grid grid-cols-2 gap-1 aspect-[4/3]">
                              {s?.hostPhoto ? (
                                <img src={s.hostPhoto} alt={`Pose ${i + 1} Host`} className="w-full h-full object-cover rounded-sm" />
                              ) : (
                                <div className="w-full h-full bg-black/15 rounded-sm" />
                              )}
                              {s?.guestPhoto ? (
                                <img src={s.guestPhoto} alt={`Pose ${i + 1} Partner`} className="w-full h-full object-cover rounded-sm" />
                              ) : (
                                <div className="w-full h-full bg-black/15 rounded-sm" />
                              )}
                            </div>
                            <p className="font-mono text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                              #{i + 1} {s?.hostPhoto && s?.guestPhoto ? '✓' : '…'}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PHASE: CUSTOMIZE (SHARED IN REAL TIME) ────────────────────── */}
            {room.phase === 'customizing' && localView === 'customize' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
                      Customize Your Duo Strip
                    </h2>
                    <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                      Theme, filter, framing, and sticker edits sync live between both participants.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={retakeAll}
                      className="px-4 py-2.5 rounded-sm font-display text-[10px] tracking-widest uppercase"
                      style={{ border: '1px solid var(--border)', color: 'var(--vintage-brown)', background: 'var(--surface)' }}
                    >
                      Retake Session
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPrinterDone(false)
                        setLocalView('export')
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm font-display text-xs tracking-widest uppercase shadow-md transition-all active:scale-95"
                      style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                    >
                      <Film className="w-4 h-4" />
                      Print &amp; Save Strip →
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Controls */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Sub-tabs */}
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'looks', label: 'Looks & Layout' },
                          { id: 'framing', label: 'Crop & Zoom' },
                          { id: 'stickers', label: 'Stickers' },
                        ] as { id: DuoCustomizeTab; label: string }[]
                      ).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setCustomTab(t.id)}
                          className="py-2.5 px-3 rounded-sm font-display text-[11px] tracking-widest uppercase transition-all"
                          style={
                            customTab === t.id
                              ? { background: 'var(--vintage-brown)', color: 'var(--cream)' }
                              : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                          }
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {customTab === 'looks' && (
                      <div className="space-y-5">
                        {/* Duo Compose Mode */}
                        <div className="section-card space-y-3">
                          <h3 className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                            Duo Arrangement
                          </h3>
                          <div className="grid grid-cols-3 gap-2">
                            {COMPOSE_MODE_OPTIONS.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => updateCustomState({ composeMode: opt.id })}
                                className="p-2.5 rounded-sm text-left transition-all"
                                style={
                                  room.custom.composeMode === opt.id
                                    ? { background: 'var(--vintage-brown)', color: 'var(--cream)' }
                                    : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                                }
                              >
                                <div className="font-display text-[11px] font-bold">{opt.label}</div>
                                <div className="font-body text-[10px] opacity-80 mt-0.5">{opt.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Layout Selector (shown for side_by_side & stacked) */}
                        {room.custom.composeMode !== 'twin_strip' && (
                          <div className="section-card">
                            <LayoutSelector
                              selected={room.custom.layout}
                              poseCount={room.settings.poseCount}
                              onSelect={(layout) => updateCustomState({ layout })}
                            />
                          </div>
                        )}

                        {/* Filter Selector */}
                        <div className="section-card">
                          <FilterSelector
                            selected={room.custom.filter}
                            previewPhoto={shots[0]?.hostPhoto || shots[0]?.guestPhoto}
                            onSelect={(filter) => updateCustomState({ filter })}
                          />
                        </div>

                        {/* Strip Design Selector */}
                        <div className="section-card">
                          <StripDesignSelector
                            stripTheme={room.custom.stripTheme}
                            borderStyle={room.custom.borderStyle}
                            stripDecoration={room.custom.stripDecoration}
                            onThemeChange={(stripTheme) => updateCustomState({ stripTheme })}
                            onBorderChange={(borderStyle) => updateCustomState({ borderStyle })}
                            onDecorationChange={(stripDecoration) => updateCustomState({ stripDecoration })}
                          />
                        </div>

                        {/* Caption & Date */}
                        <div className="section-card space-y-3">
                          <label className="block font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                            Strip Caption
                          </label>
                          <input
                            type="text"
                            maxLength={80}
                            value={room.custom.caption}
                            onChange={(e) => updateCustomState({ caption: e.target.value })}
                            placeholder="Write a memory, inside joke, or place…"
                            className="w-full px-3.5 py-2.5 rounded-sm font-body text-sm focus:outline-none"
                            style={{
                              background: 'var(--surface-2)',
                              border: '1px solid var(--border)',
                              color: 'var(--vintage-brown)',
                            }}
                          />
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-display text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                              Stamp Today&apos;s Date
                            </span>
                            <button
                              type="button"
                              onClick={() => updateCustomState({ showDate: !room.custom.showDate })}
                              className={`toggle-track ${room.custom.showDate ? 'on' : ''}`}
                              aria-label="Toggle date stamp"
                            >
                              <div className="toggle-thumb" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {customTab === 'framing' && (
                      <div className="section-card space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h3 className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--vintage-brown)' }}>
                              Adjust Framing Per Person
                            </h3>
                            <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                              Pan &amp; zoom each person&apos;s shots independently.
                            </p>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setFramingSubject('host')}
                              className="px-3 py-1.5 rounded-sm font-display text-[10px] tracking-widest uppercase"
                              style={
                                framingSubject === 'host'
                                  ? { background: 'var(--vintage-brown)', color: 'var(--cream)' }
                                  : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                              }
                            >
                              {hostParticipant?.name || 'Host'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setFramingSubject('guest')}
                              className="px-3 py-1.5 rounded-sm font-display text-[10px] tracking-widest uppercase"
                              style={
                                framingSubject === 'guest'
                                  ? { background: 'var(--vintage-brown)', color: 'var(--cream)' }
                                  : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                              }
                            >
                              {guestParticipant?.name || 'Partner'}
                            </button>
                          </div>
                        </div>

                        <PhotoFrameEditor
                          photos={framingSubject === 'host' ? hostPhotosList : guestPhotosList}
                          transforms={
                            framingSubject === 'host'
                              ? room.custom.hostTransforms
                              : room.custom.guestTransforms
                          }
                          layout={room.custom.layout}
                          poseCount={room.settings.poseCount}
                          filter={room.custom.filter}
                          onChange={(idx, next) => {
                            if (framingSubject === 'host') {
                              const arr = [...room.custom.hostTransforms]
                              arr[idx] = next
                              updateCustomState({ hostTransforms: arr })
                            } else {
                              const arr = [...room.custom.guestTransforms]
                              arr[idx] = next
                              updateCustomState({ guestTransforms: arr })
                            }
                          }}
                          onResetAll={() => {
                            const reset = Array.from({ length: room.settings.poseCount }, () => ({
                              ...DEFAULT_PHOTO_TRANSFORM,
                            }))
                            if (framingSubject === 'host') {
                              updateCustomState({ hostTransforms: reset })
                            } else {
                              updateCustomState({ guestTransforms: reset })
                            }
                          }}
                          onEnlarge={(idx) => {
                            const list = framingSubject === 'host' ? hostPhotosList : guestPhotosList
                            if (list[idx]) setEnlargePhoto(list[idx])
                          }}
                        />
                      </div>
                    )}

                    {customTab === 'stickers' && (
                      <div className="section-card">
                        <StickerEditor
                          session={pseudoStickerSession}
                          stickers={room.custom.stickers}
                          onChange={(stickers) => updateCustomState({ stickers })}
                          renderBaseCanvas={renderStickerBackdrop}
                          renderKey={stickerRenderKey}
                        />
                      </div>
                    )}
                  </div>

                  {/* Right: Live Strip Preview */}
                  <div className="lg:col-span-5 section-card flex flex-col items-center space-y-3 lg:sticky lg:top-20">
                    <div className="w-full flex items-center justify-between">
                      <span className="font-display text-[11px] tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                        Live Duo Preview
                      </span>
                      <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                        {FILTERS.find((f) => f.id === room.custom.filter)?.label || 'Original'}
                      </span>
                    </div>

                    <div
                      className="w-full min-h-[360px] flex items-center justify-center rounded-sm p-4"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      {stripPreviewUrl ? (
                        <img
                          src={stripPreviewUrl}
                          alt="Combined duo photobooth strip preview"
                          className="max-w-full max-h-[520px] object-contain shadow-lg"
                        />
                      ) : (
                        <div className="text-center space-y-2 py-12">
                          <div
                            className="w-7 h-7 mx-auto rounded-full border-2 border-t-transparent animate-spin"
                            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--vintage-brown)' }}
                          />
                          <p className="font-display text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                            Developing Duo Strip…
                          </p>
                        </div>
                      )}
                    </div>

                    {isGeneratingPreview && stripPreviewUrl && (
                      <p className="font-body text-[11px]" style={{ color: 'var(--text-muted)' }}>
                        Updating strip…
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── PHASE: EXPORT & BOOTH PRINTER ANIMATION ─────────────────────── */}
            {room.phase === 'customizing' && localView === 'export' && (
              <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
                      Your Remote Duo Strip
                    </h2>
                    <p className="font-body text-sm" style={{ color: 'var(--text-muted)' }}>
                      {hostParticipant?.name || 'Host'} × {guestParticipant?.name || 'Partner'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocalView('customize')}
                    className="px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase"
                    style={{ border: '1px solid var(--border)', color: 'var(--vintage-brown)', background: 'var(--surface)' }}
                  >
                    ← Back to Edit
                  </button>
                </div>

                <BoothPrinterAnimation
                  stripUrl={stripPreviewUrl}
                  isGenerating={isGeneratingPreview}
                  machineLabel="Jelly's Duo Booth"
                  onComplete={() => setPrinterDone(true)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isGeneratingPreview || isDownloading}
                    onClick={() => handleDownloadDuo('print')}
                    className="flex flex-col items-center gap-1.5 font-display text-[11px] tracking-widest uppercase px-4 py-5 transition-all active:scale-95 disabled:opacity-50 rounded-sm"
                    style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                  >
                    <Download className="w-4 h-4" />
                    <span>{isDownloading ? 'Saving…' : 'Save for Print'}</span>
                    <span className="text-[9px] normal-case font-body tracking-normal opacity-65">
                      High-res PNG
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isGeneratingPreview || isDownloading}
                    onClick={() => handleDownloadDuo('social')}
                    className="flex flex-col items-center gap-1.5 font-display text-[11px] tracking-widest uppercase px-4 py-5 transition-all active:scale-95 disabled:opacity-50 rounded-sm"
                    style={{ background: 'var(--sepia)', color: 'var(--cream)' }}
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{isDownloading ? 'Saving…' : 'Save for Social'}</span>
                    <span className="text-[9px] normal-case font-body tracking-normal opacity-65">
                      1080×1350 PNG
                    </span>
                  </button>
                </div>

                {/* Live Duo GIF Card */}
                {hasDuoBurstFrames && (
                  <div className="section-card space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" style={{ color: 'var(--vintage-brown)' }} />
                        <div>
                          <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--vintage-brown)' }}>
                            Live Duo Strip (GIF)
                          </p>
                          <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                            Looping iOS Live-style animation of both cameras
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex justify-center items-center min-h-[180px] rounded-sm p-3"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      {duoGifUrl ? (
                        <img
                          src={duoGifUrl}
                          alt="Animated duo live strip"
                          className="max-w-full max-h-64 object-contain shadow-sm"
                        />
                      ) : isEncodingDuoGif ? (
                        <div className="text-center space-y-2 py-6">
                          <div
                            className="w-6 h-6 mx-auto rounded-full border-2 border-t-transparent animate-spin"
                            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--vintage-brown)' }}
                          />
                          <p className="font-display text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                            Creating Duo GIF · {duoGifProgress}%
                          </p>
                        </div>
                      ) : duoGifError ? (
                        <p className="font-body text-xs" style={{ color: 'var(--sepia)' }}>{duoGifError}</p>
                      ) : (
                        <button
                          type="button"
                          onClick={buildDuoGif}
                          className="px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase"
                          style={{ border: '1px solid var(--border)', color: 'var(--vintage-brown)', background: 'var(--surface)' }}
                        >
                          Render Live Duo GIF
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={isEncodingDuoGif}
                      onClick={handleDownloadDuoGif}
                      className="w-full flex items-center justify-center gap-2 font-display text-[11px] tracking-widest uppercase px-4 py-3.5 rounded-sm transition-all active:scale-95 disabled:opacity-50"
                      style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                    >
                      <Download className="w-4 h-4" />
                      <span>{isEncodingDuoGif ? `Creating GIF (${duoGifProgress}%)…` : 'Save Live Duo Strip (.gif)'}</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={retakeAll}
                  className="w-full flex items-center justify-center gap-2 font-display text-[11px] tracking-widest uppercase px-6 py-4 rounded-sm transition-all active:scale-95"
                  style={{ border: '1px solid var(--border)', color: 'var(--vintage-brown)', background: 'var(--surface)' }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Shoot Another Duo Session
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
