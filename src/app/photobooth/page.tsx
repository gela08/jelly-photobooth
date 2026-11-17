'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import PrivacyModal from '@/components/PrivacyModal'
import CameraBooth from '@/components/CameraBooth'
import LayoutSelector from '@/components/LayoutSelector'
import FilterSelector from '@/components/FilterSelector'
import StripDesignSelector from '@/components/StripDesignSelector'
import PhotoFrameEditor from '@/components/PhotoFrameEditor'
import StickerEditor from '@/components/StickerEditor'
import ExportPanel from '@/components/ExportPanel'
import { generatePhotoboothCanvas } from '@/lib/canvasExport'
import {
  COUNTDOWN_OPTIONS,
  CountdownSeconds,
  DEFAULT_PHOTO_TRANSFORM,
  FILTERS,
  FilterType,
  LayoutType,
  POSE_COUNT_OPTIONS,
  PhotoSession,
  PhotoTransform,
  PlacedSticker,
  PoseCount,
  SessionVideoData,
  StripBorderStyle,
  StripDecoration,
  StripThemeId,
  getDefaultLayout,
} from '@/lib/types'

type BoothStep = 'setup' | 'camera' | 'customize' | 'export'
type CustomizeTab = 'looks' | 'framing' | 'stickers'

export default function PhotoboothPage() {
  const router = useRouter()

  const [step, setStep] = useState<BoothStep>('setup')
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  // Session setup state
  const [poseCount, setPoseCount] = useState<PoseCount>(4)
  const [countdownSeconds, setCountdownSeconds] = useState<CountdownSeconds>(3)
  const [layout, setLayout] = useState<LayoutType>(() => getDefaultLayout(4))
  const [filter, setFilter] = useState<FilterType>('none')
  const [liveCaptureEnabled, setLiveCaptureEnabled] = useState(true)
  const [includeAudio, setIncludeAudio] = useState(false)

  // Captured media state
  const [photos, setPhotos] = useState<string[]>([])
  const [photoTransforms, setPhotoTransforms] = useState<PhotoTransform[]>(() =>
    Array.from({ length: 4 }, () => ({ ...DEFAULT_PHOTO_TRANSFORM }))
  )
  const [sessionVideo, setSessionVideo] = useState<SessionVideoData | undefined>(undefined)

  // Customization state
  const [customTab, setCustomTab] = useState<CustomizeTab>('looks')
  const [caption, setCaption] = useState('')
  const [showDate, setShowDate] = useState(true)
  const [stripTheme, setStripTheme] = useState<StripThemeId>('auto')
  const [customStripColor, setCustomStripColor] = useState('#e8d5c4')
  const [borderStyle, setBorderStyle] = useState<StripBorderStyle>('classic')
  const [stripDecoration, setStripDecoration] = useState<StripDecoration>('none')
  const [stickers, setStickers] = useState<PlacedSticker[]>([])

  // Live preview & lightbox
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [enlargePhoto, setEnlargePhoto] = useState<string | null>(null)
  const previewJobRef = useRef(0)

  const handlePoseCountChange = (count: PoseCount) => {
    setPoseCount(count)
    setLayout(getDefaultLayout(count))
    setPhotoTransforms(Array.from({ length: count }, () => ({ ...DEFAULT_PHOTO_TRANSFORM })))
  }

  const session: PhotoSession = useMemo(
    () => ({
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
    }),
    [
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
      sessionVideo?.liveFramesPerPose,
    ]
  )

  useEffect(() => {
    if (step !== 'customize' || photos.length === 0) return
    const jobId = ++previewJobRef.current
    setIsGeneratingPreview(true)
    const timer = window.setTimeout(async () => {
      try {
        const canvas = await generatePhotoboothCanvas(session)
        if (previewJobRef.current === jobId) {
          setPreviewUrl(canvas.toDataURL('image/png'))
        }
      } catch (err) {
        console.error('Preview render failed:', err)
      } finally {
        if (previewJobRef.current === jobId) {
          setIsGeneratingPreview(false)
        }
      }
    }, 60)

    return () => window.clearTimeout(timer)
  }, [step, photos.length, session])

  const cleanupVideoUrl = useCallback(() => {
    if (sessionVideo?.videoUrl) {
      URL.revokeObjectURL(sessionVideo.videoUrl)
    }
  }, [sessionVideo])

  const handleResetSession = useCallback(() => {
    cleanupVideoUrl()
    setPhotos([])
    setPhotoTransforms(Array.from({ length: poseCount }, () => ({ ...DEFAULT_PHOTO_TRANSFORM })))
    setSessionVideo(undefined)
    setPreviewUrl(null)
    setStickers([])
    setCustomTab('looks')
    setStep('setup')
  }, [cleanupVideoUrl, poseCount])

  const handleEnterBooth = () => {
    if (privacyAccepted) {
      setStep('camera')
    } else {
      setShowPrivacyModal(true)
    }
  }

  const handlePhotosCapture = (captured: string[], videoData?: SessionVideoData) => {
    setPhotos(captured)
    setPhotoTransforms(Array.from({ length: captured.length }, () => ({ ...DEFAULT_PHOTO_TRANSFORM })))
    setSessionVideo(videoData)
    setCustomTab('looks')
    setStep('customize')
  }

  return (
    <div className="min-h-screen overflow-x-hidden film-grain select-none" style={{ background: 'var(--cream)' }}>
      <Nav insideBooth={step !== 'setup'} onLeaveConfirm={handleResetSession} />

      {showPrivacyModal && (
        <PrivacyModal
          onAccept={() => {
            setPrivacyAccepted(true)
            setShowPrivacyModal(false)
            setStep('camera')
          }}
          onDecline={() => {
            setShowPrivacyModal(false)
            router.push('/')
          }}
        />
      )}

      {enlargePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(14,11,8,0.9)', backdropFilter: 'blur(6px)' }}
          onClick={() => setEnlargePhoto(null)}
        >
          <div className="animate-scale-in relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={enlargePhoto}
              alt="Enlarged pose"
              className="rounded-sm"
              style={{
                maxWidth: 'min(90vw, 560px)',
                maxHeight: 'min(80vh, 640px)',
                objectFit: 'contain',
                border: '5px solid white',
                filter: FILTERS.find((f) => f.id === filter)?.cssFilter ?? 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setEnlargePhoto(null)}
              className="mt-3 mx-auto block font-display text-xs tracking-widest uppercase px-4 py-2 rounded-sm"
              style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <main className="pt-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
            {(
              [
                { id: 'setup', label: '1. Setup' },
                { id: 'camera', label: '2. Shoot' },
                { id: 'customize', label: '3. Customize' },
                { id: 'export', label: '4. Print' },
              ] as { id: BoothStep; label: string }[]
            ).map((item) => {
              const active = step === item.id
              return (
                <span
                  key={item.id}
                  className="font-display text-[10px] sm:text-xs tracking-widest uppercase px-2.5 py-1 rounded-sm transition-all"
                  style={
                    active
                      ? { background: 'var(--vintage-brown)', color: 'var(--cream)' }
                      : { color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--surface)' }
                  }
                >
                  {item.label}
                </span>
              )
            })}
          </div>

          {/* STEP 1: SETUP */}
          {step === 'setup' && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
              <div className="text-center space-y-2">
                <p className="font-display text-xs tracking-[0.35em] uppercase" style={{ color: 'var(--sepia)' }}>
                  100% Private · Browser-Local
                </p>
                <h1 className="font-display text-3xl sm:text-4xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
                  Solo Photobooth Studio
                </h1>
                <p className="font-body text-sm sm:text-base" style={{ color: 'var(--warm-gray)' }}>
                  Choose your pose count, countdown timer, and strip layout before stepping into the booth.
                </p>
              </div>

              {/* Pose Count & Countdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="section-card space-y-3">
                  <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                    Number of Poses
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {POSE_COUNT_OPTIONS.map((count) => {
                      const active = poseCount === count
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => handlePoseCountChange(count)}
                          className="py-3 rounded-sm font-display text-sm font-bold transition-all active:scale-95"
                          style={
                            active
                              ? { background: 'var(--vintage-brown)', color: 'var(--cream)' }
                              : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                          }
                        >
                          {count}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="section-card space-y-3">
                  <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                    Countdown Timer
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {COUNTDOWN_OPTIONS.map((sec) => {
                      const active = countdownSeconds === sec
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setCountdownSeconds(sec)}
                          className="py-3 rounded-sm font-display text-sm font-bold transition-all active:scale-95"
                          style={
                            active
                              ? { background: 'var(--vintage-brown)', color: 'var(--cream)' }
                              : { background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }
                          }
                        >
                          {sec}s
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Layout Selection */}
              <div className="section-card">
                <LayoutSelector selected={layout} poseCount={poseCount} onSelect={setLayout} />
              </div>

              {/* Live Motion Toggle */}
              <div className="section-card flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--vintage-brown)' }}>
                    Live Motion &amp; Session Video
                  </p>
                  <p className="font-body text-xs mt-0.5" style={{ color: 'var(--warm-gray)' }}>
                    Record short burst motion for an animated Live Strip GIF plus a downloadable session clip.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {liveCaptureEnabled && (
                    <button
                      type="button"
                      onClick={() => setIncludeAudio((v) => !v)}
                      className="px-3 py-1.5 rounded-sm font-display text-[10px] tracking-widest uppercase transition-all"
                      style={{
                        border: '1px solid var(--border)',
                        background: includeAudio ? 'rgba(92,61,30,0.12)' : 'var(--surface-2)',
                        color: includeAudio ? 'var(--vintage-brown)' : 'var(--text-muted)',
                      }}
                    >
                      {includeAudio ? 'Mic On' : 'Mic Off'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setLiveCaptureEnabled((v) => !v)}
                    className={`toggle-track ${liveCaptureEnabled ? 'on' : ''}`}
                    aria-label="Toggle Live Motion and Video"
                  >
                    <div className="toggle-thumb" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEnterBooth}
                className="w-full font-display text-sm tracking-widest uppercase py-4 rounded-sm shadow-lg transition-all active:scale-95"
                style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
              >
                Enter Photobooth →
              </button>
            </div>
          )}

          {/* STEP 2: CAMERA */}
          {step === 'camera' && (
            <div className="animate-fade-in-up">
              <CameraBooth
                filter={filter}
                poseCount={poseCount}
                countdownSeconds={countdownSeconds}
                liveCaptureEnabled={liveCaptureEnabled}
                includeAudio={includeAudio}
                onLiveCaptureToggle={() => setLiveCaptureEnabled((v) => !v)}
                onAudioToggle={() => setIncludeAudio((v) => !v)}
                onFilterChange={setFilter}
                onPhotosCapture={handlePhotosCapture}
                onCancel={() => setStep('setup')}
              />
            </div>
          )}

          {/* STEP 3: CUSTOMIZE */}
          {step === 'customize' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
                    Customize Your Strip
                  </h2>
                  <p className="font-body text-sm" style={{ color: 'var(--warm-gray)' }}>
                    Fine-tune framing, film filter, strip color, stickers, and caption.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      cleanupVideoUrl()
                      setSessionVideo(undefined)
                      setPhotos([])
                      setStep('camera')
                    }}
                    className="px-4 py-2.5 rounded-sm font-display text-[11px] tracking-widest uppercase transition-all active:scale-95"
                    style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}
                  >
                    Retake
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('export')}
                    className="px-5 py-2.5 rounded-sm font-display text-[11px] tracking-widest uppercase transition-all active:scale-95 shadow-md"
                    style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                  >
                    Print &amp; Save Strip →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left controls */}
                <div className="lg:col-span-7 space-y-5">
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'looks', label: 'Looks & Layout' },
                        { id: 'framing', label: 'Crop & Zoom' },
                        { id: 'stickers', label: 'Stickers' },
                      ] as { id: CustomizeTab; label: string }[]
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
                      <div className="section-card">
                        <LayoutSelector selected={layout} poseCount={poseCount} onSelect={setLayout} />
                      </div>

                      <div className="section-card">
                        <FilterSelector
                          selected={filter}
                          previewPhoto={photos[0]}
                          onSelect={setFilter}
                        />
                      </div>

                      <div className="section-card">
                        <StripDesignSelector
                          stripTheme={stripTheme}
                          customStripColor={customStripColor}
                          borderStyle={borderStyle}
                          stripDecoration={stripDecoration}
                          onThemeChange={setStripTheme}
                          onCustomColorChange={setCustomStripColor}
                          onBorderChange={setBorderStyle}
                          onDecorationChange={setStripDecoration}
                        />
                      </div>

                      <div className="section-card space-y-3">
                        <label className="block font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                          Strip Caption
                        </label>
                        <input
                          type="text"
                          maxLength={80}
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
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
                            onClick={() => setShowDate((v) => !v)}
                            className={`toggle-track ${showDate ? 'on' : ''}`}
                            aria-label="Toggle date stamp"
                          >
                            <div className="toggle-thumb" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {customTab === 'framing' && (
                    <div className="section-card">
                      <PhotoFrameEditor
                        photos={photos}
                        transforms={photoTransforms}
                        layout={layout}
                        poseCount={poseCount}
                        filter={filter}
                        onChange={(idx, next) => {
                          setPhotoTransforms((prev) => {
                            const copy = [...prev]
                            copy[idx] = next
                            return copy
                          })
                        }}
                        onResetAll={() =>
                          setPhotoTransforms(Array.from({ length: poseCount }, () => ({ ...DEFAULT_PHOTO_TRANSFORM })))
                        }
                        onEnlarge={(idx) => {
                          if (photos[idx]) setEnlargePhoto(photos[idx])
                        }}
                      />
                    </div>
                  )}

                  {customTab === 'stickers' && (
                    <div className="section-card">
                      <StickerEditor
                        session={session}
                        stickers={stickers}
                        onChange={setStickers}
                      />
                    </div>
                  )}
                </div>

                {/* Right live preview */}
                <div className="lg:col-span-5 section-card flex flex-col items-center space-y-3 lg:sticky lg:top-20">
                  <div className="w-full flex items-center justify-between">
                    <span className="font-display text-[11px] tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
                      Live Strip Preview
                    </span>
                    <span className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
                      {FILTERS.find((f) => f.id === filter)?.label || 'Original'}
                    </span>
                  </div>

                  <div
                    className="w-full min-h-[360px] flex items-center justify-center rounded-sm p-4"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Photobooth strip preview"
                        className="max-w-full max-h-[540px] object-contain shadow-lg"
                      />
                    ) : (
                      <div className="text-center space-y-2 py-12">
                        <div
                          className="w-7 h-7 mx-auto rounded-full border-2 border-t-transparent animate-spin"
                          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--vintage-brown)' }}
                        />
                        <p className="font-display text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                          Developing Strip…
                        </p>
                      </div>
                    )}
                  </div>

                  {isGeneratingPreview && previewUrl && (
                    <p className="font-body text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Updating strip…
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: EXPORT */}
          {step === 'export' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep('customize')}
                  className="px-4 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase"
                  style={{ border: '1px solid var(--border)', color: 'var(--vintage-brown)', background: 'var(--surface)' }}
                >
                  ← Back to Edit
                </button>
              </div>
              <ExportPanel
                session={session}
                sessionVideo={sessionVideo}
                onRetake={handleResetSession}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
