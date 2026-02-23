'use client'; // This is the magic fix

import { useState, useCallback, useEffect, useRef } from 'react'
import Nav from '@/components/Nav'
import PrivacyModal from '@/components/PrivacyModal'
import CameraBooth from '@/components/CameraBooth'
import FilterSelector from '@/components/FilterSelector'
import LayoutSelector from '@/components/LayoutSelector'
import ExportPanel from '@/components/ExportPanel'
import { generatePhotoboothCanvas } from '@/lib/canvasExport'
import {
  FilterType, LayoutType, PoseCount, CountdownSeconds, PhotoSession,
  POSE_COUNT_OPTIONS, COUNTDOWN_OPTIONS, getDefaultLayout, FILTERS, ALL_LAYOUTS,
} from '@/lib/types'

type Step = 'setup' | 'privacy' | 'camera' | 'customize' | 'export'

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}
function CameraIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}
function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}
function ArrowLeftIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  )
}
function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

// ── Photo Lightbox ─────────────────────────────────────────────────────────────
function PhotoLightbox({ photos, startIndex, onClose }: { photos: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex)

  const prev = () => setIdx(i => Math.max(0, i - 1))
  const next = () => setIdx(i => Math.min(photos.length - 1, i + 1))

  return (
    <div
      className="fixed inset-0 z-[300] select-none flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(10,8,6,0.95)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div className="relative animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <img
          src={photos[idx]}
          alt={`Photo ${idx + 1}`}
          style={{
            maxWidth: 'min(92vw, 640px)',
            maxHeight: 'min(85vh, 700px)',
            objectFit: 'contain',
            border: '6px solid white',
            boxShadow: '0 32px 100px rgba(0,0,0,0.8)',
            display: 'block',
          }}
        />

        {/* Counter */}
        <div
          className="absolute -bottom-8 left-0 right-0 text-center font-display text-xs tracking-widest uppercase"
          style={{ color: 'rgba(245,240,232,0.55)' }}
        >
          {idx + 1} / {photos.length}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-90"
          style={{ background: 'var(--vintage-brown)', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        {/* Prev */}
        {idx > 0 && (
          <button
            onClick={prev}
            className="absolute top-1/2 -translate-y-1/2 -left-14 w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-90"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
          >
            <ArrowLeftIcon />
          </button>
        )}

        {/* Next */}
        {idx < photos.length - 1 && (
          <button
            onClick={next}
            className="absolute top-1/2 -translate-y-1/2 -right-14 w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-90"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
          >
            <ArrowRightIcon />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Step Progress ──────────────────────────────────────────────────────────────
const STEPS: { key: Step; label: string }[] = [
  { key: 'setup', label: 'Setup' },
  { key: 'camera', label: 'Camera' },
  { key: 'customize', label: 'Customize' },
  { key: 'export', label: 'Export' },
]

function StepProgress({ current }: { current: Step }) {
  const order: Step[] = ['setup', 'camera', 'customize', 'export']
  const ci = order.indexOf(current)
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map(({ key, label }, i) => {
        const done = order.indexOf(key) < ci
        const active = key === current
        return (
          <div key={key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: done ? 'var(--sepia)' : active ? 'var(--vintage-brown)' : 'var(--surface-3)',
                  border: `2px solid ${done || active ? 'transparent' : 'var(--border)'}`,
                }}
              >
                {done ? (
                  <span style={{ color: 'white' }}><CheckIcon /></span>
                ) : (
                  <span className="font-mono text-xs font-bold" style={{ color: active ? 'white' : 'var(--text-muted)' }}>
                    {i + 1}
                  </span>
                )}
              </div>
              <span
                className="font-display text-[10px] tracking-widest uppercase"
                style={{ color: active ? 'var(--vintage-brown)' : 'var(--text-muted)', fontWeight: active ? '700' : '400' }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="w-10 sm:w-16 h-px mx-1 mb-5 transition-all duration-300"
                style={{ background: order.indexOf(key) < ci ? 'var(--sepia)' : 'var(--border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Live Preview ───────────────────────────────────────────────────────────────
function LivePreview({ session }: { session: PhotoSession }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const genIdRef = useRef(0)

  useEffect(() => {
    if (!session.photos.length) return
    const id = ++genIdRef.current
    setIsGenerating(true)
    generatePhotoboothCanvas(session)
      .then((canvas) => {
        if (genIdRef.current === id) setPreviewUrl(canvas.toDataURL('image/jpeg', 0.85))
      })
      .catch(console.error)
      .finally(() => { if (genIdRef.current === id) setIsGenerating(false) })
  }, [session])

  return (
    <div className="section-card">
      <p className="font-display text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
        Live Preview
      </p>
      <div className="flex justify-center">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-3 py-10" style={{ color: 'var(--text-muted)' }}>
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--vintage-brown)' }}
            />
            <span className="font-display text-xs tracking-widest uppercase">Rendering…</span>
          </div>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt="Live strip preview"
            style={{
              maxWidth: '100%',
              maxHeight: '420px',
              objectFit: 'contain',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 24px var(--shadow-color)',
            }}
          />
        ) : (
          <p className="font-body text-xs py-6" style={{ color: 'var(--text-muted)' }}>Preview unavailable</p>
        )}
      </div>
    </div>
  )
}

// ── Customize Step ─────────────────────────────────────────────────────────────
function CustomizeStep({
  photos,
  filter,
  layout,
  poseCount,
  caption,
  showDate,
  onFilterChange,
  onLayoutChange,
  onCaptionChange,
  onDateToggle,
  onBack,
  onNext,
}: {
  photos: string[]
  filter: FilterType
  layout: LayoutType
  poseCount: PoseCount
  caption: string
  showDate: boolean
  onFilterChange: (f: FilterType) => void
  onLayoutChange: (l: LayoutType) => void
  onCaptionChange: (c: string) => void
  onDateToggle: () => void
  onBack: () => void
  onNext: () => void
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  return (
    <div className="space-y-6 animate-fade-in-up">
      {lightboxIdx !== null && (
        <PhotoLightbox
          photos={photos}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      <div className="text-center">
        <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
          Customize Your Strip
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Choose your filter, layout, and details
        </p>
      </div>

      {/* Photo thumbnails — CLICK TO ENLARGE (FIX) */}
      <div className="section-card">
        <p className="font-display text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
          Your Photos — tap to enlarge
        </p>
        <div className="flex gap-3 flex-wrap">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setLightboxIdx(i)}
              className="relative flex-shrink-0 rounded-sm overflow-hidden transition-all hover:scale-105 active:scale-95 group"
              style={{
                width: photos.length <= 3 ? '90px' : '72px',
                aspectRatio: '4/3',
                border: '2px solid var(--border)',
                boxShadow: '0 2px 8px var(--shadow-color)',
              }}
              aria-label={`Enlarge photo ${i + 1}`}
            >
              <img
                src={photo}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
                style={{ filter: filter !== 'none' ? undefined : undefined }}
              />
              {/* Hover overlay with zoom icon */}
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ background: 'rgba(26,20,16,0.5)' }}
              >
                <div style={{ color: 'white' }}><ZoomIcon /></div>
              </div>
              {/* Photo number badge */}
              <div
                className="absolute bottom-1 right-1 w-4 h-4 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(26,20,16,0.7)' }}
              >
                <span className="font-mono text-[9px] text-white">{i + 1}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filter selector */}
      <div className="section-card">
        <FilterSelector
          selected={filter}
          previewPhoto={photos[0]}
          onSelect={onFilterChange}
        />
      </div>

      {/* Layout selector */}
      <div className="section-card">
        <LayoutSelector
          selected={layout}
          poseCount={poseCount}
          onSelect={onLayoutChange}
        />
      </div>

      {/* Live Preview */}
      <LivePreview session={{ photos, filter, layout, caption, showDate, poseCount }} />

      {/* Caption & date */}
      <div className="section-card space-y-4">
        <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Strip Details
        </p>
        <div>
          <label className="block font-display text-xs tracking-wide uppercase mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Caption (optional)
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="e.g. Summer 2025, Best Friends, ..."
            maxLength={60}
            className="w-full px-4 py-3 font-body text-sm rounded-sm outline-none transition-all"
            style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--vintage-brown)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <div>
            <p className="font-display text-xs tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
              Show Date
            </p>
            <p className="text-xs font-body mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Print today&apos;s date on the strip
            </p>
          </div>
          <button
            onClick={onDateToggle}
            className={`toggle-track flex-shrink-0 ${showDate ? 'on' : ''}`}
            aria-label="Toggle date"
          >
            <div className="toggle-thumb" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-display text-xs tracking-widest uppercase px-5 py-3.5 rounded-sm transition-all active:scale-95"
          style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}
        >
          <ArrowLeftIcon />
          Retake
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 font-display text-sm tracking-widest uppercase py-4 rounded-sm transition-all active:scale-95 shadow-sm"
          style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
        >
          <DownloadIcon />
          Preview & Export
        </button>
      </div>
    </div>
  )
}

// ── Session Summary ────────────────────────────────────────────────────────────
function CameraSmIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}
function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}
function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  )
}
function LayoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}

function SessionSummary({
  poseCount, countdown, filter, layout,
}: {
  poseCount: PoseCount
  countdown: CountdownSeconds
  filter: FilterType
  layout: LayoutType
}) {
  const filterLabel = FILTERS.find(f => f.id === filter)?.label ?? 'No filter'
  const layoutLabel = ALL_LAYOUTS.find(l => l.id === layout)?.label ?? layout

  return (
    <div
      className="section-card"
      style={{ background: 'var(--parchment)' }}
    >
      <p className="font-display text-xs tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
        Session Summary
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <div className="flex items-center gap-2.5">
          <span style={{ color: 'var(--sepia)' }}><CameraSmIcon /></span>
          <span className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>
            {poseCount} {poseCount === 2 ? 'photo' : 'photos'}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span style={{ color: 'var(--sepia)' }}><ClockIcon /></span>
          <span className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>
            {countdown}s countdown
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span style={{ color: 'var(--sepia)' }}><FilterIcon /></span>
          <span className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>
            {filterLabel}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span style={{ color: 'var(--sepia)' }}><LayoutIcon /></span>
          <span className="font-body text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
            {layoutLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Setup Step ─────────────────────────────────────────────────────────────────
function SetupStep({
  poseCount,
  filter,
  layout,
  countdown,
  onPoseChange,
  onFilterChange,
  onLayoutChange,
  onCountdownChange,
  onStart,
}: {
  poseCount: PoseCount
  filter: FilterType
  layout: LayoutType
  countdown: CountdownSeconds
  onPoseChange: (p: PoseCount) => void
  onFilterChange: (f: FilterType) => void
  onLayoutChange: (l: LayoutType) => void
  onCountdownChange: (c: CountdownSeconds) => void
  onStart: () => void
}) {
  return (
    <div className="space-y-6 animate-fade-in-up select-none">
      <div className="text-center">
        <p className="font-display text-xs tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--sepia)' }}>
          Step 1 of 4
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
          Set Up Your Session
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Choose your poses, filter, layout, and countdown
        </p>
      </div>

      {/* Number of poses */}
      <div className="section-card space-y-3">
        <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Number of Poses
        </p>
        <div className="grid grid-cols-4 gap-2">
          {POSE_COUNT_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => onPoseChange(p)}
              className="flex flex-col items-center py-3 rounded-sm transition-all active:scale-95"
              style={{
                border: `1px solid ${poseCount === p ? 'var(--vintage-brown)' : 'var(--border)'}`,
                background: poseCount === p ? 'rgba(92,61,30,0.07)' : 'var(--surface)',
              }}
            >
              <span className="font-display text-xl font-bold" style={{ color: poseCount === p ? 'var(--vintage-brown)' : 'var(--text-secondary)' }}>
                {p}
              </span>
              <span className="font-display text-[10px] tracking-wide uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {p === 2 ? 'pose' : 'poses'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Countdown */}
      <div className="section-card space-y-3">
        <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Countdown Timer
        </p>
        <div className="grid grid-cols-3 gap-2">
          {COUNTDOWN_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onCountdownChange(s)}
              className="flex flex-col items-center py-3 rounded-sm transition-all active:scale-95"
              style={{
                border: `1px solid ${countdown === s ? 'var(--vintage-brown)' : 'var(--border)'}`,
                background: countdown === s ? 'rgba(92,61,30,0.07)' : 'var(--surface)',
              }}
            >
              <span className="font-display text-xl font-bold" style={{ color: countdown === s ? 'var(--vintage-brown)' : 'var(--text-secondary)' }}>
                {s}s
              </span>
              <span className="font-display text-[10px] tracking-wide uppercase mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {s === 3 ? 'quick' : s === 5 ? 'normal' : 'relaxed'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter preview */}
      <div className="section-card">
        <FilterSelector
          selected={filter}
          onSelect={onFilterChange}
        />
      </div>

      {/* Layout selector */}
      <div className="section-card">
        <LayoutSelector
          selected={layout}
          poseCount={poseCount}
          onSelect={onLayoutChange}
        />
      </div>

      {/* Session Summary */}
      <SessionSummary
        poseCount={poseCount}
        countdown={countdown}
        filter={filter}
        layout={layout}
      />

      <button
        onClick={onStart}
        className="w-full flex items-center justify-center gap-3 font-display text-sm tracking-widest uppercase py-5 rounded-sm transition-all active:scale-[.98] shadow-lg"
        style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
      >
        <CameraIcon size={18} />
        Start Photobooth Session
        <ArrowRightIcon />
      </button>

      <p className="text-center text-xs font-body" style={{ color: 'var(--text-muted)', opacity: 0.65 }}>
        {poseCount} photos · {countdown}s countdown each · fully automatic
      </p>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PhotoboothPage() {
  const [step, setStep] = useState<Step>('setup')
  const [poseCount, setPoseCount] = useState<PoseCount>(4)
  const [filter, setFilter] = useState<FilterType>('none')
  const [layout, setLayout] = useState<LayoutType>(getDefaultLayout(4))
  const [countdown, setCountdown] = useState<CountdownSeconds>(5)
  const [caption, setCaption] = useState('')
  const [showDate, setShowDate] = useState(true)
  const [photos, setPhotos] = useState<string[]>([])
  const [showPrivacy, setShowPrivacy] = useState(false)

  const insideBooth = step === 'camera' || step === 'customize' || step === 'export'

  const handlePoseChange = (p: PoseCount) => {
    setPoseCount(p)
    setLayout(getDefaultLayout(p))
  }

  const handlePrivacyAccept = () => {
    setShowPrivacy(false)
    setStep('camera')
  }

  const handlePhotosCapture = useCallback((captured: string[]) => {
    setPhotos(captured)
    setStep('customize')
  }, [])

  const session: PhotoSession = {
    photos,
    filter,
    layout,
    caption,
    showDate,
    poseCount,
  }

  return (
    <div className="min-h-screen film-grain select-none" style={{ background: 'var(--cream)' }}>
      <Nav insideBooth={insideBooth} onLeaveConfirm={() => setStep('setup')} />

      <main className="pt-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

          {/* Step indicator — only show for non-camera steps */}
          {step !== 'camera' && (
            <StepProgress current={step} />
          )}

          {step === 'setup' && (
            <SetupStep
              poseCount={poseCount}
              filter={filter}
              layout={layout}
              countdown={countdown}
              onPoseChange={handlePoseChange}
              onFilterChange={setFilter}
              onLayoutChange={setLayout}
              onCountdownChange={setCountdown}
              onStart={() => setShowPrivacy(true)}
            />
          )}

          {step === 'camera' && (
            <div className="animate-fade-in-up">
              <CameraBooth
                filter={filter}
                poseCount={poseCount}
                countdownSeconds={countdown}
                onPhotosCapture={handlePhotosCapture}
                onCancel={() => setStep('setup')}
              />
            </div>
          )}

          {step === 'customize' && photos.length > 0 && (
            <CustomizeStep
              photos={photos}
              filter={filter}
              layout={layout}
              poseCount={poseCount}
              caption={caption}
              showDate={showDate}
              onFilterChange={setFilter}
              onLayoutChange={setLayout}
              onCaptionChange={setCaption}
              onDateToggle={() => setShowDate((d) => !d)}
              onBack={() => setStep('camera')}
              onNext={() => setStep('export')}
            />
          )}

          {step === 'export' && photos.length > 0 && (
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setStep('customize')}
                  className="flex items-center gap-2 font-display text-xs tracking-widest uppercase px-4 py-2.5 rounded-sm transition-all active:scale-95"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}
                >
                  <ArrowLeftIcon />
                  Edit
                </button>
                <div>
                  <h2 className="font-display text-lg font-bold" style={{ color: 'var(--vintage-brown)' }}>
                    Your Photo Strip
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Preview and download
                  </p>
                </div>
              </div>
              <ExportPanel
                session={session}
                onRetake={() => {
                  setPhotos([])
                  setStep('setup')
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      {step === 'setup' && (
        <footer
          className="py-6 mt-8"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--parchment)' }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              ✦ Vintage Photobooth
            </p>
            <p className="font-body text-xs" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
              Developed by{' '}
              <span style={{ color: 'var(--sepia)', fontStyle: 'italic' }}>Angela Gardan</span>
              <span style={{ color: 'var(--text-muted)', opacity: 0.5 }}>{' '}· Jelly</span>
            </p>
            <div className="flex gap-5 text-xs font-display tracking-widest uppercase" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
              <a href="/privacy" className="hover:opacity-100 transition-opacity">Privacy</a>
              <a href="/terms" className="hover:opacity-100 transition-opacity">Terms</a>
            </div>
          </div>
        </footer>
      )}

      {/* Privacy modal */}
      {showPrivacy && (
        <PrivacyModal
          onAccept={handlePrivacyAccept}
          onDecline={() => setShowPrivacy(false)}
        />
      )}
    </div>
  )
}
