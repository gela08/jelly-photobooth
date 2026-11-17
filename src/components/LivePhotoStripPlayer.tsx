'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { generatePhotoboothCanvas } from '@/lib/canvasExport'
import { LivePhotoItem, PhotoSession } from '@/lib/types'
import { LivePhotoBadge } from './LivePhotoPlayer'

function PlayIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  )
}

function VolumeIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  )
}

interface LivePhotoStripPlayerProps {
  session: PhotoSession
  livePhotos: LivePhotoItem[]
  stillStripUrl: string | null
  className?: string
}

/**
 * Interactive Life4Cuts-style Live Photo Strip preview.
 * Displays the still customized photo strip by default with a subtle LIVE indicator.
 * On Play/Replay, animates all Live Photo poses simultaneously inside the strip
 * with synchronized audio when available, then returns cleanly to the key still strip.
 */
export default function LivePhotoStripPlayer({
  session,
  livePhotos,
  stillStripUrl,
  className = '',
}: LivePhotoStripPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const rafRef = useRef<number | null>(null)
  const stopTimerRef = useRef<number | null>(null)
  const renderingRef = useRef(false)
  const activeRunRef = useRef(0)

  const playableCount = livePhotos.filter((lp) => Boolean(lp?.videoUrl)).length
  const audioCount = livePhotos.filter((lp) => Boolean(lp?.videoUrl && lp.hasAudio)).length
  const canPlay = playableCount > 0

  const stopPlayback = useCallback(() => {
    activeRunRef.current += 1
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (stopTimerRef.current !== null) {
      window.clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }
    videoRefs.current.forEach((v) => {
      if (v) {
        try {
          v.pause()
        } catch {
          // ignore
        }
      }
    })
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    return () => {
      stopPlayback()
    }
  }, [stopPlayback])

  // Stop & reset cleanly if layout/session customization changes
  useEffect(() => {
    stopPlayback()
  }, [session, livePhotos, stopPlayback])

  const startPlayback = async () => {
    if (!canPlay || !canvasRef.current) return
    stopPlayback()

    const runId = activeRunRef.current
    const activeEntries = session.photos
      .map((_, idx) => ({
        idx,
        lp: livePhotos[idx],
        video: videoRefs.current[idx],
      }))
      .filter(
        (e): e is { idx: number; lp: LivePhotoItem; video: HTMLVideoElement } =>
          Boolean(e.lp?.videoUrl && e.video)
      )

    if (activeEntries.length === 0) return

    const audioGain = 1 / Math.max(1, audioCount)
    for (const entry of activeEntries) {
      const startOffset = Math.max(0, entry.lp.keyPhotoOffsetSec - 1.5)
      try {
        entry.video.currentTime = startOffset
      } catch {
        // ignore if metadata still loading
      }
      entry.video.muted = isMuted || !entry.lp.hasAudio
      entry.video.volume = audioGain
    }

    setIsPlaying(true)
    setHasPlayedOnce(true)

    await Promise.all(
      activeEntries.map((entry) =>
        entry.video.play().catch(() => {
          entry.video.muted = true
          setIsMuted(true)
          return entry.video.play().catch(() => {})
        })
      )
    )

    if (activeRunRef.current !== runId) return

    const maxWindowMs = activeEntries.reduce((max, entry) => {
      const dur = entry.lp.durationSec > 0 ? entry.lp.durationSec * 1000 : 3000
      return Math.max(max, dur)
    }, 2800)
    const stopAfterMs = Math.min(3900, Math.max(2600, Math.round(maxWindowMs)))

    stopTimerRef.current = window.setTimeout(() => {
      if (activeRunRef.current === runId) {
        stopPlayback()
      }
    }, stopAfterMs + 120)

    const tick = async () => {
      if (activeRunRef.current !== runId || !canvasRef.current) return

      if (!renderingRef.current) {
        renderingRef.current = true
        try {
          let anyStillActive = false
          const overrides: (CanvasImageSource | undefined)[] = session.photos.map((_, idx) => {
            const lp = livePhotos[idx]
            const v = videoRefs.current[idx]
            if (!lp?.videoUrl || !v) return undefined
            const endAt = lp.keyPhotoOffsetSec + 1.55
            const reachedEnd =
              v.ended || (Number.isFinite(v.duration) && v.duration > 0 && v.currentTime >= Math.min(v.duration - 0.05, endAt))
            if (reachedEnd) {
              if (!v.paused) v.pause()
              return undefined
            }
            if (v.readyState >= 2 && v.videoWidth > 0) {
              anyStillActive = true
              return v
            }
            anyStillActive = true
            return undefined
          })

          await generatePhotoboothCanvas(session, undefined, {
            includeStickers: true,
            sourceOverrides: overrides,
            fastCssFilter: true,
            targetCanvas: canvasRef.current,
          })

          if (!anyStillActive && activeRunRef.current === runId) {
            stopPlayback()
            return
          }
        } catch {
          // keep trying or fall back cleanly on next tick
        } finally {
          renderingRef.current = false
        }
      }

      if (activeRunRef.current === runId) {
        rafRef.current = window.requestAnimationFrame(() => {
          void tick()
        })
      }
    }

    rafRef.current = window.requestAnimationFrame(() => {
      void tick()
    })
  }

  const handleTogglePlay = () => {
    if (!canPlay) return
    if (isPlaying) {
      stopPlayback()
    } else {
      void startPlayback()
    }
  }

  return (
    <div className={`relative flex justify-center items-center rounded-sm overflow-hidden select-none ${className}`}>
      {/* Default crisp still photo strip */}
      {stillStripUrl ? (
        <img
          src={stillStripUrl}
          alt="Live Photo strip"
          referrerPolicy="no-referrer"
          className="max-w-full max-h-64 object-contain shadow-sm block"
          style={{
            border: '1px solid var(--border)',
            opacity: isPlaying ? 0 : 1,
            transition: 'opacity 140ms ease',
          }}
        />
      ) : (
        <div className="py-14 px-6 text-center">
          <div
            className="w-6 h-6 mx-auto rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--vintage-brown)' }}
          />
        </div>
      )}

      {/* Animated strip canvas shown seamlessly during Live Photo strip playback */}
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-64 object-contain shadow-sm pointer-events-none"
        style={{
          position: stillStripUrl ? 'absolute' : 'relative',
          inset: stillStripUrl ? 0 : undefined,
          margin: 'auto',
          border: '1px solid var(--border)',
          opacity: isPlaying ? 1 : 0,
          transition: 'opacity 140ms ease',
        }}
      />

      {/* Hidden synchronized video elements for each Live Photo pose */}
      {session.photos.map((_, idx) => {
        const lp = livePhotos[idx]
        if (!lp?.videoUrl) return null
        return (
          <video
            key={lp.id}
            ref={(el) => {
              videoRefs.current[idx] = el
            }}
            src={lp.videoUrl}
            playsInline
            preload="auto"
            muted={isMuted || !lp.hasAudio}
            className="hidden"
          />
        )
      })}

      {/* Subtle LIVE strip indicator */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
        <LivePhotoBadge compact />
        {isPlaying && (
          <span
            className="px-1.5 py-0.5 rounded-sm font-mono text-[8px] uppercase tracking-wider"
            style={{ background: 'rgba(139,105,20,0.88)', color: '#fff' }}
          >
            Playing
          </span>
        )}
      </div>

      {/* Audio mute toggle when any Live Photo includes mic audio */}
      {audioCount > 0 && (
        <button
          type="button"
          onClick={() => {
            const next = !isMuted
            setIsMuted(next)
            videoRefs.current.forEach((v, idx) => {
              const lp = livePhotos[idx]
              if (v) v.muted = next || !lp?.hasAudio
            })
          }}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-sm flex items-center justify-center transition-all active:scale-90"
          style={{
            background: 'rgba(26,20,16,0.74)',
            color: 'rgba(245,240,232,0.92)',
          }}
          aria-label={isMuted ? 'Unmute Live Photo strip audio' : 'Mute Live Photo strip audio'}
          title={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          <VolumeIcon muted={isMuted} />
        </button>
      )}

      {/* Play / Replay / Stop trigger */}
      {canPlay && (
        <button
          type="button"
          onClick={handleTogglePlay}
          className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-sm font-display text-[9px] tracking-widest uppercase transition-all active:scale-95"
          style={{
            background: isPlaying ? 'rgba(139,105,20,0.92)' : 'rgba(26,20,16,0.78)',
            color: 'var(--cream)',
            border: '1px solid rgba(245,240,232,0.22)',
          }}
          aria-label={
            isPlaying
              ? 'Stop Live Photo strip playback'
              : hasPlayedOnce
                ? 'Replay Live Photo strip'
                : 'Play Live Photo strip'
          }
        >
          <PlayIcon size={9} />
          <span>{isPlaying ? 'Stop' : hasPlayedOnce ? 'Replay' : 'Play Live Strip'}</span>
        </button>
      )}
    </div>
  )
}
