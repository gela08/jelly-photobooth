'use client'; // This is the magic fix

import { useState, useCallback, useEffect, useRef } from 'react'
import Nav from '@/components/Nav'
import PrivacyModal from '@/components/PrivacyModal'
import CameraBooth from '@/components/CameraBooth'
import FilterSelector from '@/components/FilterSelector'
import LayoutSelector from '@/components/LayoutSelector'
import ExportPanel from '@/components/ExportPanel'
import PhotoFrameEditor from '@/components/PhotoFrameEditor'
import StripDesignSelector from '@/components/StripDesignSelector'
import StickerEditor from '@/components/StickerEditor'
import SessionProtectionModal from '@/components/SessionProtectionModal'
import LivePhotoViewer from '@/components/LivePhotoPlayer'
import { downloadPhoto } from '@/lib/canvasExport'
import {
  clearActiveDraft,
  deleteSavedSession,
  hydrateStoredSession,
  listSavedSessions,
  loadActiveDraft,
  PersistedSessionRecord,
  saveActiveDraft,
  saveSessionSnapshot,
  serializeSessionForStorage,
} from '@/lib/sessionStorage'
import {
  FilterType, LayoutType, PoseCount, CountdownSeconds, PhotoSession, PhotoTransform,
  PlacedSticker, StripBorderStyle, StripDecoration, StripThemeId, SessionVideoData, LivePhotoItem,
  DEFAULT_PHOTO_TRANSFORM, POSE_COUNT_OPTIONS, COUNTDOWN_OPTIONS, getDefaultLayout, FILTERS, ALL_LAYOUTS,
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
function PhotoLightbox({
  photos,
  livePhotos,
  filter = 'none',
  startIndex,
  cssFilter = 'none',
  onClose,
}: {
  photos: string[]
  livePhotos?: LivePhotoItem[]
  filter?: FilterType
  startIndex: number
  cssFilter?: string
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIndex)

  const prev = () => setIdx(i => Math.max(0, i - 1))
  const next = () => setIdx(i => Math.min(photos.length - 1, i + 1))
  const activeLive = livePhotos?.[idx]

  return (
    <div
      className="fixed inset-0 z-[300] select-none flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(10,8,6,0.95)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div className="relative animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {activeLive?.videoUrl ? (
          <div
            style={{
              width: 'min(92vw, 640px)',
              aspectRatio: '4/3',
              maxHeight: 'min(82vh, 700px)',
              border: '6px solid white',
              boxShadow: '0 32px 100px rgba(0,0,0,0.8)',
              background: '#000',
            }}
          >
            <LivePhotoViewer
              item={activeLive}
              filter={filter}
              poseNumber={idx + 1}
              className="w-full h-full"
            />
          </div>
        ) : (
          <img
            src={photos[idx]}
            alt={`Photo ${idx + 1}`}
            style={{
              maxWidth: 'min(92vw, 640px)',
              maxHeight: 'min(82vh, 700px)',
              objectFit: 'contain',
              border: '6px solid white',
              boxShadow: '0 32px 100px rgba(0,0,0,0.8)',
              display: 'block',
              filter: cssFilter,
            }}
          />
        )}

        {/* Counter */}
        <div
          className="absolute -bottom-8 left-0 right-0 text-center font-display text-xs tracking-widest uppercase"
          style={{ color: 'rgba(245,240,232,0.55)' }}
        >
          {idx + 1} / {photos.length}{activeLive?.videoUrl ? ' · Live Photo' : ''}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-90"
          style={{ background: 'var(--vintage-brown)', color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        {/* Prev */}
        {idx > 0 && (
          <button
            onClick={prev}
            className="absolute top-1/2 -translate-y-1/2 left-2 sm:-left-14 w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-90"
            style={{ background: 'rgba(14,11,8,0.65)', color: 'white' }}
            aria-label="Previous photo"
          >
            <ArrowLeftIcon />
          </button>
        )}

        {/* Next */}
        {idx < photos.length - 1 && (
          <button
            onClick={next}
            className="absolute top-1/2 -translate-y-1/2 right-2 sm:-right-14 w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-90"
            style={{ background: 'rgba(14,11,8,0.65)', color: 'white' }}
            aria-label="Next photo"
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

// ── Customize Step ─────────────────────────────────────────────────────────────
function CustomizeStep({
  photos,
  livePhotos,
  photoTransforms,
  filter,
  layout,
  poseCount,
  caption,
  showDate,
  stickers,
  stripTheme,
  customStripColor,
  borderStyle,
  stripDecoration,
  onTransformChange,
  onResetTransforms,
  onFilterChange,
  onLayoutChange,
  onCaptionChange,
  onDateToggle,
  onStickersChange,
  onThemeChange,
  onCustomColorChange,
  onBorderChange,
  onDecorationChange,
  onBack,
  onNext,
}: {
  photos: string[]
  livePhotos?: LivePhotoItem[]
  photoTransforms: PhotoTransform[]
  filter: FilterType
  layout: LayoutType
  poseCount: PoseCount
  caption: string
  showDate: boolean
  stickers: PlacedSticker[]
  stripTheme: StripThemeId
  customStripColor: string
  borderStyle: StripBorderStyle
  stripDecoration: StripDecoration
  onTransformChange: (index: number, next: PhotoTransform) => void
  onResetTransforms: () => void
  onFilterChange: (f: FilterType) => void
  onLayoutChange: (l: LayoutType) => void
  onCaptionChange: (c: string) => void
  onDateToggle: () => void
  onStickersChange: (next: PlacedSticker[]) => void
  onThemeChange: (id: StripThemeId) => void
  onCustomColorChange: (hex: string) => void
  onBorderChange: (style: StripBorderStyle) => void
  onDecorationChange: (dec: StripDecoration) => void
  onBack: () => void
  onNext: () => void
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const cssFilter = FILTERS.find((f) => f.id === filter)?.cssFilter ?? 'none'

  const currentSession: PhotoSession = {
    photos,
    photoTransforms,
    filter,
    layout,
    caption,
    showDate,
    poseCount,
    stickers,
    stripTheme,
    customStripColor,
    borderStyle,
    stripDecoration,
    livePhotos,
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {lightboxIdx !== null && (
        <PhotoLightbox
          photos={photos}
          livePhotos={livePhotos}
          filter={filter}
          startIndex={lightboxIdx}
          cssFilter={cssFilter}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      <div className="text-center">
        <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
          Customize Your Strip
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Adjust photo framing, filter, strip design, and stickers
        </p>
      </div>

      {/* Interactive photo framing & positioning */}
      <div className="section-card">
        <PhotoFrameEditor
          photos={photos}
          transforms={photoTransforms}
          layout={layout}
          poseCount={poseCount}
          filter={filter}
          livePhotos={livePhotos}
          onChange={onTransformChange}
          onResetAll={onResetTransforms}
          onEnlarge={(idx) => setLightboxIdx(idx)}
        />
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

      {/* Strip Design System (Theme, Colors, Borders, Corner Accents) */}
      <div className="section-card">
        <StripDesignSelector
          stripTheme={stripTheme}
          customStripColor={customStripColor}
          borderStyle={borderStyle}
          stripDecoration={stripDecoration}
          onThemeChange={onThemeChange}
          onCustomColorChange={onCustomColorChange}
          onBorderChange={onBorderChange}
          onDecorationChange={onDecorationChange}
        />
      </div>

      {/* Interactive Live Strip Preview + Sticker Editor */}
      <div className="section-card">
        <StickerEditor
          session={currentSession}
          stickers={stickers}
          onChange={onStickersChange}
        />
      </div>

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
            {poseCount} photos
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
  layout,
  countdown,
  filter,
  liveCaptureEnabled,
  livePhotoEnabled,
  includeAudio,
  recoverableDraft,
  savedSessions,
  onRestoreDraft,
  onDiscardDraft,
  onRestoreSavedSession,
  onDeleteSavedSession,
  onPoseChange,
  onLayoutChange,
  onCountdownChange,
  onLiveCaptureToggle,
  onLivePhotoToggle,
  onAudioToggle,
  onStart,
}: {
  poseCount: PoseCount
  layout: LayoutType
  countdown: CountdownSeconds
  filter: FilterType
  liveCaptureEnabled: boolean
  livePhotoEnabled: boolean
  includeAudio: boolean
  recoverableDraft: PersistedSessionRecord | null
  savedSessions: PersistedSessionRecord[]
  onRestoreDraft: () => void
  onDiscardDraft: () => void
  onRestoreSavedSession: (record: PersistedSessionRecord) => void
  onDeleteSavedSession: (id: string) => void
  onPoseChange: (p: PoseCount) => void
  onLayoutChange: (l: LayoutType) => void
  onCountdownChange: (c: CountdownSeconds) => void
  onLiveCaptureToggle: () => void
  onLivePhotoToggle: () => void
  onAudioToggle: () => void
  onStart: () => void
}) {
  const [showSavedList, setShowSavedList] = useState(false)

  return (
    <div className="space-y-6 animate-fade-in-up select-none">
      {recoverableDraft && recoverableDraft.photos.length > 0 && (
        <div
          className="section-card flex flex-wrap items-center justify-between gap-3"
          style={{ background: 'var(--parchment)', border: '1px solid var(--vintage-brown)' }}
        >
          <div className="min-w-0">
            <p className="font-display text-xs tracking-widest uppercase font-bold" style={{ color: 'var(--vintage-brown)' }}>
              Recoverable Session Found
            </p>
            <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {recoverableDraft.photos.length} photos · saved {new Date(recoverableDraft.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDiscardDraft}
              className="px-3 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase transition-all active:scale-95"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={onRestoreDraft}
              className="px-3.5 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase transition-all active:scale-95"
              style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
            >
              Restore Session
            </button>
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="font-display text-xs tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--sepia)' }}>
          Step 1 of 4
        </p>
        <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
          Set Up Your Session
        </h2>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Choose your poses, layout, and countdown
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

      {/* Layout selector */}
      <div className="section-card">
        <LayoutSelector
          selected={layout}
          poseCount={poseCount}
          onSelect={onLayoutChange}
        />
      </div>

      {/* Optional Live Photo & Video Capture */}
      <div className="section-card space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
              Live Motion &amp; Video (Optional)
            </p>
            <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Save a moving iOS Live-style GIF strip &amp; short session clip alongside photos
            </p>
          </div>
          <button
            type="button"
            onClick={onLiveCaptureToggle}
            className={`toggle-track flex-shrink-0 ${liveCaptureEnabled ? 'on' : ''}`}
            aria-label="Toggle Live Motion and Video capture"
          >
            <div className="toggle-thumb" />
          </button>
        </div>

        <div
          className="flex items-center justify-between gap-4 pt-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div>
            <p className="font-display text-[11px] tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
              iOS Live Photo Mode (3s per pose)
            </p>
            <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Captures ~1.5s before &amp; ~1.5s after each shutter with synced audio
            </p>
          </div>
          <button
            type="button"
            onClick={onLivePhotoToggle}
            className={`toggle-track flex-shrink-0 ${livePhotoEnabled ? 'on' : ''}`}
            aria-label="Toggle iOS Live Photo mode"
          >
            <div className="toggle-thumb" />
          </button>
        </div>

        {(liveCaptureEnabled || livePhotoEnabled) && (
          <div
            className="flex items-center justify-between gap-4 pt-3"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <div>
              <p className="font-display text-[11px] tracking-wide uppercase" style={{ color: 'var(--text-secondary)' }}>
                Include Microphone Audio
              </p>
              <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Used for Live Photo clips &amp; session video (GIF is always silent)
              </p>
            </div>
            <button
              type="button"
              onClick={onAudioToggle}
              className={`toggle-track flex-shrink-0 ${includeAudio ? 'on' : ''}`}
              aria-label="Toggle microphone audio for video recording"
            >
              <div className="toggle-thumb" />
            </button>
          </div>
        )}
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
        {poseCount} photos · {countdown}s countdown each · {livePhotoEnabled ? 'iOS Live Photo enabled' : liveCaptureEnabled ? 'Live GIF & video enabled' : 'photos only'}
      </p>

      {savedSessions.length > 0 && (
        <div className="section-card space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-display text-[11px] tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
              Saved Sessions ({savedSessions.length})
            </p>
            <button
              type="button"
              onClick={() => setShowSavedList((v) => !v)}
              className="font-display text-[10px] tracking-widest uppercase underline"
              style={{ color: 'var(--sepia)' }}
            >
              {showSavedList ? 'Hide' : 'View'}
            </button>
          </div>

          {showSavedList && (
            <div className="space-y-2 pt-1">
              {savedSessions.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-sm"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="min-w-0">
                    <p className="font-display text-xs font-bold truncate" style={{ color: 'var(--vintage-brown)' }}>
                      {item.caption ? `"${item.caption}"` : `${item.photos.length}-Pose Strip`}
                    </p>
                    <p className="font-body text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {new Date(item.savedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onRestoreSavedSession(item)}
                      className="px-2.5 py-1 rounded-sm font-display text-[10px] tracking-widest uppercase"
                      style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteSavedSession(item.id)}
                      className="px-2 py-1 rounded-sm font-display text-[10px] tracking-widest uppercase"
                      style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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
  const [photoTransforms, setPhotoTransforms] = useState<PhotoTransform[]>([])
  const [stickers, setStickers] = useState<PlacedSticker[]>([])
  const [stripTheme, setStripTheme] = useState<StripThemeId>('auto')
  const [customStripColor, setCustomStripColor] = useState<string>('#e8d5c4')
  const [borderStyle, setBorderStyle] = useState<StripBorderStyle>('classic')
  const [stripDecoration, setStripDecoration] = useState<StripDecoration>('none')
  const [liveCaptureEnabled, setLiveCaptureEnabled] = useState(true)
  const [livePhotoEnabled, setLivePhotoEnabled] = useState(false)
  const [includeAudio, setIncludeAudio] = useState(false)
  const [sessionVideo, setSessionVideo] = useState<SessionVideoData | undefined>(undefined)
  const [showPrivacy, setShowPrivacy] = useState(false)

  // Session protection & recovery state
  const [isDirty, setIsDirty] = useState(false)
  const [hasUnsavedCameraShots, setHasUnsavedCameraShots] = useState(false)
  const [protectionModal, setProtectionModal] = useState<'refresh' | 'new_session' | null>(null)
  const [isProtectionSaving, setIsProtectionSaving] = useState(false)
  const [protectionSaveError, setProtectionSaveError] = useState<string | null>(null)
  const [recoverableDraft, setRecoverableDraft] = useState<PersistedSessionRecord | null>(null)
  const [savedSessions, setSavedSessions] = useState<PersistedSessionRecord[]>([])

  const sessionVideoRef = useRef<SessionVideoData | undefined>(undefined)
  sessionVideoRef.current = sessionVideo
  const skipBeforeUnloadRef = useRef(false)

  const revokeMediaUrls = useCallback((videoData?: SessionVideoData) => {
    if (!videoData) return
    if (videoData.videoUrl) URL.revokeObjectURL(videoData.videoUrl)
    videoData.livePhotos?.forEach((lp) => {
      if (lp.videoUrl) URL.revokeObjectURL(lp.videoUrl)
    })
  }, [])

  useEffect(() => {
    return () => {
      revokeMediaUrls(sessionVideoRef.current)
    }
  }, [revokeMediaUrls])

  // Load recoverable draft and saved session snapshots on mount
  const refreshStoredSessions = useCallback(async () => {
    try {
      const [draft, saved] = await Promise.all([loadActiveDraft(), listSavedSessions()])
      setRecoverableDraft(draft)
      setSavedSessions(saved)
    } catch {
      // IndexedDB unavailable (e.g. private browsing restrictions) — degrade silently
    }
  }, [])

  useEffect(() => {
    refreshStoredSessions()
  }, [refreshStoredSessions])

  const insideBooth = step === 'camera' || step === 'customize' || step === 'export'
  const hasUnsavedWork =
    (photos.length > 0 && isDirty) || (step === 'camera' && hasUnsavedCameraShots)

  const clearRecordedMedia = useCallback(() => {
    setSessionVideo((prev) => {
      revokeMediaUrls(prev)
      return undefined
    })
  }, [revokeMediaUrls])

  const resetToNewSession = useCallback(() => {
    clearRecordedMedia()
    setPhotos([])
    setPhotoTransforms([])
    setStickers([])
    setCaption('')
    setIsDirty(false)
    setHasUnsavedCameraShots(false)
    setStep('setup')
    setRecoverableDraft(null)
    clearActiveDraft()
      .catch(() => {})
      .finally(() => {
        refreshStoredSessions()
      })
  }, [clearRecordedMedia, refreshStoredSessions])

  // Native beforeunload protection whenever unsaved work exists
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedWork || skipBeforeUnloadRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedWork])

  // In-app dialog when user presses keyboard reload shortcuts (F5, Ctrl/Cmd+R) with unsaved work
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasUnsavedWork) return
      const isRefreshKey =
        e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r')
      if (isRefreshKey) {
        e.preventDefault()
        setProtectionSaveError(null)
        setProtectionModal('refresh')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsavedWork])

  // Autosave active working session draft so accidental browser reloads can be recovered
  useEffect(() => {
    if (!isDirty || photos.length === 0 || (step !== 'customize' && step !== 'export')) return
    const timer = window.setTimeout(async () => {
      try {
        const serialized = await serializeSessionForStorage({
          id: 'active',
          step,
          poseCount,
          countdown,
          filter,
          layout,
          caption,
          showDate,
          photos,
          photoTransforms,
          stickers,
          stripTheme,
          customStripColor,
          borderStyle,
          stripDecoration,
          liveCaptureEnabled,
          livePhotoEnabled,
          includeAudio,
          sessionVideo,
        })
        await saveActiveDraft(serialized)
      } catch {
        // Ignore quota/storage errors silently during background autosave
      }
    }, 650)
    return () => window.clearTimeout(timer)
  }, [
    isDirty,
    step,
    poseCount,
    countdown,
    filter,
    layout,
    caption,
    showDate,
    photos,
    photoTransforms,
    stickers,
    stripTheme,
    customStripColor,
    borderStyle,
    stripDecoration,
    liveCaptureEnabled,
    livePhotoEnabled,
    includeAudio,
    sessionVideo,
  ])

  const handlePoseChange = (p: PoseCount) => {
    setPoseCount(p)
    setLayout(getDefaultLayout(p))
  }

  const handlePrivacyAccept = () => {
    setShowPrivacy(false)
    setStep('camera')
  }

  const handlePhotosCapture = useCallback((captured: string[], videoData?: SessionVideoData) => {
    setPhotos(captured)
    setPhotoTransforms(captured.map(() => ({ ...DEFAULT_PHOTO_TRANSFORM })))
    setStickers([])
    setSessionVideo((prev) => {
      if (prev && prev !== videoData) {
        if (prev.videoUrl && prev.videoUrl !== videoData?.videoUrl) {
          URL.revokeObjectURL(prev.videoUrl)
        }
        prev.livePhotos?.forEach((lp) => {
          const stillUsed = videoData?.livePhotos?.some((nextLp) => nextLp.videoUrl === lp.videoUrl)
          if (lp.videoUrl && !stillUsed) URL.revokeObjectURL(lp.videoUrl)
        })
      }
      return videoData
    })
    setHasUnsavedCameraShots(false)
    setIsDirty(true)
    setStep('customize')
  }, [])

  const markDirtyIfSession = useCallback(() => {
    if (photos.length > 0) setIsDirty(true)
  }, [photos.length])

  const handleTransformChange = useCallback((index: number, next: PhotoTransform) => {
    setPhotoTransforms((prev) => {
      const updated = [...prev]
      updated[index] = next
      return updated
    })
    setIsDirty(true)
  }, [])

  const handleResetTransforms = useCallback(() => {
    setPhotoTransforms(photos.map(() => ({ ...DEFAULT_PHOTO_TRANSFORM })))
    setIsDirty(true)
  }, [photos])

  const session: PhotoSession = {
    photos,
    photoTransforms,
    filter,
    layout,
    caption,
    showDate,
    poseCount,
    stickers,
    stripTheme,
    customStripColor,
    borderStyle,
    stripDecoration,
    liveFramesPerPose: sessionVideo?.liveFramesPerPose,
    livePhotos: sessionVideo?.livePhotos,
  }

  const performVerifiedSave = async (): Promise<boolean> => {
    if (photos.length === 0) {
      setProtectionSaveError('Finalize your photos before saving (tap "Looks Great!" in the camera view).')
      return false
    }
    try {
      await downloadPhoto(session, 'print')
      const serialized = await serializeSessionForStorage({
        id: `snap_${Date.now()}`,
        step: step === 'export' ? 'export' : 'customize',
        poseCount,
        countdown,
        filter,
        layout,
        caption,
        showDate,
        photos,
        photoTransforms,
        stickers,
        stripTheme,
        customStripColor,
        borderStyle,
        stripDecoration,
        liveCaptureEnabled,
        livePhotoEnabled,
        includeAudio,
        sessionVideo,
      })
      await saveSessionSnapshot(serialized)
      await clearActiveDraft().catch(() => {})
      setIsDirty(false)
      await refreshStoredSessions()
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed. Your current session has been preserved.'
      setProtectionSaveError(msg)
      return false
    }
  }

  const handleSessionSaved = useCallback(async () => {
    setIsDirty(false)
    try {
      const serialized = await serializeSessionForStorage({
        id: `snap_${Date.now()}`,
        step: 'export',
        poseCount,
        countdown,
        filter,
        layout,
        caption,
        showDate,
        photos,
        photoTransforms,
        stickers,
        stripTheme,
        customStripColor,
        borderStyle,
        stripDecoration,
        liveCaptureEnabled,
        livePhotoEnabled,
        includeAudio,
        sessionVideo,
      })
      await saveSessionSnapshot(serialized)
      await clearActiveDraft().catch(() => {})
      await refreshStoredSessions()
    } catch {
      // Download already succeeded; snapshot storage failure is non-fatal
    }
  }, [
    poseCount,
    countdown,
    filter,
    layout,
    caption,
    showDate,
    photos,
    photoTransforms,
    stickers,
    stripTheme,
    customStripColor,
    borderStyle,
    stripDecoration,
    liveCaptureEnabled,
    livePhotoEnabled,
    includeAudio,
    sessionVideo,
    refreshStoredSessions,
  ])

  const restoreFromRecord = useCallback(
    (record: PersistedSessionRecord, markAsDirty: boolean) => {
      clearRecordedMedia()
      const hydrated = hydrateStoredSession(record)
      setPoseCount(hydrated.poseCount)
      setCountdown(hydrated.countdown)
      setFilter(hydrated.filter)
      setLayout(hydrated.layout)
      setCaption(hydrated.caption)
      setShowDate(hydrated.showDate)
      setPhotos(hydrated.photos)
      setPhotoTransforms(
        hydrated.photoTransforms.length === hydrated.photos.length
          ? hydrated.photoTransforms
          : hydrated.photos.map(() => ({ ...DEFAULT_PHOTO_TRANSFORM }))
      )
      setStickers(hydrated.stickers)
      setStripTheme(hydrated.stripTheme)
      setCustomStripColor(hydrated.customStripColor)
      setBorderStyle(hydrated.borderStyle)
      setStripDecoration(hydrated.stripDecoration)
      setLiveCaptureEnabled(hydrated.liveCaptureEnabled)
      setLivePhotoEnabled(hydrated.livePhotoEnabled)
      setIncludeAudio(hydrated.includeAudio)
      setSessionVideo(hydrated.sessionVideo)
      setIsDirty(markAsDirty)
      setStep(hydrated.step)
    },
    [clearRecordedMedia]
  )

  const handleRequestNewSession = useCallback(() => {
    if (hasUnsavedWork) {
      setProtectionSaveError(null)
      setProtectionModal('new_session')
    } else {
      resetToNewSession()
    }
  }, [hasUnsavedWork, resetToNewSession])

  const handleProtectionSaveAndProceed = async () => {
    if (isProtectionSaving) return
    setProtectionSaveError(null)
    setIsProtectionSaving(true)
    const ok = await performVerifiedSave()
    setIsProtectionSaving(false)
    if (!ok) return

    const mode = protectionModal
    setProtectionModal(null)
    if (mode === 'new_session') {
      resetToNewSession()
    } else if (mode === 'refresh') {
      skipBeforeUnloadRef.current = true
      await new Promise((r) => setTimeout(r, 450))
      window.location.reload()
    }
  }

  const handleProtectionDiscardAndProceed = async () => {
    const mode = protectionModal
    setProtectionModal(null)
    setProtectionSaveError(null)
    if (mode === 'new_session') {
      resetToNewSession()
    } else if (mode === 'refresh') {
      await clearActiveDraft().catch(() => {})
      skipBeforeUnloadRef.current = true
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden film-grain select-none" style={{ background: 'var(--cream)' }}>
      <Nav
        insideBooth={insideBooth}
        onLeaveConfirm={() => {
          resetToNewSession()
        }}
      />

      <main className="pt-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-8 sm:pt-8 sm:pb-10">

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
              liveCaptureEnabled={liveCaptureEnabled}
              livePhotoEnabled={livePhotoEnabled}
              includeAudio={includeAudio}
              recoverableDraft={recoverableDraft}
              savedSessions={savedSessions}
              onRestoreDraft={() => {
                if (recoverableDraft) restoreFromRecord(recoverableDraft, true)
              }}
              onDiscardDraft={() => {
                clearActiveDraft().catch(() => {})
                setRecoverableDraft(null)
              }}
              onRestoreSavedSession={(record) => restoreFromRecord(record, false)}
              onDeleteSavedSession={(id) => {
                deleteSavedSession(id).then(() => refreshStoredSessions()).catch(() => {})
              }}
              onPoseChange={handlePoseChange}
              onLayoutChange={setLayout}
              onCountdownChange={setCountdown}
              onLiveCaptureToggle={() => setLiveCaptureEnabled((v) => !v)}
              onLivePhotoToggle={() => setLivePhotoEnabled((v) => !v)}
              onAudioToggle={() => setIncludeAudio((a) => !a)}
              onStart={() => setShowPrivacy(true)}
            />
          )}

          {step === 'camera' && (
            <div className="animate-fade-in-up">
              <CameraBooth
                filter={filter}
                poseCount={poseCount}
                countdownSeconds={countdown}
                liveCaptureEnabled={liveCaptureEnabled}
                livePhotoEnabled={livePhotoEnabled}
                includeAudio={includeAudio}
                onLiveCaptureToggle={() => setLiveCaptureEnabled((v) => !v)}
                onLivePhotoToggle={() => setLivePhotoEnabled((v) => !v)}
                onAudioToggle={() => setIncludeAudio((a) => !a)}
                onFilterChange={setFilter}
                onPhotosCapture={handlePhotosCapture}
                onHasUnsavedShotsChange={setHasUnsavedCameraShots}
                onCancel={() => {
                  clearRecordedMedia()
                  setHasUnsavedCameraShots(false)
                  setStep('setup')
                }}
              />
            </div>
          )}

          {step === 'customize' && photos.length > 0 && (
            <CustomizeStep
              photos={photos}
              livePhotos={sessionVideo?.livePhotos}
              photoTransforms={photoTransforms}
              filter={filter}
              layout={layout}
              poseCount={poseCount}
              caption={caption}
              showDate={showDate}
              stickers={stickers}
              stripTheme={stripTheme}
              customStripColor={customStripColor}
              borderStyle={borderStyle}
              stripDecoration={stripDecoration}
              onTransformChange={handleTransformChange}
              onResetTransforms={handleResetTransforms}
              onFilterChange={(f) => { setFilter(f); markDirtyIfSession() }}
              onLayoutChange={(l) => { setLayout(l); markDirtyIfSession() }}
              onCaptionChange={(c) => { setCaption(c); markDirtyIfSession() }}
              onDateToggle={() => { setShowDate((d) => !d); markDirtyIfSession() }}
              onStickersChange={(next) => { setStickers(next); markDirtyIfSession() }}
              onThemeChange={(id) => { setStripTheme(id); markDirtyIfSession() }}
              onCustomColorChange={(hex) => { setCustomStripColor(hex); markDirtyIfSession() }}
              onBorderChange={(style) => { setBorderStyle(style); markDirtyIfSession() }}
              onDecorationChange={(dec) => { setStripDecoration(dec); markDirtyIfSession() }}
              onBack={() => {
                clearRecordedMedia()
                setIsDirty(false)
                setStep('camera')
              }}
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
                sessionVideo={sessionVideo}
                onRetake={resetToNewSession}
                onRequestNewSession={handleRequestNewSession}
                onSessionSaved={handleSessionSaved}
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
              ✦ Jelly's Photobooth
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

      {/* Session protection modal (refresh & new session) */}
      {protectionModal && (
        <SessionProtectionModal
          mode={protectionModal}
          isSaving={isProtectionSaving}
          saveError={protectionSaveError}
          onSaveAndProceed={handleProtectionSaveAndProceed}
          onDiscardAndProceed={handleProtectionDiscardAndProceed}
          onCancel={() => {
            if (!isProtectionSaving) {
              setProtectionModal(null)
              setProtectionSaveError(null)
            }
          }}
        />
      )}
    </div>
  )
}