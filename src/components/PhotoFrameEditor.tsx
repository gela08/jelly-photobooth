'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DEFAULT_PHOTO_TRANSFORM,
  FILTERS,
  FilterType,
  LayoutType,
  PhotoTransform,
  PoseCount,
  getLayoutSlotAspectRatios,
} from '@/lib/types'

interface PhotoFrameEditorProps {
  photos: string[]
  transforms: PhotoTransform[]
  layout: LayoutType
  poseCount: PoseCount
  filter: FilterType
  onChange: (index: number, next: PhotoTransform) => void
  onResetAll: () => void
  onEnlarge: (index: number) => void
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

function ZoomIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.96" />
    </svg>
  )
}

function MoveIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" /><polyline points="19 9 22 12 19 15" />
      <line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  )
}

interface FrameSlotProps {
  photo: string
  index: number
  aspectRatio: number
  cssFilter: string
  transform: PhotoTransform
  isSelected: boolean
  onSelect: () => void
  onChange: (next: PhotoTransform) => void
  onEnlarge: () => void
}

function FrameSlot({
  photo,
  index,
  aspectRatio,
  cssFilter,
  transform,
  isSelected,
  onSelect,
  onChange,
  onEnlarge,
}: FrameSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 })
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // Keep latest transform in ref for smooth pointer updates without stale closures
  const latestTransformRef = useRef(transform)
  latestTransformRef.current = transform

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const lastPanRef = useRef<{ x: number; y: number } | null>(null)
  const pinchStartRef = useRef<{ dist: number; zoom: number; midX: number; midY: number } | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setFrameSize({ w: rect.width, h: rect.height })
      }
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const getGeometry = (zoomVal: number) => {
    if (!frameSize.w || !frameSize.h || !imgSize.w || !imgSize.h) {
      return null
    }
    const sa = imgSize.w / imgSize.h
    const da = frameSize.w / frameSize.h
    let baseW = frameSize.w
    let baseH = frameSize.h
    if (sa > da) {
      baseH = frameSize.h
      baseW = frameSize.h * sa
    } else {
      baseW = frameSize.w
      baseH = frameSize.w / sa
    }
    const renderedW = baseW * zoomVal
    const renderedH = baseH * zoomVal
    const slackX = Math.max(0, (renderedW - frameSize.w) / 2)
    const slackY = Math.max(0, (renderedH - frameSize.h) / 2)
    return { renderedW, renderedH, slackX, slackY }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onSelect()
    e.currentTarget.setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setIsDragging(true)

    if (pointersRef.current.size === 1) {
      lastPanRef.current = { x: e.clientX, y: e.clientY }
      pinchStartRef.current = null
    } else if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values())
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      const midX = (pts[0].x + pts[1].x) / 2
      const midY = (pts[0].y + pts[1].y) / 2
      pinchStartRef.current = {
        dist: Math.max(1, dist),
        zoom: latestTransformRef.current.zoom,
        midX,
        midY,
      }
      lastPanRef.current = null
    }
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const curr = latestTransformRef.current

    if (pointersRef.current.size === 2 && pinchStartRef.current) {
      const pts = Array.from(pointersRef.current.values())
      const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      const midX = (pts[0].x + pts[1].x) / 2
      const midY = (pts[0].y + pts[1].y) / 2

      const nextZoom = clamp(pinchStartRef.current.zoom * (dist / pinchStartRef.current.dist), 1, 3)
      const dx = midX - pinchStartRef.current.midX
      const dy = midY - pinchStartRef.current.midY
      pinchStartRef.current.midX = midX
      pinchStartRef.current.midY = midY

      const geom = getGeometry(nextZoom)
      const nextX = geom && geom.slackX > 0.5 ? clamp(curr.x + dx / geom.slackX, -1, 1) : 0
      const nextY = geom && geom.slackY > 0.5 ? clamp(curr.y + dy / geom.slackY, -1, 1) : 0
      onChange({ x: nextX, y: nextY, zoom: nextZoom })
      return
    }

    if (pointersRef.current.size === 1 && lastPanRef.current) {
      const dx = e.clientX - lastPanRef.current.x
      const dy = e.clientY - lastPanRef.current.y
      lastPanRef.current = { x: e.clientX, y: e.clientY }

      const geom = getGeometry(curr.zoom)
      if (!geom) return

      const nextX = geom.slackX > 0.5 ? clamp(curr.x + dx / geom.slackX, -1, 1) : 0
      const nextY = geom.slackY > 0.5 ? clamp(curr.y + dy / geom.slackY, -1, 1) : 0

      if (nextX !== curr.x || nextY !== curr.y) {
        onChange({ ...curr, x: nextX, y: nextY })
      }
    }
  }

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // ignore if already released
      }
    }
    if (pointersRef.current.size === 1) {
      const [remaining] = Array.from(pointersRef.current.values())
      lastPanRef.current = { x: remaining.x, y: remaining.y }
      pinchStartRef.current = null
    } else if (pointersRef.current.size === 0) {
      lastPanRef.current = null
      pinchStartRef.current = null
      setIsDragging(false)
    }
  }

  const geom = getGeometry(transform.zoom)
  const left = geom ? -geom.slackX * (1 - transform.x) : 0
  const top = geom ? -geom.slackY * (1 - transform.y) : 0
  const isModified =
    Math.abs(transform.x) > 0.01 ||
    Math.abs(transform.y) > 0.01 ||
    Math.abs(transform.zoom - 1) > 0.01

  return (
    <div className="flex flex-col gap-1.5">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        className="relative w-full overflow-hidden rounded-sm select-none touch-none"
        style={{
          aspectRatio: String(aspectRatio),
          background: 'var(--film-dark)',
          border: `2px solid ${isSelected ? 'var(--vintage-brown)' : 'var(--border)'}`,
          boxShadow: isSelected ? '0 0 0 2px rgba(92,61,30,0.22)' : '0 2px 8px var(--shadow-color)',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        aria-label={`Adjust framing for photo ${index + 1}`}
      >
        <img
          src={photo}
          alt={`Photo ${index + 1}`}
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget
            if (img.naturalWidth && img.naturalHeight) {
              setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
            }
          }}
          className={geom ? 'absolute max-w-none pointer-events-none' : 'w-full h-full object-cover pointer-events-none'}
          style={
            geom
              ? {
                  width: `${geom.renderedW}px`,
                  height: `${geom.renderedH}px`,
                  left: `${left}px`,
                  top: `${top}px`,
                  filter: cssFilter,
                }
              : { filter: cssFilter }
          }
        />

        {/* Subtle rule-of-thirds guide while dragging */}
        {isDragging && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/25" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/25" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/25" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/25" />
          </div>
        )}

        {/* Photo number badge */}
        <div
          className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-sm pointer-events-none"
          style={{ background: 'rgba(26,20,16,0.72)' }}
        >
          <span className="font-mono text-[10px] text-white">#{index + 1}</span>
        </div>

        {/* Enlarge lightbox trigger */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onEnlarge()
          }}
          className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-sm transition-transform active:scale-90"
          style={{ background: 'rgba(26,20,16,0.72)', color: 'white' }}
          aria-label={`Enlarge photo ${index + 1}`}
          title="Enlarge"
        >
          <ZoomIcon />
        </button>

        {/* Bottom zoom pill if zoomed */}
        {transform.zoom > 1.02 && (
          <div
            className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-sm pointer-events-none"
            style={{ background: 'rgba(26,20,16,0.72)' }}
          >
            <span className="font-mono text-[9px] text-white">{transform.zoom.toFixed(1)}×</span>
          </div>
        )}
      </div>

      {/* Quick footer per frame */}
      <div className="flex items-center justify-between px-0.5">
        <button
          type="button"
          onClick={onSelect}
          className="font-display text-[10px] tracking-wider uppercase"
          style={{ color: isSelected ? 'var(--vintage-brown)' : 'var(--text-muted)', fontWeight: isSelected ? 700 : 400 }}
        >
          Photo {index + 1}
        </button>
        {isModified && (
          <button
            type="button"
            onClick={() => onChange({ ...DEFAULT_PHOTO_TRANSFORM })}
            className="inline-flex items-center gap-1 font-display text-[10px] tracking-wider uppercase hover:underline"
            style={{ color: 'var(--sepia)' }}
          >
            <ResetIcon />
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

export default function PhotoFrameEditor({
  photos,
  transforms,
  layout,
  poseCount,
  filter,
  onChange,
  onResetAll,
  onEnlarge,
}: PhotoFrameEditorProps) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const slotRatios = getLayoutSlotAspectRatios(layout, poseCount)
  const cssFilter = FILTERS.find((f) => f.id === filter)?.cssFilter ?? 'none'

  const safeIdx = selectedIdx < photos.length ? selectedIdx : 0
  const activeTransform = transforms[safeIdx] ?? DEFAULT_PHOTO_TRANSFORM
  const hasAnyModification = transforms.some(
    (t) => Math.abs(t.x) > 0.01 || Math.abs(t.y) > 0.01 || Math.abs(t.zoom - 1) > 0.01
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Frame &amp; Position Your Photos
          </p>
          <p className="text-xs font-body mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <MoveIcon />
            <span>Drag to align · Pinch or slide below to zoom</span>
          </p>
        </div>

        {hasAnyModification && (
          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-1.5 font-display text-[10px] tracking-widest uppercase px-2.5 py-1.5 rounded-sm transition-all active:scale-95"
            style={{ border: '1px solid var(--border)', color: 'var(--vintage-brown)', background: 'var(--surface)' }}
          >
            <ResetIcon />
            Reset All
          </button>
        )}
      </div>

      {/* Interactive slots matching exact layout aspect ratios */}
      <div
        className={`grid gap-3 items-start ${
          photos.length <= 2
            ? 'grid-cols-2'
            : photos.length === 3
              ? 'grid-cols-2 sm:grid-cols-3'
              : photos.length === 4
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-3'
        }`}
      >
        {photos.map((photo, i) => (
          <FrameSlot
            key={i}
            photo={photo}
            index={i}
            aspectRatio={slotRatios[i] ?? 4 / 3}
            cssFilter={cssFilter}
            transform={transforms[i] ?? DEFAULT_PHOTO_TRANSFORM}
            isSelected={safeIdx === i}
            onSelect={() => setSelectedIdx(i)}
            onChange={(next) => onChange(i, next)}
            onEnlarge={() => onEnlarge(i)}
          />
        ))}
      </div>

      {/* Selected photo precision zoom slider */}
      <div
        className="flex flex-wrap items-center gap-3 px-3 py-2.5 rounded-sm"
        style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }}
      >
        <span className="font-display text-[11px] tracking-widest uppercase whitespace-nowrap" style={{ color: 'var(--vintage-brown)' }}>
          Photo #{safeIdx + 1} Zoom
        </span>

        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
          <button
            type="button"
            onClick={() =>
              onChange(safeIdx, { ...activeTransform, zoom: clamp(Number((activeTransform.zoom - 0.15).toFixed(2)), 1, 3) })
            }
            className="w-7 h-7 flex items-center justify-center rounded-sm font-mono text-sm transition-all active:scale-90"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--vintage-brown)' }}
            aria-label="Zoom out"
          >
            −
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={activeTransform.zoom}
            onChange={(e) => {
              const zoom = parseFloat(e.target.value)
              onChange(safeIdx, { ...activeTransform, zoom })
            }}
            className="flex-1 accent-[var(--vintage-brown)] cursor-pointer"
            aria-label={`Zoom for photo ${safeIdx + 1}`}
          />
          <button
            type="button"
            onClick={() =>
              onChange(safeIdx, { ...activeTransform, zoom: clamp(Number((activeTransform.zoom + 0.15).toFixed(2)), 1, 3) })
            }
            className="w-7 h-7 flex items-center justify-center rounded-sm font-mono text-sm transition-all active:scale-90"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--vintage-brown)' }}
            aria-label="Zoom in"
          >
            +
          </button>
        </div>

        <span className="font-mono text-xs w-10 text-right" style={{ color: 'var(--text-secondary)' }}>
          {activeTransform.zoom.toFixed(1)}×
        </span>
      </div>
    </div>
  )
}
