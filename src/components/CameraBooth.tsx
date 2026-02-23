'use client'; // This is the magic fix

import { useRef, useState, useCallback, useEffect } from 'react'
import { FilterType, FILTERS, CountdownSeconds } from '@/lib/types'

interface CameraBoothProps {
  filter: FilterType
  poseCount: number
  countdownSeconds: CountdownSeconds
  onPhotosCapture: (photos: string[]) => void
  onCancel: () => void
}

type BoothPhase = 'ready' | 'running' | 'confirm' | 'done'

function getCssFilter(filterId: FilterType): string {
  return FILTERS.find((f) => f.id === filterId)?.cssFilter ?? 'none'
}

function applyPixelFilter(ctx: CanvasRenderingContext2D, filter: FilterType, x: number, y: number, w: number, h: number) {
  if (filter === 'none') return
  try {
    const imageData = ctx.getImageData(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
    const d = imageData.data
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2]
      switch (filter) {
        case 'sepia':
          d[i]   = Math.min(255, (r * 0.393 + g * 0.769 + b * 0.189) * 1.05)
          d[i+1] = Math.min(255, (r * 0.349 + g * 0.686 + b * 0.168) * 1.05)
          d[i+2] = Math.min(255, (r * 0.272 + g * 0.534 + b * 0.131) * 1.05)
          break
        case 'bw': case 'noir': {
          const lum = r * 0.299 + g * 0.587 + b * 0.114
          const c = filter === 'noir' ? (lum - 128) * 1.4 + 128 : (lum - 128) * 1.15 + 128
          d[i] = d[i+1] = d[i+2] = Math.min(255, Math.max(0, c)); break
        }
        case 'warm':
          d[i] = Math.min(255, r * 1.1 + 12); d[i+1] = Math.min(255, g * 0.94); d[i+2] = Math.min(255, b * 0.82); break
        case 'grain': {
          const n = (Math.random() - 0.5) * 22
          d[i] = Math.min(255, Math.max(0, r * 1.03 + n)); d[i+1] = Math.min(255, Math.max(0, g * 0.97 + n)); d[i+2] = Math.min(255, Math.max(0, b * 0.91 + n)); break
        }
        case 'faded':
          d[i] = Math.min(255, r * 0.85 + 30); d[i+1] = Math.min(255, g * 0.85 + 28); d[i+2] = Math.min(255, b * 0.85 + 25); break
        case 'cool':
          d[i] = Math.min(255, r * 0.85); d[i+1] = Math.min(255, g * 0.95); d[i+2] = Math.min(255, b * 1.2); break
        case 'golden':
          d[i] = Math.min(255, r * 1.15 + 15); d[i+1] = Math.min(255, g * 1.02 + 5); d[i+2] = Math.min(255, b * 0.72); break
        case 'dreamy':
          d[i] = Math.min(255, r * 1.05 + 15); d[i+1] = Math.min(255, g * 1.0 + 10); d[i+2] = Math.min(255, b * 1.1 + 15); break
        case 'lomo': {
          const sat = Math.max(r, g, b) - Math.min(r, g, b)
          d[i] = Math.min(255, r + sat * 0.3); d[i+1] = Math.min(255, g * 0.9); d[i+2] = Math.min(255, b * 0.9); break
        }
        case 'vintage90s':
          d[i] = Math.min(255, r * 1.08 + 8); d[i+1] = Math.min(255, g * 1.02 + 5); d[i+2] = Math.min(255, b * 0.88); break
        case 'y2k':
          d[i] = Math.min(255, r * 1.1 + 10); d[i+1] = Math.min(255, g * 1.05); d[i+2] = Math.min(255, b * 1.15 + 8); break
        case 'sunburn':
          d[i] = Math.min(255, r * 1.2 + 20); d[i+1] = Math.min(255, g * 1.0 + 5); d[i+2] = Math.min(255, b * 0.75); break
        case 'matte':
          d[i] = Math.min(255, r * 0.9 + 20); d[i+1] = Math.min(255, g * 0.9 + 20); d[i+2] = Math.min(255, b * 0.9 + 20); break
        case 'pinky':
          d[i] = Math.min(255, r * 1.1 + 15); d[i+1] = Math.min(255, g * 0.9 + 5); d[i+2] = Math.min(255, b * 1.05 + 10); break
      }
    }
    ctx.putImageData(imageData, Math.round(x), Math.round(y))
  } catch { /* ignore */ }
}

// ── Icons ──────────────────────────────────────────────────────────────────
function CameraIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-3.96"/>
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}
function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--sepia)' }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}
function ZoomIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
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
function PhotoLightbox({ photo, index, total, onClose }: {
  photo: string; index: number; total: number; onClose: () => void
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
export default function CameraBooth({ filter, poseCount, countdownSeconds, onPhotosCapture, onCancel }: CameraBoothProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isMountedRef = useRef(true)
  const isRunningRef = useRef(false)

  const [phase, setPhase] = useState<BoothPhase>('ready')
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([])
  const [currentShot, setCurrentShot] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [isFlashing, setIsFlashing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [grainTick, setGrainTick] = useState(0)
  const [showRetakeModal, setShowRetakeModal] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<{ photo: string; index: number } | null>(null)

  useEffect(() => {
    if (filter !== 'grain') return
    const id = setInterval(() => setGrainTick((t) => t + 1), 130)
    return () => clearInterval(id)
  }, [filter])

  const startCamera = useCallback(async () => {
    setError(null); setCameraReady(false)
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: 'user' },
        audio: false,
      })
      if (!isMountedRef.current) { stream.getTracks().forEach((t) => t.stop()); return }
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
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

  useEffect(() => {
    isMountedRef.current = true
    startCamera()
    return () => {
      isMountedRef.current = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [startCamera])

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current, canvas = canvasRef.current
    if (!video || !canvas || video.videoWidth === 0) return null
    const w = video.videoWidth, h = video.videoHeight
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.save(); ctx.scale(-1, 1); ctx.drawImage(video, -w, 0, w, h); ctx.restore()
    if (filter !== 'none') applyPixelFilter(ctx, filter, 0, 0, w, h)
    return canvas.toDataURL('image/png')
  }, [filter])

  const startSession = useCallback(async () => {
    if (isRunningRef.current || !cameraReady) return
    isRunningRef.current = true
    setPhase('running')
    const shots: string[] = []

    for (let shot = 0; shot < poseCount; shot++) {
      if (!isMountedRef.current) break
      setCurrentShot(shot)
      for (let t = countdownSeconds; t > 0; t--) {
        if (!isMountedRef.current) break
        setCountdown(t)
        await new Promise((r) => setTimeout(r, 980))
      }
      if (!isMountedRef.current) break
      setCountdown(0)
      setIsFlashing(true)
      const photo = captureFrame()
      await new Promise((r) => setTimeout(r, 300))
      if (!isMountedRef.current) break
      setIsFlashing(false)
      if (photo) { shots.push(photo); setCapturedPhotos([...shots]) }
      if (shot < poseCount - 1) await new Promise((r) => setTimeout(r, 600))
    }

    isRunningRef.current = false
    if (isMountedRef.current && shots.length > 0) setPhase('confirm')
  }, [cameraReady, poseCount, countdownSeconds, captureFrame])

  const handleRetakeConfirm = () => {
    setShowRetakeModal(false)
    setCapturedPhotos([])
    setCurrentShot(0)
    setCountdown(0)
    setPhase('ready')
  }

  const handleConfirm = () => {
    setPhase('done')
    onPhotosCapture(capturedPhotos)
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
          onClose={() => setLightboxPhoto(null)}
        />
      )}

      <div className="flex flex-col gap-4">
        {/* Viewfinder */}
        <div
          className="relative rounded-sm overflow-hidden aspect-[4/3] w-full"
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

          {/* Shot counter */}
          {cameraReady && phase === 'running' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-mono tracking-widest rounded-full" style={{ background: 'rgba(26,20,16,0.8)', color: 'var(--cream)' }}>
              Shot {Math.min(currentShot + 1, poseCount)} / {poseCount}
            </div>
          )}

          {/* Ready hint */}
          {cameraReady && phase === 'ready' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-display tracking-widest uppercase" style={{ background: 'rgba(26,20,16,0.7)', color: 'rgba(245,240,232,0.9)' }}>
              Ready · {poseCount} shots · {countdownSeconds}s countdown
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

          {/* Confirm overlay */}
          {phase === 'confirm' && capturedPhotos.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(26,20,16,0.8)' }}>
              <div className="text-center animate-fade-in-up px-4" style={{ color: 'var(--cream)' }}>
                <div className="flex justify-center mb-2" style={{ color: 'var(--vintage-pink)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <p className="font-display text-sm tracking-widest uppercase">All {poseCount} photos captured!</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(245,240,232,0.6)' }}>Tap a photo below to enlarge</p>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        {/* Thumbnail strip */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: poseCount }).map((_, i) => {
            const photo = capturedPhotos[i]
            const isActive = i === currentShot && phase === 'running'
            const isClickable = !!photo && phase === 'confirm'
            return (
              <div key={i}
                className={`flex-shrink-0 rounded-sm overflow-hidden transition-all duration-300 ${isClickable ? 'cursor-pointer' : ''}`}
                style={{
                  width: `${Math.min(80, 340 / poseCount)}px`,
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
                    <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
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

        {/* Controls */}
        {phase === 'ready' && (
          <>
            <div className="flex gap-3">
              <button onClick={onCancel}
                className="flex items-center gap-2 font-display text-xs tracking-widest uppercase py-3 px-4 transition-all flex-shrink-0 active:scale-95"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}>
                <ArrowLeftIcon />
                Back
              </button>
              <button onClick={startSession} disabled={!cameraReady}
                className="flex-1 flex items-center justify-center gap-2.5 font-display text-sm tracking-widest uppercase py-4 transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}>
                <CameraIcon />
                Start Photobooth
              </button>
            </div>
            <p className="text-center text-xs font-body" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
              {poseCount} photos · {countdownSeconds}s countdown each · fully automatic
            </p>
          </>
        )}

        {phase === 'running' && (
          <div className="flex items-center justify-center gap-3 py-2">
            {Array.from({ length: poseCount }).map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i < capturedPhotos.length ? '' :
                i === currentShot ? 'scale-125 animate-pulse' : ''
              }`}
              style={{
                background: i < capturedPhotos.length ? 'var(--vintage-brown)' :
                  i === currentShot ? 'var(--sepia)' : 'var(--border)',
              }} />
            ))}
            <span className="ml-2 font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              {countdown > 0 ? `Shooting in ${countdown}…` : 'Hold still!'}
            </span>
          </div>
        )}

        {phase === 'confirm' && (
          <div className="space-y-3">
            <p className="text-center font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              How do your shots look?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowRetakeModal(true)}
                className="flex-1 flex items-center justify-center gap-2 font-display text-xs tracking-widest uppercase px-4 py-4 transition-all active:scale-95"
                style={{ border: '1px solid var(--border)', color: 'var(--vintage-brown)', background: 'var(--surface)' }}>
                <RefreshIcon />
                Retake
              </button>
              <button onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-2 font-display text-sm tracking-widest uppercase py-4 transition-all duration-200 active:scale-95 shadow-lg"
                style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}>
                <CheckIcon />
                Looks Great!
              </button>
            </div>
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
