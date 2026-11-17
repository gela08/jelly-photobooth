'use client'

import { useEffect, useRef, useState } from 'react'
import { FILTERS, FilterType, LivePhotoItem } from '@/lib/types'

function LiveRingsIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  )
}

function PlayIcon({ size = 12 }: { size?: number }) {
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

export function LivePhotoBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm font-display uppercase tracking-widest pointer-events-none ${
        compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[9px]'
      }`}
      style={{
        background: 'rgba(26,20,16,0.74)',
        color: 'rgba(245,240,232,0.95)',
        border: '1px solid rgba(245,240,232,0.2)',
      }}
    >
      <LiveRingsIcon size={compact ? 10 : 11} />
      <span>LIVE</span>
    </span>
  )
}

interface LivePhotoViewerProps {
  item: LivePhotoItem
  filter: FilterType
  poseNumber?: number
  className?: string
  imgStyle?: React.CSSProperties
  compact?: boolean
  showControls?: boolean
}

/**
 * Displays the still photograph by default with a subtle LIVE indicator.
 * On user activation, plays the ~3s motion clip (1.5s before + 1.5s after)
 * with synchronized audio when available, then returns cleanly to the still.
 */
export default function LivePhotoViewer({
  item,
  filter,
  poseNumber,
  className = '',
  imgStyle,
  compact = false,
  showControls = true,
}: LivePhotoViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const stopTimeoutRef = useRef<number | null>(null)

  const cssFilter = FILTERS.find((f) => f.id === filter)?.cssFilter ?? 'none'
  const canPlayVideo = Boolean(item.videoUrl)

  const clearStopTimer = () => {
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current)
      stopTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearStopTimer()
    }
  }, [])

  // Reset playback cleanly if the item changes
  useEffect(() => {
    clearStopTimer()
    setIsPlaying(false)
    setHasPlayedOnce(false)
  }, [item.id, item.videoUrl])

  const stopPlayback = () => {
    clearStopTimer()
    const v = videoRef.current
    if (v) {
      v.pause()
    }
    setIsPlaying(false)
  }

  const startPlayback = () => {
    if (!canPlayVideo) return
    const v = videoRef.current
    if (!v) return

    clearStopTimer()
    // Cue ~1.5s before the shutter moment (capped at 0)
    const startOffset = Math.max(0, item.keyPhotoOffsetSec - 1.5)
    try {
      v.currentTime = startOffset
    } catch {
      // ignore if metadata not loaded yet
    }
    v.muted = isMuted || !item.hasAudio

    setIsPlaying(true)
    setHasPlayedOnce(true)

    v.play().catch(() => {
      // If unmuted autoplay is blocked, retry muted
      v.muted = true
      setIsMuted(true)
      v.play().catch(() => {
        setIsPlaying(false)
      })
    })

    // Return to the still image after the ~3s Live Photo window finishes
    const windowMs = Math.min(3600, Math.max(2600, Math.round(item.durationSec * 1000)))
    stopTimeoutRef.current = window.setTimeout(() => {
      stopPlayback()
    }, windowMs + 150)
  }

  const handleTogglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!canPlayVideo) return
    if (isPlaying) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }

  return (
    <div className={`relative overflow-hidden select-none ${className}`}>
      {/* Default still photograph */}
      <img
        src={item.stillUrl}
        alt={poseNumber ? `Live Photo ${poseNumber}` : 'Live Photo'}
        style={{
          ...imgStyle,
          filter: cssFilter,
          opacity: isPlaying ? 0 : 1,
          transition: 'opacity 140ms ease',
        }}
        className="w-full h-full object-cover block"
      />

      {/* Synchronized motion clip layer (shown only while actively playing) */}
      {item.videoUrl && (
        <video
          ref={videoRef}
          src={item.videoUrl}
          playsInline
          preload="metadata"
          muted={isMuted || !item.hasAudio}
          onEnded={stopPlayback}
          onTimeUpdate={() => {
            const v = videoRef.current
            if (!v || !isPlaying) return
            const endAt = item.keyPhotoOffsetSec + 1.55
            if (v.duration && endAt < v.duration - 0.15 && v.currentTime >= endAt) {
              stopPlayback()
            }
          }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{
            opacity: isPlaying ? 1 : 0,
            transition: 'opacity 140ms ease',
            filter: cssFilter,
          }}
        />
      )}

      {/* Subtle Live Photo badge */}
      <div className="absolute top-1.5 left-1.5 z-10 flex items-center gap-1.5">
        <LivePhotoBadge compact={compact} />
        {isPlaying && (
          <span
            className="px-1.5 py-0.5 rounded-sm font-mono text-[8px] uppercase tracking-wider"
            style={{ background: 'rgba(139,105,20,0.88)', color: '#fff' }}
          >
            Playing
          </span>
        )}
      </div>

      {/* Audio mute toggle if clip includes mic audio */}
      {showControls && item.hasAudio && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            const next = !isMuted
            setIsMuted(next)
            if (videoRef.current) videoRef.current.muted = next
          }}
          className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-sm flex items-center justify-center transition-all active:scale-90"
          style={{
            background: 'rgba(26,20,16,0.74)',
            color: 'rgba(245,240,232,0.92)',
          }}
          aria-label={isMuted ? 'Unmute Live Photo audio' : 'Mute Live Photo audio'}
          title={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          <VolumeIcon muted={isMuted} />
        </button>
      )}

      {/* Interactive play / replay trigger */}
      {showControls && canPlayVideo && (
        <button
          type="button"
          onClick={handleTogglePlay}
          className="absolute bottom-1.5 right-1.5 z-10 inline-flex items-center gap-1 px-2 py-1 rounded-sm font-display text-[9px] tracking-widest uppercase transition-all active:scale-95"
          style={{
            background: isPlaying ? 'rgba(139,105,20,0.92)' : 'rgba(26,20,16,0.78)',
            color: 'var(--cream)',
            border: '1px solid rgba(245,240,232,0.22)',
          }}
          aria-label={isPlaying ? 'Stop Live Photo' : hasPlayedOnce ? 'Replay Live Photo' : 'Play Live Photo'}
        >
          <PlayIcon size={9} />
          <span>{isPlaying ? 'Stop' : hasPlayedOnce ? 'Replay' : 'Play'}</span>
        </button>
      )}
    </div>
  )
}
