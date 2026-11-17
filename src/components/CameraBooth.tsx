'use client'; // This is the magic fix

import { useRef, useState, useCallback, useEffect } from 'react'
import { FilterType, FILTERS, CountdownSeconds, SessionVideoData } from '@/lib/types'
import FilterSelector from '@/components/FilterSelector'
import {
  downloadUrl,
  formatDuration,
  selectSupportedVideoMimeType,
} from '@/lib/liveExport'

interface CameraBoothProps {
  filter: FilterType
  poseCount: number
  countdownSeconds: CountdownSeconds
  liveCaptureEnabled?: boolean
  includeAudio?: boolean
  onLiveCaptureToggle?: () => void
  onAudioToggle?: () => void
  onFilterChange: (f: FilterType) => void
  onPhotosCapture: (photos: string[], videoData?: SessionVideoData) => void
  onCancel: () => void
}

type BoothPhase = 'ready' | 'running' | 'confirm' | 'done'

function getCssFilter(filterId: FilterType): string {
  return FILTERS.find((f) => f.id === filterId)?.cssFilter ?? 'none'
}

// ── Icons ──────────────────────────────────────────────────────────────────
function CameraIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.96" />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--sepia)' }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}
function ZoomIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
function VideoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}
function MicIcon({ off = false }: { off?: boolean }) {
  return off ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}
function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

// ── Retake confirmation modal ──────────────────────────────────────────────
function RetakeModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in select-none"
      style={{ background: 'rgba(26,20,16,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="animate-scale-in rounded-sm p-6 max-w-sm w-full text-center space-y-4"
        style={{
          background: 'var(--aged-white)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center mb-1"><AlertIcon /></div>
        <h3 className="font-display text-lg font-bold" style={{ color: 'var(--vintage-brown)' }}>
          Retake All Photos?
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Are you sure you want to retake all photos? Your current shots will be lost.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 font-display text-xs tracking-widest uppercase py-3 transition-all active:scale-95"
            style={{ border: '1px solid var(--border)', color: 'var(--vintage-brown)', background: 'var(--surface)' }}
          >
            No, Keep
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 font-display text-xs tracking-widest uppercase py-3 transition-all active:scale-95"
            style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
          >
            Yes, Retake
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Photo lightbox ─────────────────────────────────────────────────────────
function PhotoLightbox({ photo, index, total, cssFilter, onClose }: {
  photo: string; index: number; total: number; cssFilter: string; onClose: () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(14,11,8,0.9)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div className="animate-scale-in relative" onClick={e => e.stopPropagation()}>
        <img
          src={photo}
          alt={`Photo ${index + 1}`}
          className="rounded-sm"
          style={{
            maxWidth: 'min(90vw, 560px)',
            maxHeight: 'min(80vh, 640px)',
            objectFit: 'contain',
            border: '5px solid white',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
            filter: cssFilter,
          }}
        />
        <div
          className="absolute -bottom-8 left-0 right-0 text-center font-display text-xs tracking-widest uppercase"
          style={{ color: 'rgba(245,240,232,0.5)' }}
        >
          Photo {index + 1} of {total}
        </div>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
          style={{ background: 'var(--vintage-brown)', color: 'white' }}
          aria-label="Close"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function CameraBooth({
  filter,
  poseCount,
  countdownSeconds,
  liveCaptureEnabled = true,
  includeAudio = false,
  onLiveCaptureToggle,
  onAudioToggle,
  onFilterChange,
  onPhotosCapture,
  onCancel,
}: CameraBoothProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isMountedRef = useRef(true)
  const isRunningRef = useRef(false)

  // Live capture & video recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const recRafRef = useRef<number | null>(null)
  const recTimerRef = useRef<number | null>(null)
  const burstIntervalRef = useRef<number | null>(null)
  const filterRef = useRef(filter)
  filterRef.current = filter

  const [phase, setPhase] = useState<BoothPhase>('ready')
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])
  const [sessionVideo, setSessionVideo] = useState<SessionVideoData | undefined>(undefined)
  const [showVideoPreview, setShowVideoPreview] = useState(false)
  const [recElapsedSec, setRecElapsedSec] = useState(0)
  const [isRecordingActive, setIsRecordingActive] = useState(false)
  const [currentShot, setCurrentShot] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [isCapturingPostLive, setIsCapturingPostLive] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [isPortraitCamera, setIsPortraitCamera] = useState(false)
  const [grainTick, setGrainTick] = useState(0)
  const [showRetakeModal, setShowRetakeModal] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<{ photo: string; index: number } | null>(null)
  const [showFilters, setShowFilters] = useState(true)

  useEffect(() => {
    if (filter !== 'grain') return
    const id = setInterval(() => setGrainTick((t) => t + 1), 130)
    return () => clearInterval(id)
  }, [filter])

  const startCamera = useCallback(async () => {
    setError(null); setCameraReady(false)
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: 'user' },
          audio: false,
        })
      } catch {
        // Fallback for mobile devices that reject explicit ideal dimensions
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
      }
      if (!isMountedRef.current) { stream.getTracks().forEach((t) => t.stop()); return }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          const v = videoRef.current
          if (v && v.videoWidth > 0 && v.videoHeight > 0 && isMountedRef.current) {
            setIsPortraitCamera(v.videoHeight > v.videoWidth)
          }
          v?.play()
            .then(() => { if (isMountedRef.current) setCameraReady(true) })
            .catch(() => { if (isMountedRef.current) setCameraReady(true) })
        }
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return
      const msg = err instanceof Error ? err.message : String(err)
      setError(
        msg.includes('Permission') || msg.includes('NotAllowed')
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : msg.includes('NotFound')
            ? 'No camera found. Please connect a camera and try again.'
            : msg.includes('NotReadable')
              ? 'Camera is in use by another app. Please close it and try again.'
              : 'Could not access the camera. Please check your browser settings.'
      )
    }
  }, [])

  const stopActiveRecordingLoops = useCallback(() => {
    if (burstIntervalRef.current !== null) {
      window.clearInterval(burstIntervalRef.current)
      burstIntervalRef.current = null
    }
    if (recTimerRef.current !== null) {
      window.clearInterval(recTimerRef.current)
      recTimerRef.current = null
    }
    if (recRafRef.current !== null) {
      window.cancelAnimationFrame(recRafRef.current)
      recRafRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        // ignore stop errors
      }
    }
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    micStreamRef.current = null
    setIsRecordingActive(false)
  }, [])

  useEffect(() => {
    isMountedRef.current = true
    startCamera()
    return () => {
      isMountedRef.current = false
      stopActiveRecordingLoops()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [startCamera, stopActiveRecordingLoops])

  // Capture clean mirrored frame (filters are applied non-destructively in preview/export)
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current, canvas = canvasRef.current
    if (!video || !canvas || video.videoWidth === 0) return null
    const w = video.videoWidth, h = video.videoHeight
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.save(); ctx.scale(-1, 1); ctx.drawImage(video, -w, 0, w, h); ctx.restore()
    return canvas.toDataURL('image/png')
  }, [])

  /** Capture a lightweight mirrored JPEG frame (<= 380px) for Live Motion / GIF strip */
  const captureBurstFrame = useCallback((burstCanvas: HTMLCanvasElement): string | null => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0) return null
    const maxW = 380
    const scale = Math.min(1, maxW / video.videoWidth)
    const w = Math.max(160, Math.round(video.videoWidth * scale))
    const h = Math.max(120, Math.round(video.videoHeight * scale))
    if (burstCanvas.width !== w || burstCanvas.height !== h) {
      burstCanvas.width = w
      burstCanvas.height = h
    }
    const ctx = burstCanvas.getContext('2d')
    if (!ctx) return null
    ctx.save()
    ctx.scale(-1, 1)
    ctx.drawImage(video, -w, 0, w, h)
    ctx.restore()
    return burstCanvas.toDataURL('image/jpeg', 0.78)
  }, [])

  const startSession = useCallback(async () => {
    if (isRunningRef.current || !cameraReady) return
    isRunningRef.current = true
    setPhase('running')
    setIsCapturingPostLive(false)
    setShowVideoPreview(false)

    if (sessionVideo?.videoUrl) {
      URL.revokeObjectURL(sessionVideo.videoUrl)
      setSessionVideo(undefined)
    }

    const LIVE_INTERVAL_MS = 150
    const LIVE_PRE_COUNT = 10 // 10 * 150ms = 1.5s before shutter
    const LIVE_POST_COUNT = 10 // 10 * 150ms = 1.5s after shutter

    const shots: string[] = []
    const liveBursts: string[][] = []
    const poseShutterOffsetsMs: number[] = []
    const burstCanvas = document.createElement('canvas')

    // Optional MediaRecorder + live timer setup (never blocks photo capture)
    let recordingWarning: string | undefined
    let chosenFormat: { mimeType: string; ext: 'mp4' | 'webm' } | null = null
    let hasCapturedAudio = false
    const recordedChunks: Blob[] = []
    let recorderStoppedPromise: Promise<Blob | null> | null = null
    let recStartedAt = Date.now()

    if (liveCaptureEnabled && streamRef.current) {
      let audioTrack: MediaStreamTrack | null = null
      if (includeAudio && navigator.mediaDevices?.getUserMedia) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          if (isMountedRef.current) {
            micStreamRef.current = micStream
            audioTrack = micStream.getAudioTracks()[0] ?? null
            hasCapturedAudio = Boolean(audioTrack)
          } else {
            micStream.getTracks().forEach((t) => t.stop())
          }
        } catch {
          recordingWarning = 'Microphone permission unavailable — captured silent 3s Live Photo.'
        }
      }

      recStartedAt = Date.now()
      setRecElapsedSec(0)
      setIsRecordingActive(true)
      recTimerRef.current = window.setInterval(() => {
        if (isMountedRef.current) {
          setRecElapsedSec(Math.floor((Date.now() - recStartedAt) / 1000))
        }
      }, 400)

      chosenFormat = selectSupportedVideoMimeType(Boolean(audioTrack))
      if (!chosenFormat) {
        recordingWarning =
          recordingWarning ??
          'Video clip recording is unsupported in this browser, but 3s Live GIF strip was captured.'
      } else {
        try {
          const videoEl = videoRef.current
          let recordStream: MediaStream | null = null

          // Record mirrored filtered stream via lightweight offscreen canvas if supported
          if (
            videoEl &&
            videoEl.videoWidth > 0 &&
            typeof HTMLCanvasElement !== 'undefined' &&
            typeof (document.createElement('canvas') as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream }).captureStream === 'function'
          ) {
            const recCanvas = document.createElement('canvas')
            const maxRecW = 720
            const rScale = Math.min(1, maxRecW / videoEl.videoWidth)
            recCanvas.width = Math.round(videoEl.videoWidth * rScale)
            recCanvas.height = Math.round(videoEl.videoHeight * rScale)
            const rCtx = recCanvas.getContext('2d')

            const drawRecFrame = () => {
              if (!isRunningRef.current || !rCtx || !videoRef.current) return
              rCtx.save()
              const cssF = getCssFilter(filterRef.current)
              if ('filter' in rCtx) {
                rCtx.filter = cssF
              }
              rCtx.scale(-1, 1)
              rCtx.drawImage(videoRef.current, -recCanvas.width, 0, recCanvas.width, recCanvas.height)
              rCtx.restore()
              recRafRef.current = window.requestAnimationFrame(drawRecFrame)
            }
            recRafRef.current = window.requestAnimationFrame(drawRecFrame)
            recordStream = recCanvas.captureStream(24)
            if (audioTrack) recordStream.addTrack(audioTrack)
          } else {
            const tracks = [...streamRef.current.getVideoTracks()]
            if (audioTrack) tracks.push(audioTrack)
            recordStream = new MediaStream(tracks)
          }

          let recorder: MediaRecorder
          try {
            const options: MediaRecorderOptions = {
              videoBitsPerSecond: 1_500_000,
              ...(chosenFormat.mimeType ? { mimeType: chosenFormat.mimeType } : {}),
            }
            recorder = new MediaRecorder(recordStream, options)
          } catch {
            // Fallback without explicit mimeType if container + audio codec mismatched
            recorder = new MediaRecorder(recordStream)
            chosenFormat = { mimeType: recorder.mimeType || 'video/webm', ext: 'webm' }
          }
          mediaRecorderRef.current = recorder

          recorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) recordedChunks.push(ev.data)
          }

          recorderStoppedPromise = new Promise<Blob | null>((resolve) => {
            recorder.onstop = () => {
              if (recordedChunks.length === 0) {
                resolve(null)
                return
              }
              const type = chosenFormat?.mimeType || recorder.mimeType || 'video/webm'
              resolve(new Blob(recordedChunks, { type }))
            }
            recorder.onerror = () => resolve(null)
          })

          recorder.start(250)
        } catch {
          recordingWarning =
            recordingWarning ??
            'Could not start video recorder on this device, but 3s Live GIF strip was captured.'
          recorderStoppedPromise = null
        }
      }
    }

    for (let shot = 0; shot < poseCount; shot++) {
      if (!isMountedRef.current) break
      setCurrentShot(shot)
      setIsCapturingPostLive(false)

      // Rolling ring buffer holding the final 1.5s of live motion leading into each shutter
      const preBurst: string[] = []
      if (liveCaptureEnabled) {
        const firstSample = captureBurstFrame(burstCanvas)
        if (firstSample) preBurst.push(firstSample)
        burstIntervalRef.current = window.setInterval(() => {
          const frame = captureBurstFrame(burstCanvas)
          if (frame) {
            preBurst.push(frame)
            if (preBurst.length > LIVE_PRE_COUNT) preBurst.shift()
          }
        }, LIVE_INTERVAL_MS)
      }

      for (let t = countdownSeconds; t > 0; t--) {
        if (!isMountedRef.current) break
        setCountdown(t)
        await new Promise((r) => setTimeout(r, 980))
      }

      if (burstIntervalRef.current !== null) {
        window.clearInterval(burstIntervalRef.current)
        burstIntervalRef.current = null
      }

      if (!isMountedRef.current) break
      setCountdown(0)
      setIsFlashing(true)
      const shutterOffsetMs = Date.now() - recStartedAt
      poseShutterOffsetsMs.push(shutterOffsetMs)

      const photo = captureFrame()
      const shutterBurstFrame = liveCaptureEnabled ? captureBurstFrame(burstCanvas) : null
      await new Promise((r) => setTimeout(r, 300))
      if (!isMountedRef.current) break
      setIsFlashing(false)

      // Capture 1.5s of post-shutter Live Photo motion & audio
      const postBurst: string[] = []
      if (liveCaptureEnabled && isMountedRef.current) {
        setIsCapturingPostLive(true)
        for (let p = 0; p < LIVE_POST_COUNT; p++) {
          if (!isMountedRef.current) break
          const frame = captureBurstFrame(burstCanvas)
          if (frame) postBurst.push(frame)
          if (p < LIVE_POST_COUNT - 1) {
            await new Promise((r) => setTimeout(r, LIVE_INTERVAL_MS))
          }
        }
        setIsCapturingPostLive(false)
      }

      if (photo) {
        shots.push(photo)
        if (liveCaptureEnabled) {
          // Ensure preBurst has consistent length before shutter
          const paddedPre =
            preBurst.length > 0
              ? preBurst
              : shutterBurstFrame
                ? [shutterBurstFrame]
                : []
          const fullBurst = [
            ...paddedPre,
            ...(shutterBurstFrame ? [shutterBurstFrame] : []),
            ...postBurst,
          ]
          liveBursts.push(fullBurst)
        }
        setCapturedPhotos([...shots])
      }
      if (shot < poseCount - 1) await new Promise((r) => setTimeout(r, 500))
    }

    isRunningRef.current = false
    setIsCapturingPostLive(false)
    const totalSec = Math.max(1, Math.round((Date.now() - recStartedAt) / 1000))

    // Stop MediaRecorder cleanly
    if (recTimerRef.current !== null) {
      window.clearInterval(recTimerRef.current)
      recTimerRef.current = null
    }
    if (recRafRef.current !== null) {
      window.cancelAnimationFrame(recRafRef.current)
      recRafRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch {
        // ignore
      }
    }
    micStreamRef.current?.getTracks().forEach((t) => t.stop())
    micStreamRef.current = null
    setIsRecordingActive(false)

    let videoBlob: Blob | undefined
    let videoUrl: string | undefined
    if (recorderStoppedPromise) {
      const blob = await Promise.race([
        recorderStoppedPromise,
        new Promise<null>((r) => setTimeout(() => r(null), 1200)),
      ])
      if (blob && blob.size > 0 && isMountedRef.current) {
        videoBlob = blob
        videoUrl = URL.createObjectURL(blob)
      }
    }

    if (isMountedRef.current && shots.length > 0) {
      if (liveCaptureEnabled) {
        setSessionVideo({
          liveFramesPerPose: liveBursts,
          shutterFrameIndex: LIVE_PRE_COUNT,
          videoBlob,
          videoUrl,
          videoMimeType: chosenFormat?.mimeType || 'video/webm',
          videoExt: chosenFormat?.ext || 'webm',
          durationSec: totalSec,
          poseShutterOffsetsMs,
          hasAudio: hasCapturedAudio,
          warning: recordingWarning,
        })
      } else {
        setSessionVideo(undefined)
      }
      setPhase('confirm')
    } else if (videoUrl) {
      URL.revokeObjectURL(videoUrl)
    }
  }, [
    cameraReady,
    poseCount,
    countdownSeconds,
    liveCaptureEnabled,
    includeAudio,
    sessionVideo,
    captureFrame,
    captureBurstFrame,
  ])

  const handleRetakeConfirm = () => {
    setShowRetakeModal(false)
    stopActiveRecordingLoops()
    if (sessionVideo?.videoUrl) {
      URL.revokeObjectURL(sessionVideo.videoUrl)
    }
    setSessionVideo(undefined)
    setShowVideoPreview(false)
    setCapturedPhotos([])
    setCurrentShot(0)
    setCountdown(0)
    setPhase('ready')
  }

  const handleConfirm = () => {
    setPhase('done')
    onPhotosCapture(capturedPhotos, sessionVideo)
  }

  const grainBg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
  const grainPos = `${(grainTick * 7) % 100}% ${(grainTick * 13) % 100}%`

  return (
    <>
      {showRetakeModal && (
        <RetakeModal
          onConfirm={handleRetakeConfirm}
          onCancel={() => setShowRetakeModal(false)}
        />
      )}

      {lightboxPhoto && (
        <PhotoLightbox
          photo={lightboxPhoto.photo}
          index={lightboxPhoto.index}
          total={capturedPhotos.length}
          cssFilter={getCssFilter(filter)}
          onClose={() => setLightboxPhoto(null)}
        />
      )}

      <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-[1200px] mx-auto px-0 sm:px-6 lg:px-8">
        {/* Viewfinder */}
        <div
          className={`relative w-full max-w-full overflow-hidden rounded-sm transition-all duration-300 ${
            isPortraitCamera ? 'aspect-[3/4] max-h-[60dvh]' : 'aspect-[4/3] max-h-[58dvh]'
          } sm:max-h-none sm:aspect-[16/9] lg:aspect-[5/3] lg:w-[120%] lg:max-w-none lg:-ml-[10%] viewfinder-fullscreen-expand`}
          style={{ background: 'var(--film-dark)' }}
        >
          <video
            ref={videoRef} autoPlay playsInline muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)', filter: getCssFilter(filter) }}
          />

          {filter === 'grain' && cameraReady && (
            <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20"
              style={{ backgroundImage: grainBg, backgroundSize: '160px 160px', backgroundPosition: grainPos }} />
          )}

          {!cameraReady && !error && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'var(--film-dark)' }}>
              <div className="text-center" style={{ color: 'rgba(245,240,232,0.5)' }}>
                <div className="flex justify-center mb-3 animate-pulse"><CameraIcon size={36} /></div>
                <p className="font-display text-xs tracking-widest uppercase">Starting camera...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: 'var(--film-dark)' }}>
              <div className="text-center max-w-xs">
                <div className="flex justify-center mb-3" style={{ color: 'rgba(196,152,106,0.8)' }}><AlertIcon /></div>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: 'rgba(245,240,232,0.8)' }}>{error}</p>
                <button onClick={startCamera}
                  className="font-display text-xs tracking-widest uppercase px-6 py-3 transition-all active:scale-95"
                  style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}>
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Viewfinder corners */}
          {cameraReady && phase !== 'confirm' && (
            <>
              <div className="absolute top-3 left-3 w-5 h-5 pointer-events-none" style={{ borderTop: '2px solid rgba(255,255,255,0.6)', borderLeft: '2px solid rgba(255,255,255,0.6)' }} />
              <div className="absolute top-3 right-3 w-5 h-5 pointer-events-none" style={{ borderTop: '2px solid rgba(255,255,255,0.6)', borderRight: '2px solid rgba(255,255,255,0.6)' }} />
              <div className="absolute bottom-3 left-3 w-5 h-5 pointer-events-none" style={{ borderBottom: '2px solid rgba(255,255,255,0.6)', borderLeft: '2px solid rgba(255,255,255,0.6)' }} />
              <div className="absolute bottom-3 right-3 w-5 h-5 pointer-events-none" style={{ borderBottom: '2px solid rgba(255,255,255,0.6)', borderRight: '2px solid rgba(255,255,255,0.6)' }} />
            </>
          )}

          {/* Recording indicator & Shot counter */}
          {cameraReady && phase === 'running' && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
              {isRecordingActive ? (
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs font-mono tracking-wider rounded-sm whitespace-nowrap"
                  style={{ background: 'rgba(26,20,16,0.82)', color: 'var(--cream)' }}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
                  <span>LIVE · {formatDuration(recElapsedSec)}</span>
                </div>
              ) : (
                <span />
              )}

              <div
                className="px-3 py-1 text-[11px] sm:text-xs font-mono tracking-widest rounded-sm whitespace-nowrap"
                style={{ background: 'rgba(26,20,16,0.82)', color: 'var(--cream)' }}
              >
                Shot {Math.min(currentShot + 1, poseCount)} / {poseCount}
              </div>
            </div>
          )}

          {/* Ready hint */}
          {cameraReady && phase === 'ready' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 max-w-[92%] px-3 py-1.5 sm:px-4 sm:py-2 rounded-sm text-[10px] sm:text-xs font-display tracking-widest uppercase whitespace-nowrap truncate" style={{ background: 'rgba(26,20,16,0.72)', color: 'rgba(245,240,232,0.92)' }}>
              Ready · {poseCount} shots · {countdownSeconds}s{liveCaptureEnabled ? ' · iOS Live Photo (3s)' : ''}
            </div>
          )}

          {/* Post-shutter 1.5s Live Photo motion indicator */}
          {phase === 'running' && isCapturingPostLive && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-sm flex items-center gap-2 pointer-events-none animate-fade-in"
              style={{ background: 'rgba(26,20,16,0.85)', border: '1px solid rgba(255,215,120,0.45)', color: '#fef3c7' }}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" aria-hidden="true" />
              <span className="font-display text-[10px] sm:text-xs tracking-widest uppercase whitespace-nowrap">
                Live Photo · Hold Pose (+1.5s)
              </span>
            </div>
          )}

          {/* Countdown */}
          {phase === 'running' && countdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ background: 'rgba(26,20,16,0.12)' }}>
              <div key={`${currentShot}-${countdown}`}
                className="countdown-number font-display font-bold text-white select-none"
                style={{ fontSize: 'clamp(80px, 20vw, 130px)', textShadow: '0 0 60px rgba(255,255,255,0.6), 0 4px 16px rgba(0,0,0,0.5)' }}>
                {countdown}
              </div>
            </div>
          )}

          {isFlashing && <div className="absolute inset-0 bg-white flash-overlay pointer-events-none" />}

          {phase === 'ready' && (
            <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 z-10">
              <FilterSelector
                selected={filter}
                onSelect={onFilterChange}
                compact
                isOpen={showFilters}
                onToggle={() => setShowFilters((open) => !open)}
              />
            </div>
          )}

          {/* Confirm overlay */}
          {phase === 'confirm' && capturedPhotos.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(26,20,16,0.8)' }}>
              <div className="text-center animate-fade-in-up px-4" style={{ color: 'var(--cream)' }}>
                <div className="flex justify-center mb-2" style={{ color: 'var(--vintage-pink)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <p className="font-display text-sm tracking-widest uppercase">All {poseCount} photos captured!</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(245,240,232,0.6)' }}>Tap a photo below to enlarge</p>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {/* Thumbnail strip & controls (responsive: stacked cleanly on mobile, single row on sm+) */}
        <div className="flex flex-col sm:flex-row sm:items-stretch gap-2.5 sm:gap-2 w-full lg:w-[120%] lg:-ml-[10%]">
          {phase === 'ready' && (
            <button onClick={onCancel}
              className="hidden sm:flex items-center justify-center gap-2 font-display text-xs tracking-widest uppercase py-3 px-4 flex-shrink-0 transition-all active:scale-95"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}>
              <ArrowLeftIcon />
              <span>Back</span>
            </button>
          )}

          {phase === 'confirm' && (
            <button onClick={() => setShowRetakeModal(true)} aria-label="Retake photos"
              className="hidden sm:flex items-center justify-center gap-2 font-display text-xs tracking-widest uppercase py-3 px-4 flex-shrink-0 transition-all active:scale-95"
              style={{ border: '1px solid var(--border)', color: 'var(--vintage-brown)', background: 'var(--surface)' }}>
              <span className="flex-shrink-0"><RefreshIcon /></span>
              <span>Retake</span>
            </button>
          )}

          <div className="flex flex-1 min-w-0 justify-center sm:justify-start gap-2 sm:gap-3 overflow-x-auto pb-1 sm:pb-5">
            {Array.from({ length: poseCount }).map((_, i) => {
              const photo = capturedPhotos[i]
              const isActive = i === currentShot && phase === 'running'
              const isClickable = !!photo && phase === 'confirm'
              return (
                <div key={i}
                  className={`flex-shrink-0 rounded-sm overflow-hidden transition-all duration-300 ${isClickable ? 'cursor-pointer' : ''}`}
                  style={{
                    width: `${Math.min(82, Math.max(48, 320 / poseCount))}px`,
                    aspectRatio: '4/3',
                    border: photo
                      ? `2px solid var(--vintage-brown)`
                      : isActive
                        ? `2px dashed var(--sepia)`
                        : `2px dashed var(--border)`,
                    position: 'relative',
                    opacity: photo ? 1 : 0.5,
                  }}
                  onClick={() => isClickable && setLightboxPhoto({ photo: photo!, index: i })}
                >
                  {photo ? (
                    <>
                      <img
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                        style={{ filter: getCssFilter(filter) }}
                      />
                      {isClickable && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-150"
                          style={{ background: 'rgba(26,20,16,0.5)' }}>
                          <ZoomIcon />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--surface)' }}>
                      <span className={`text-xs font-mono ${isActive ? 'animate-pulse' : ''}`} style={{ color: isActive ? 'var(--vintage-brown)' : 'var(--border)' }}>
                        {isActive ? '◉' : String(i + 1)}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {phase === 'ready' && (
            <div className="w-full sm:w-[36%] flex-shrink-0">
              <div className="flex gap-2">
                <button onClick={onCancel}
                  className="sm:hidden flex items-center justify-center gap-1.5 font-display text-xs tracking-widest uppercase py-3.5 px-4 flex-shrink-0 transition-all active:scale-95 rounded-sm"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}>
                  <ArrowLeftIcon />
                  <span>Back</span>
                </button>
                <button onClick={startSession} disabled={!cameraReady}
                  className="flex-1 flex items-center justify-center gap-2 font-display text-xs sm:text-sm tracking-widest uppercase py-3.5 sm:py-4 px-4 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                  style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}>
                  <CameraIcon />
                  <span>Start Photobooth</span>
                </button>
              </div>
              <p className="text-center text-[10px] leading-tight font-body mt-1.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                {poseCount} photos · {countdownSeconds}s countdown each · fully automatic
              </p>
            </div>
          )}

          {phase === 'confirm' && (
            <div className="w-full sm:w-[30%] sm:self-center flex-shrink-0 flex gap-2">
              <button onClick={() => setShowRetakeModal(true)} aria-label="Retake photos"
                className="sm:hidden flex items-center justify-center gap-1.5 font-display text-xs tracking-widest uppercase py-3.5 px-4 flex-shrink-0 transition-all active:scale-95 rounded-sm"
                style={{ border: '1px solid var(--border)', color: 'var(--vintage-brown)', background: 'var(--surface)' }}>
                <RefreshIcon />
                <span>Retake</span>
              </button>
              <button onClick={handleConfirm} aria-label="Looks great, continue"
                  className="flex-1 flex items-center justify-center gap-2 font-display text-xs sm:text-sm tracking-widest uppercase py-3.5 sm:py-4 px-4 transition-all duration-200 active:scale-95 rounded-sm"
                style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}>
                <CheckIcon />
                <span>Looks Great!</span>
              </button>
            </div>
          )}
        </div>

        {/* Optional Live Motion & Mic Controls when Ready */}
        {phase === 'ready' && (onLiveCaptureToggle || onAudioToggle) && (
          <div
            className="w-full lg:w-[120%] lg:-ml-[10%] px-3 py-2.5 rounded-sm flex flex-wrap items-center justify-between gap-2"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span style={{ color: liveCaptureEnabled ? 'var(--vintage-brown)' : 'var(--text-muted)' }}>
                <VideoIcon />
              </span>
              <span className="font-display text-[11px] tracking-wider uppercase" style={{ color: 'var(--text-secondary)' }}>
                iOS Live Photo (3s)
              </span>
              <span className="hidden sm:inline font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                · 1.5s before &amp; after shutter + audio &amp; GIF
              </span>
            </div>

            <div className="flex items-center gap-2">
              {liveCaptureEnabled && onAudioToggle && (
                <button
                  type="button"
                  onClick={onAudioToggle}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-display text-[10px] tracking-widest uppercase transition-all active:scale-95"
                  style={{
                    border: '1px solid var(--border)',
                    background: includeAudio ? 'rgba(92,61,30,0.1)' : 'var(--surface-2)',
                    color: includeAudio ? 'var(--vintage-brown)' : 'var(--text-muted)',
                  }}
                  title={includeAudio ? 'Microphone audio enabled for video' : 'Silent video (no mic prompt)'}
                >
                  <MicIcon off={!includeAudio} />
                  <span>{includeAudio ? 'Mic On' : 'Mic Off'}</span>
                </button>
              )}

              {onLiveCaptureToggle && (
                <button
                  type="button"
                  onClick={onLiveCaptureToggle}
                  className={`toggle-track flex-shrink-0 ${liveCaptureEnabled ? 'on' : ''}`}
                  aria-label="Toggle live motion and video recording"
                >
                  <div className="toggle-thumb" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Recorded Video Preview Drawer in Confirm Phase */}
        {phase === 'confirm' && sessionVideo?.videoUrl && (
          <div
            className="w-full md:w-[115%] md:-ml-[7.5%] lg:w-[130%] lg:-ml-[15%] p-3 rounded-sm space-y-2.5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--vintage-brown)' }}><VideoIcon /></span>
                <span className="font-display text-[11px] tracking-widest uppercase" style={{ color: 'var(--vintage-brown)' }}>
                  Session Video ({formatDuration(sessionVideo.durationSec ?? 0)})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVideoPreview((v) => !v)}
                  className="px-2.5 py-1 rounded-sm font-display text-[10px] tracking-widest uppercase"
                  style={{ border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
                >
                  {showVideoPreview ? 'Hide Clip' : 'Watch Clip'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const dateStr = new Date().toISOString().split('T')[0]
                    downloadUrl(sessionVideo.videoUrl!, `jellybooth_session_${dateStr}.${sessionVideo.videoExt || 'webm'}`)
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-sm font-display text-[10px] tracking-widest uppercase"
                  style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                >
                  <DownloadIcon />
                  Save Video
                </button>
              </div>
            </div>

            {sessionVideo.warning && (
              <p className="font-body text-xs" style={{ color: 'var(--sepia)' }}>
                {sessionVideo.warning}
              </p>
            )}

            {showVideoPreview && (
              <video
                src={sessionVideo.videoUrl}
                controls
                playsInline
                loop
                className="w-full max-h-64 rounded-sm bg-black object-contain"
              />
            )}
          </div>
        )}

        {/* Controls */}
        {phase === 'running' && (
          <div className="flex items-center justify-center gap-3 py-2">
            {Array.from({ length: poseCount }).map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i < capturedPhotos.length ? '' :
                  i === currentShot ? 'scale-125 animate-pulse' : ''
                }`}
                style={{
                  background: i < capturedPhotos.length ? 'var(--vintage-brown)' :
                    i === currentShot ? 'var(--sepia)' : 'var(--border)',
                }} />
            ))}
            <span className="ml-2 font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              {countdown > 0
                ? `Shooting in ${countdown}…`
                : isCapturingPostLive
                  ? 'Capturing +1.5s Live Photo…'
                  : 'Hold still!'}
            </span>
          </div>
        )}

        {phase === 'done' && (
          <div className="text-center py-3">
            <p className="font-display text-xs tracking-widest uppercase animate-pulse" style={{ color: 'var(--text-muted)' }}>
              Preparing your strip…
            </p>
          </div>
        )}
      </div>
    </>
  )
}