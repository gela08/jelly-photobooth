'use client';

import { useEffect, useRef, useState, useCallback } from 'react'
import { PhotoSession, SessionVideoData } from '@/lib/types'
import { generatePhotoboothCanvas, downloadPhoto } from '@/lib/canvasExport'
import {
  ExtractedLiveAudio,
  RenderedLiveStripFrames,
  downloadUrl,
  extractPoseAudioSlice,
  formatDuration,
  generateLivePhotoStripVideo,
  generateLiveStripGif,
  renderLiveStripFrames,
} from '@/lib/liveExport'
import BoothPrinterAnimation from './BoothPrinterAnimation'

interface ExportPanelProps {
  session: PhotoSession
  sessionVideo?: SessionVideoData
  onRetake: () => void
}

// --- Icons ---
const PrintIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
  </svg>
)

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.96"/>
  </svg>
)

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const LiveGifIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
  </svg>
)

const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
)

const DownloadSmIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
)

const AlertIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

function NewSessionConfirmModal({
  hasSavedAny,
  isSaving,
  onQuickSavePrint,
  onCancel,
  onConfirm,
}: {
  hasSavedAny: boolean
  isSaving: boolean
  onQuickSavePrint: () => void
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in select-none"
      style={{ background: 'rgba(26,20,16,0.8)', backdropFilter: 'blur(5px)' }}
      onClick={onCancel}
    >
      <div
        className="animate-scale-in rounded-sm p-7 max-w-sm w-full text-center space-y-4"
        style={{
          background: 'var(--aged-white)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.42)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center" style={{ color: 'var(--sepia)' }}>
          <AlertIcon />
        </div>
        <h3 className="font-display text-xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
          {hasSavedAny ? 'Start a New Session?' : 'Save Your Photos First?'}
        </h3>
        <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {hasSavedAny
            ? 'Starting a new session will clear your current strip, Live Photo, and video clips.'
            : "You haven't downloaded your strip yet. Save it now so you don't lose your photos, Live Photo, or video clips."}
        </p>

        <div className="space-y-2 pt-1">
          {!hasSavedAny && (
            <button
              type="button"
              disabled={isSaving}
              onClick={onQuickSavePrint}
              className="w-full flex items-center justify-center gap-2 font-display text-xs tracking-widest uppercase py-3.5 rounded-sm transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'var(--sepia)', color: 'var(--cream)' }}
            >
              <DownloadSmIcon />
              <span>{isSaving ? 'Saving Strip…' : 'Save Strip PNG First'}</span>
            </button>
          )}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 font-display text-xs tracking-widest uppercase py-3 rounded-sm transition-all active:scale-95"
              style={{ border: '1px solid var(--border)', color: 'var(--vintage-brown)', background: 'var(--surface)' }}
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 font-display text-xs tracking-widest uppercase py-3 rounded-sm transition-all active:scale-95"
              style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
            >
              New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ExportPanel({ session, sessionVideo, onRetake }: ExportPanelProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [printerDone, setPrinterDone] = useState(false)
  const [hasSavedAny, setHasSavedAny] = useState(false)
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)

  // Live Strip GIF state
  const [liveGifUrl, setLiveGifUrl] = useState<string | null>(null)
  const [gifProgress, setGifProgress] = useState(0)
  const [isEncodingGif, setIsEncodingGif] = useState(false)
  const [gifError, setGifError] = useState<string | null>(null)

  // iOS Live Photo (3s interactive player + 3s MP4/WebM export with audio)
  const [liveFramesData, setLiveFramesData] = useState<RenderedLiveStripFrames | null>(null)
  const [isRenderingLiveFrames, setIsRenderingLiveFrames] = useState(false)
  const [liveFramesProgress, setLiveFramesProgress] = useState(0)
  const [selectedAudioPose, setSelectedAudioPose] = useState(0)
  const [liveAudioSlice, setLiveAudioSlice] = useState<ExtractedLiveAudio | null>(null)
  const [isPlayingLivePhoto, setIsPlayingLivePhoto] = useState(false)
  const [livePlayIndex, setLivePlayIndex] = useState<number | null>(null)
  const [livePlayProgress, setLivePlayProgress] = useState(0)

  const [liveVideoUrl, setLiveVideoUrl] = useState<string | null>(null)
  const [liveVideoExt, setLiveVideoExt] = useState<'mp4' | 'webm'>('webm')
  const [liveVideoHasAudio, setLiveVideoHasAudio] = useState(false)
  const [isEncodingLiveVideo, setIsEncodingLiveVideo] = useState(false)
  const [liveVideoProgress, setLiveVideoProgress] = useState(0)
  const [liveVideoError, setLiveVideoError] = useState<string | null>(null)

  const genIdRef = useRef(0)
  const gifJobIdRef = useRef(0)
  const liveFramesJobRef = useRef(0)
  const liveVideoJobRef = useRef(0)
  const liveGifUrlRef = useRef<string | null>(null)
  const liveVideoUrlRef = useRef<string | null>(null)
  const liveWavUrlRef = useRef<string | null>(null)
  const liveAudioElRef = useRef<HTMLAudioElement | null>(null)
  const livePlayRafRef = useRef<number | null>(null)

  const hasLiveFrames = Boolean(
    session.liveFramesPerPose?.some((frames) => frames && frames.length > 0)
  )

  const generatePreview = useCallback(async () => {
    const id = ++genIdRef.current
    setIsGenerating(true)
    try {
      const canvas = await generatePhotoboothCanvas(session)
      if (genIdRef.current === id) {
        setPreviewUrl(canvas.toDataURL('image/png'))
      }
    } catch (err) {
      console.error('Preview failed:', err)
    } finally {
      if (genIdRef.current === id) setIsGenerating(false)
    }
  }, [session])

  useEffect(() => {
    generatePreview()
  }, [generatePreview])

  // Clean up generated Object URLs & playback timers on unmount
  useEffect(() => {
    return () => {
      if (livePlayRafRef.current !== null) {
        window.cancelAnimationFrame(livePlayRafRef.current)
      }
      if (liveAudioElRef.current) {
        liveAudioElRef.current.pause()
        liveAudioElRef.current = null
      }
      if (liveGifUrlRef.current) {
        URL.revokeObjectURL(liveGifUrlRef.current)
        liveGifUrlRef.current = null
      }
      if (liveVideoUrlRef.current) {
        URL.revokeObjectURL(liveVideoUrlRef.current)
        liveVideoUrlRef.current = null
      }
      if (liveWavUrlRef.current) {
        URL.revokeObjectURL(liveWavUrlRef.current)
        liveWavUrlRef.current = null
      }
    }
  }, [])

  // Pre-render 3s iOS Live Photo strip frames once printer animation completes
  const buildLiveFrames = useCallback(async (): Promise<RenderedLiveStripFrames | null> => {
    if (!hasLiveFrames) return null
    if (liveFramesData) return liveFramesData

    const jobId = ++liveFramesJobRef.current
    setIsRenderingLiveFrames(true)
    setLiveFramesProgress(0)
    try {
      const rendered = await renderLiveStripFrames(session, 720, (pct) => {
        if (liveFramesJobRef.current === jobId) setLiveFramesProgress(pct)
      })
      if (liveFramesJobRef.current === jobId) {
        setLiveFramesData(rendered)
        return rendered
      }
      return null
    } catch {
      return null
    } finally {
      if (liveFramesJobRef.current === jobId) setIsRenderingLiveFrames(false)
    }
  }, [hasLiveFrames, liveFramesData, session])

  // Slice 3.0s audio (±1.5s around shutter) whenever selectedAudioPose or videoBlob changes
  useEffect(() => {
    if (!printerDone || !sessionVideo?.videoBlob || !sessionVideo?.hasAudio) {
      setLiveAudioSlice(null)
      return
    }

    let cancelled = false
    const offsets = sessionVideo.poseShutterOffsetsMs ?? []
    const shutterMs = offsets[selectedAudioPose] ?? offsets[0] ?? 1500

    extractPoseAudioSlice(sessionVideo.videoBlob, shutterMs, 1.5, 1.5).then((slice) => {
      if (cancelled) {
        if (slice?.wavUrl) URL.revokeObjectURL(slice.wavUrl)
        return
      }
      if (liveWavUrlRef.current) {
        URL.revokeObjectURL(liveWavUrlRef.current)
      }
      liveWavUrlRef.current = slice?.wavUrl ?? null
      setLiveAudioSlice(slice)
      // Invalidate previously encoded 3s Live Photo video if audio pose switched
      if (liveVideoUrlRef.current) {
        URL.revokeObjectURL(liveVideoUrlRef.current)
        liveVideoUrlRef.current = null
        setLiveVideoUrl(null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [printerDone, sessionVideo?.videoBlob, sessionVideo?.hasAudio, sessionVideo?.poseShutterOffsetsMs, selectedAudioPose])

  const buildLiveGif = useCallback(async (): Promise<string | null> => {
    if (!hasLiveFrames) return null
    if (liveGifUrlRef.current) return liveGifUrlRef.current

    const jobId = ++gifJobIdRef.current
    setIsEncodingGif(true)
    setGifError(null)
    setGifProgress(0)

    try {
      const result = await generateLiveStripGif(session, (pct) => {
        if (gifJobIdRef.current === jobId) setGifProgress(pct)
      })
      if (gifJobIdRef.current === jobId) {
        liveGifUrlRef.current = result.url
        setLiveGifUrl(result.url)
        return result.url
      } else {
        URL.revokeObjectURL(result.url)
        return null
      }
    } catch {
      if (gifJobIdRef.current === jobId) {
        setGifError('Could not render Live GIF strip on this browser.')
      }
      return null
    } finally {
      if (gifJobIdRef.current === jobId) setIsEncodingGif(false)
    }
  }, [hasLiveFrames, session])

  // Wait until printer animation settles so mobile 60fps CSS slide stays butter-smooth
  useEffect(() => {
    if (printerDone && hasLiveFrames) {
      if (!liveFramesData && !isRenderingLiveFrames) {
        buildLiveFrames()
      }
      if (!liveGifUrlRef.current && !isEncodingGif) {
        buildLiveGif()
      }
    }
  }, [
    printerDone,
    hasLiveFrames,
    liveFramesData,
    isRenderingLiveFrames,
    isEncodingGif,
    buildLiveFrames,
    buildLiveGif,
  ])

  const stopLivePhotoPlayback = useCallback(() => {
    if (livePlayRafRef.current !== null) {
      window.cancelAnimationFrame(livePlayRafRef.current)
      livePlayRafRef.current = null
    }
    if (liveAudioElRef.current) {
      liveAudioElRef.current.pause()
      liveAudioElRef.current.currentTime = 0
    }
    setIsPlayingLivePhoto(false)
    setLivePlayIndex(null)
    setLivePlayProgress(0)
  }, [])

  const startLivePhotoPlayback = useCallback(async () => {
    const rendered = liveFramesData || (await buildLiveFrames())
    if (!rendered || rendered.frameUrls.length === 0) return

    stopLivePhotoPlayback()
    setIsPlayingLivePhoto(true)
    setLivePlayProgress(0)

    if (liveAudioSlice?.wavUrl) {
      try {
        if (!liveAudioElRef.current || liveAudioElRef.current.src !== liveAudioSlice.wavUrl) {
          liveAudioElRef.current = new Audio(liveAudioSlice.wavUrl)
        }
        liveAudioElRef.current.currentTime = 0
        await liveAudioElRef.current.play().catch(() => {})
      } catch {
        // ignore audio autoplay block
      }
    }

    const totalMs = 3000
    const startAt = performance.now()
    const totalFrames = rendered.frameUrls.length

    const step = () => {
      const elapsed = performance.now() - startAt
      const ratio = Math.min(1, elapsed / totalMs)
      const idx = Math.min(totalFrames - 1, Math.floor(ratio * totalFrames))
      setLivePlayIndex(idx)
      setLivePlayProgress(Math.round(ratio * 100))

      if (elapsed >= totalMs) {
        stopLivePhotoPlayback()
        return
      }
      livePlayRafRef.current = window.requestAnimationFrame(step)
    }

    livePlayRafRef.current = window.requestAnimationFrame(step)
  }, [liveFramesData, buildLiveFrames, liveAudioSlice?.wavUrl, stopLivePhotoPlayback])

  const handleDownload = async (format: 'print' | 'social') => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      await downloadPhoto(session, format)
      setHasSavedAny(true)
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setTimeout(() => setIsDownloading(false), 1200)
    }
  }

  const handleDownloadGif = async () => {
    const dateStr = new Date().toISOString().split('T')[0]
    const url = liveGifUrl || (await buildLiveGif())
    if (url) {
      downloadUrl(url, `jellybooth_${dateStr}_live.gif`)
      setHasSavedAny(true)
    }
  }

  const handleDownloadLivePhotoVideo = async () => {
    if (isEncodingLiveVideo) return
    const dateStr = new Date().toISOString().split('T')[0]

    if (liveVideoUrlRef.current) {
      downloadUrl(liveVideoUrlRef.current, `jellybooth_${dateStr}_live_photo.${liveVideoExt}`)
      setHasSavedAny(true)
      return
    }

    const jobId = ++liveVideoJobRef.current
    setIsEncodingLiveVideo(true)
    setLiveVideoError(null)
    setLiveVideoProgress(0)

    try {
      const rendered = liveFramesData || (await buildLiveFrames())
      if (!rendered) {
        throw new Error('Live frames unavailable')
      }
      const result = await generateLivePhotoStripVideo(
        rendered,
        liveAudioSlice?.audioBuffer ?? null,
        (pct) => {
          if (liveVideoJobRef.current === jobId) setLiveVideoProgress(pct)
        }
      )
      if (liveVideoJobRef.current === jobId) {
        liveVideoUrlRef.current = result.url
        setLiveVideoUrl(result.url)
        setLiveVideoExt(result.ext)
        setLiveVideoHasAudio(result.hasAudio)
        downloadUrl(result.url, `jellybooth_${dateStr}_live_photo.${result.ext}`)
        setHasSavedAny(true)
      } else {
        URL.revokeObjectURL(result.url)
      }
    } catch {
      if (liveVideoJobRef.current === jobId) {
        setLiveVideoError('Could not render 3s Live Photo video on this browser.')
      }
    } finally {
      if (liveVideoJobRef.current === jobId) setIsEncodingLiveVideo(false)
    }
  }

  const handleDownloadVideo = () => {
    if (!sessionVideo?.videoUrl) return
    const dateStr = new Date().toISOString().split('T')[0]
    downloadUrl(
      sessionVideo.videoUrl,
      `jellybooth_${dateStr}_session.${sessionVideo.videoExt || 'webm'}`
    )
    setHasSavedAny(true)
  }

  const activeLiveSrc =
    isPlayingLivePhoto && livePlayIndex !== null && liveFramesData?.frameUrls[livePlayIndex]
      ? liveFramesData.frameUrls[livePlayIndex]
      : previewUrl

  return (
    <div className="space-y-6 animate-fade-in-up select-none">
      {showNewSessionModal && (
        <NewSessionConfirmModal
          hasSavedAny={hasSavedAny}
          isSaving={isDownloading}
          onQuickSavePrint={() => handleDownload('print')}
          onCancel={() => setShowNewSessionModal(false)}
          onConfirm={() => {
            setShowNewSessionModal(false)
            onRetake()
          }}
        />
      )}

      <div className="text-center">
        <h2 className="font-display text-2xl font-bold tracking-wide" style={{ color: 'var(--vintage-brown)' }}>
          Your Photobooth Strip
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Looking beautiful! Save your memories before starting a new session.
        </p>
      </div>

      {/* Virtual Physical Photobooth Dispenser Animation */}
      <BoothPrinterAnimation
        stripUrl={previewUrl}
        isGenerating={isGenerating}
        onComplete={() => setPrinterDone(true)}
      />

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleDownload('print')}
            disabled={isGenerating || isDownloading}
            className="flex flex-col items-center gap-1.5 font-display text-[11px] tracking-widest uppercase px-4 py-5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
            style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
          >
            <PrintIcon />
            <span>{isDownloading ? 'Saving...' : 'Save for Print'}</span>
            <span className="text-[9px] normal-case font-body tracking-normal opacity-60">
              High-res PNG
            </span>
          </button>

          <button
            onClick={() => handleDownload('social')}
            disabled={isGenerating || isDownloading}
            className="flex flex-col items-center gap-1.5 font-display text-[11px] tracking-widest uppercase px-4 py-5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
            style={{ background: 'var(--sepia)', color: 'var(--cream)' }}
          >
            <ShareIcon />
            <span>{isDownloading ? 'Saving...' : 'Save for Social'}</span>
            <span className="text-[9px] normal-case font-body tracking-normal opacity-60">
              1080×1350 PNG
            </span>
          </button>
        </div>

        {/* iOS Live Photo (3s: 1.5s before + still + 1.5s after + audio) & GIF / Session Video Card */}
        {(hasLiveFrames || sessionVideo?.videoUrl || sessionVideo?.warning) && (
          <div className="section-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--vintage-brown)' }}><LiveGifIcon /></span>
                <div>
                  <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--vintage-brown)' }}>
                    iOS Live Photo &amp; Strip Motion
                  </p>
                  <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                    3.0s moving strip (1.5s before &amp; after shutter{sessionVideo?.hasAudio ? ' + audio' : ''})
                  </p>
                </div>
              </div>
              {sessionVideo?.durationSec ? (
                <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {formatDuration(sessionVideo.durationSec)}
                </span>
              ) : null}
            </div>

            {sessionVideo?.warning && (
              <p className="font-body text-xs" style={{ color: 'var(--sepia)' }}>
                {sessionVideo.warning}
              </p>
            )}

            {/* Interactive iOS Live Photo Viewer */}
            {hasLiveFrames && (
              <div
                className="p-3.5 rounded-sm space-y-3"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm font-display text-[10px] tracking-widest uppercase"
                      style={{
                        background: isPlayingLivePhoto ? 'var(--vintage-brown)' : 'rgba(92,61,30,0.1)',
                        color: isPlayingLivePhoto ? 'var(--cream)' : 'var(--vintage-brown)',
                      }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isPlayingLivePhoto ? 'bg-amber-300 animate-ping' : 'bg-current'}`} />
                      LIVE · 3.0s
                    </span>
                    <span className="font-body text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {liveAudioSlice ? 'Video + Audio' : 'Video Motion'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isRenderingLiveFrames}
                    onClick={() => {
                      if (isPlayingLivePhoto) stopLivePhotoPlayback()
                      else startLivePhotoPlayback()
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-display text-[10px] tracking-widest uppercase transition-all active:scale-95 disabled:opacity-50"
                    style={{
                      background: isPlayingLivePhoto ? 'var(--sepia)' : 'var(--vintage-brown)',
                      color: 'var(--cream)',
                    }}
                  >
                    <PlayIcon />
                    <span>
                      {isRenderingLiveFrames
                        ? `Preparing (${liveFramesProgress}%)…`
                        : isPlayingLivePhoto
                          ? 'Stop'
                          : 'Play 3s Live Photo'}
                    </span>
                  </button>
                </div>

                {/* Audio Moment Pose Selector if multiple poses & mic audio captured */}
                {sessionVideo?.hasAudio && session.poseCount > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-display text-[10px] tracking-wider uppercase mr-1" style={{ color: 'var(--text-muted)' }}>
                      Audio Moment:
                    </span>
                    {Array.from({ length: session.poseCount }).map((_, idx) => {
                      const active = selectedAudioPose === idx
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAudioPose(idx)}
                          className="px-2 py-0.5 rounded-sm font-display text-[10px] tracking-wider uppercase transition-all"
                          style={
                            active
                              ? { background: 'var(--vintage-brown)', color: 'var(--cream)' }
                              : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                          }
                        >
                          Pose {idx + 1}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Interactive Press-and-Hold Strip Frame */}
                <div
                  onPointerDown={() => {
                    if (!isRenderingLiveFrames) startLivePhotoPlayback()
                  }}
                  onPointerUp={() => {
                    if (isPlayingLivePhoto) stopLivePhotoPlayback()
                  }}
                  onPointerLeave={() => {
                    if (isPlayingLivePhoto) stopLivePhotoPlayback()
                  }}
                  className="relative flex flex-col items-center justify-center min-h-[220px] rounded-sm p-3 cursor-pointer touch-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  title="Press & hold (or click Play above) to play 3s iOS Live Photo"
                >
                  {activeLiveSrc ? (
                    <img
                      src={activeLiveSrc}
                      alt="Interactive iOS Live Photo strip"
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-72 object-contain shadow-md pointer-events-none"
                      style={{ border: '1px solid var(--border)' }}
                    />
                  ) : (
                    <div className="py-10 text-center">
                      <div
                        className="w-6 h-6 mx-auto rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: 'var(--border)', borderTopColor: 'var(--vintage-brown)' }}
                      />
                    </div>
                  )}

                  {/* Timeline bar during 3s playback */}
                  {isPlayingLivePhoto && (
                    <div className="w-full max-w-xs mt-3 space-y-1">
                      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                        <div
                          className="h-full transition-none"
                          style={{ width: `${livePlayProgress}%`, background: 'var(--vintage-brown)' }}
                        />
                      </div>
                      <div className="flex justify-between font-mono text-[9px]" style={{ color: 'var(--text-muted)' }}>
                        <span>-1.5s</span>
                        <span>SHUTTER</span>
                        <span>+1.5s</span>
                      </div>
                    </div>
                  )}

                  {!isPlayingLivePhoto && (
                    <p className="mt-2 font-body text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Press &amp; hold strip to preview iOS Live Photo
                    </p>
                  )}
                </div>

                {liveVideoError && (
                  <p className="font-body text-xs text-center" style={{ color: 'var(--sepia)' }}>
                    {liveVideoError}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleDownloadLivePhotoVideo}
                  disabled={isEncodingLiveVideo || isRenderingLiveFrames}
                  className="w-full flex items-center justify-center gap-2 font-display text-[11px] tracking-widest uppercase px-4 py-3.5 rounded-sm transition-all active:scale-95 disabled:opacity-50"
                  style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                >
                  <DownloadSmIcon />
                  <span>
                    {isEncodingLiveVideo
                      ? `Rendering 3s Live Photo (${liveVideoProgress}%)…`
                      : liveVideoUrl
                        ? `Save iOS Live Photo (.${liveVideoExt}${liveVideoHasAudio ? ' + Audio' : ''})`
                        : `Save iOS Live Photo (3s Video${liveAudioSlice ? ' + Audio' : ''})`}
                  </span>
                </button>
              </div>
            )}

            <div className={`grid gap-4 ${hasLiveFrames && sessionVideo?.videoUrl ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Live Looping GIF Strip Preview & Download */}
              {hasLiveFrames && (
                <div
                  className="p-3 rounded-sm flex flex-col justify-between gap-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                      Life4Cuts Live Strip (GIF)
                    </span>
                    <span className="font-body text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      3s loop
                    </span>
                  </div>

                  <div className="flex justify-center items-center min-h-[180px] rounded-sm p-2" style={{ background: 'var(--surface-2)' }}>
                    {liveGifUrl ? (
                      <img
                        src={liveGifUrl}
                        alt="Animated live photo strip"
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-60 object-contain shadow-sm"
                        style={{ border: '1px solid var(--border)' }}
                      />
                    ) : isEncodingGif ? (
                      <div className="w-full max-w-[200px] text-center space-y-2 py-6">
                        <div
                          className="w-6 h-6 mx-auto rounded-full border-2 border-t-transparent animate-spin"
                          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--vintage-brown)' }}
                        />
                        <p className="font-display text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                          Creating Live GIF · {gifProgress}%
                        </p>
                      </div>
                    ) : gifError ? (
                      <p className="font-body text-xs text-center px-3" style={{ color: 'var(--sepia)' }}>
                        {gifError}
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => buildLiveGif()}
                        className="px-3.5 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase"
                        style={{ border: '1px solid var(--border)', color: 'var(--vintage-brown)', background: 'var(--surface)' }}
                      >
                        Render Live Preview
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadGif}
                    disabled={isEncodingGif}
                    className="w-full flex items-center justify-center gap-2 font-display text-[11px] tracking-widest uppercase px-4 py-3 rounded-sm transition-all active:scale-95 disabled:opacity-50"
                    style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                  >
                    <DownloadSmIcon />
                    <span>{isEncodingGif ? `Creating GIF (${gifProgress}%)…` : 'Save Live Strip (.gif)'}</span>
                  </button>
                </div>
              )}

              {/* Full Session Video Preview & Download */}
              {sessionVideo?.videoUrl && (
                <div
                  className="p-3 rounded-sm flex flex-col justify-between gap-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-display text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                      <VideoIcon />
                      Full Session Clip
                    </span>
                    <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
                      {sessionVideo.videoExt || 'webm'}
                    </span>
                  </div>

                  <div className="flex justify-center items-center min-h-[180px] rounded-sm overflow-hidden bg-black">
                    <video
                      src={sessionVideo.videoUrl}
                      controls
                      playsInline
                      loop
                      muted
                      className="w-full max-h-60 object-contain"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadVideo}
                    className="w-full flex items-center justify-center gap-2 font-display text-[11px] tracking-widest uppercase px-4 py-3 rounded-sm transition-all active:scale-95"
                    style={{ background: 'var(--sepia)', color: 'var(--cream)' }}
                  >
                    <DownloadSmIcon />
                    <span>Save Session Video (.{sessionVideo.videoExt || 'webm'})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowNewSessionModal(true)}
          className="w-full flex items-center justify-center gap-2 font-display text-[11px] tracking-widest uppercase px-6 py-4 transition-all active:scale-95 rounded-sm"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--vintage-brown)',
            background: 'var(--surface)',
          }}
        >
          <RefreshIcon />
          New Session
        </button>
      </div>

      <p className="text-center text-[10px] flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
        <LockIcon />
        Photos &amp; clips stay in your browser — nothing is uploaded.
      </p>
    </div>
  )
}