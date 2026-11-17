'use client';

import { useEffect, useRef, useState, useCallback } from 'react'
import { LivePhotoItem, PhotoSession, SessionVideoData } from '@/lib/types'
import { generatePhotoboothCanvas, downloadPhoto } from '@/lib/canvasExport'
import {
  downloadUrl,
  formatDuration,
  generateLiveStripGif,
} from '@/lib/liveExport'
import {
  exportFilteredLiveStill,
  exportPairedLivePhoto,
} from '@/lib/livePhotoCapture'
import LivePhotoViewer, { LivePhotoBadge } from './LivePhotoPlayer'
import BoothPrinterAnimation from './BoothPrinterAnimation'

interface ExportPanelProps {
  session: PhotoSession
  sessionVideo?: SessionVideoData
  onRetake: () => void
  onRequestNewSession?: () => void
  onSessionSaved?: () => void
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

export default function ExportPanel({
  session,
  sessionVideo,
  onRetake,
  onRequestNewSession,
  onSessionSaved,
}: ExportPanelProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [printerDone, setPrinterDone] = useState(false)

  // Live Strip GIF state
  const [liveGifUrl, setLiveGifUrl] = useState<string | null>(null)
  const [gifProgress, setGifProgress] = useState(0)
  const [isEncodingGif, setIsEncodingGif] = useState(false)
  const [gifError, setGifError] = useState<string | null>(null)
  const [savingLivePoseIdx, setSavingLivePoseIdx] = useState<number | null>(null)

  const genIdRef = useRef(0)
  const gifJobIdRef = useRef(0)
  const liveGifUrlRef = useRef<string | null>(null)

  const livePhotos: LivePhotoItem[] =
    sessionVideo?.livePhotos ?? session.livePhotos ?? []
  const hasLivePhotos = livePhotos.length > 0

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

  // Revoke generated GIF Object URL cleanly on unmount or re-encode
  useEffect(() => {
    return () => {
      if (liveGifUrlRef.current) {
        URL.revokeObjectURL(liveGifUrlRef.current)
        liveGifUrlRef.current = null
      }
    }
  }, [])

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
    if (printerDone && hasLiveFrames && !liveGifUrlRef.current && !isEncodingGif) {
      buildLiveGif()
    }
  }, [printerDone, hasLiveFrames, isEncodingGif, buildLiveGif])

  const handleDownload = async (format: 'print' | 'social') => {
    if (isDownloading) return
    setIsDownloading(true)
    try {
      await downloadPhoto(session, format)
      onSessionSaved?.()
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setTimeout(() => setIsDownloading(false), 1500)
    }
  }

  const handleDownloadGif = async () => {
    const dateStr = new Date().toISOString().split('T')[0]
    const url = liveGifUrl || (await buildLiveGif())
    if (url) {
      downloadUrl(url, `jellybooth_${dateStr}_live.gif`)
      onSessionSaved?.()
    }
  }

  const handleDownloadVideo = () => {
    if (!sessionVideo?.videoUrl) return
    const dateStr = new Date().toISOString().split('T')[0]
    downloadUrl(
      sessionVideo.videoUrl,
      `jellybooth_${dateStr}_session.${sessionVideo.videoExt || 'webm'}`
    )
    onSessionSaved?.()
  }

  const handleDownloadLiveStill = async (lp: LivePhotoItem, idx: number) => {
    setSavingLivePoseIdx(idx)
    try {
      const dateStr = new Date().toISOString().split('T')[0]
      const ok = await exportFilteredLiveStill(
        lp.stillUrl,
        session.filter,
        `jellybooth_${dateStr}_live_pose${idx + 1}_still.png`
      )
      if (ok) onSessionSaved?.()
    } catch (err) {
      console.error('Live Photo still save failed:', err)
    } finally {
      setSavingLivePoseIdx(null)
    }
  }

  const handleDownloadLiveClip = (lp: LivePhotoItem, idx: number) => {
    if (!lp.videoUrl) return
    const dateStr = new Date().toISOString().split('T')[0]
    downloadUrl(
      lp.videoUrl,
      `jellybooth_${dateStr}_live_pose${idx + 1}_motion.${lp.videoExt || 'webm'}`
    )
    onSessionSaved?.()
  }

  const handleDownloadLivePair = async (lp: LivePhotoItem, idx: number) => {
    setSavingLivePoseIdx(idx)
    try {
      const res = await exportPairedLivePhoto(lp, idx, session.filter)
      if (res.stillSaved) onSessionSaved?.()
    } catch (err) {
      console.error('Live Photo paired save failed:', err)
    } finally {
      setSavingLivePoseIdx(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up select-none">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold tracking-wide" style={{ color: 'var(--vintage-brown)' }}>
          Your Photobooth Strip
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Looking beautiful! Save your memories.
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

        {/* Live Photo Strip (GIF) & Session Video Card */}
        {(hasLiveFrames || hasLivePhotos || sessionVideo?.videoUrl || sessionVideo?.warning) && (
          <div className="section-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--vintage-brown)' }}><LiveGifIcon /></span>
                <div>
                  <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--vintage-brown)' }}>
                    Live Memories
                  </p>
                  <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                    Moving Live Strip GIF &amp; session clip
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

            <div className={`grid gap-4 ${hasLiveFrames && sessionVideo?.videoUrl ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {/* Live Looping GIF Strip Preview & Download */}
              {hasLiveFrames && (
                <div
                  className="p-3 rounded-sm flex flex-col justify-between gap-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                      Live Strip (GIF)
                    </span>
                    <span className="font-body text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Looping motion
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
                      Session Clip
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
                    <span>Save Video (.{sessionVideo.videoExt || 'webm'})</span>
                  </button>
                </div>
              )}
            </div>

            {/* Individual iOS-Style Live Photos (Still + ~3s Motion Clip) */}
            {hasLivePhotos && (
              <div
                className="pt-4 space-y-3"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <LivePhotoBadge compact />
                    <span className="font-display text-[10px] tracking-widest uppercase" style={{ color: 'var(--vintage-brown)' }}>
                      Live Photos ({livePhotos.length})
                    </span>
                  </div>
                  <span className="font-body text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Tap Play for ~3s motion · saves paired still + video
                  </span>
                </div>

                <div
                  className={`grid gap-3 ${
                    livePhotos.length <= 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : livePhotos.length === 3
                        ? 'grid-cols-1 sm:grid-cols-3'
                        : 'grid-cols-2 sm:grid-cols-4'
                  }`}
                >
                  {livePhotos.map((lp, idx) => (
                    <div
                      key={lp.id}
                      className="p-2 rounded-sm flex flex-col gap-2"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <div className="w-full aspect-[4/3] rounded-sm overflow-hidden bg-black">
                        <LivePhotoViewer
                          item={lp}
                          filter={session.filter}
                          poseNumber={idx + 1}
                          compact
                          className="w-full h-full"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono px-0.5" style={{ color: 'var(--text-muted)' }}>
                        <span>Pose #{idx + 1}</span>
                        <span>
                          {lp.durationSec > 0 ? `${lp.durationSec.toFixed(1)}s` : 'Still'}
                          {lp.hasAudio ? ' · Audio' : ''}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            disabled={savingLivePoseIdx === idx}
                            onClick={() => handleDownloadLiveStill(lp, idx)}
                            className="px-2 py-1.5 rounded-sm font-display text-[9px] tracking-widest uppercase transition-all active:scale-95 disabled:opacity-50"
                            style={{ border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--vintage-brown)' }}
                          >
                            Still .png
                          </button>
                          {lp.videoUrl ? (
                            <button
                              type="button"
                              onClick={() => handleDownloadLiveClip(lp, idx)}
                              className="px-2 py-1.5 rounded-sm font-display text-[9px] tracking-widest uppercase transition-all active:scale-95"
                              style={{ border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--vintage-brown)' }}
                            >
                              Clip .{lp.videoExt || 'webm'}
                            </button>
                          ) : (
                            <span
                              className="px-2 py-1.5 rounded-sm font-display text-[9px] tracking-widest uppercase text-center opacity-50"
                              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                            >
                              No Clip
                            </span>
                          )}
                        </div>

                        {lp.videoUrl && (
                          <button
                            type="button"
                            disabled={savingLivePoseIdx === idx}
                            onClick={() => handleDownloadLivePair(lp, idx)}
                            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-sm font-display text-[9px] tracking-widest uppercase transition-all active:scale-95 disabled:opacity-50"
                            style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                          >
                            <DownloadSmIcon />
                            <span>{savingLivePoseIdx === idx ? 'Saving…' : 'Save Pair (Still + Motion)'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={onRequestNewSession ?? onRetake}
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