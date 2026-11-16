'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type PrinterStage = 'developing' | 'preparing' | 'printing' | 'complete'

export interface BoothPrinterAnimationProps {
  stripUrl: string | null
  isGenerating?: boolean
  autoPlay?: boolean
  stripAlt?: string
  machineLabel?: string
  onComplete?: () => void
}

function VolumeOnIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function VolumeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
}

function SkipIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  )
}

function ReplayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  )
}

function ZoomIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function BoothPrinterAnimation({
  stripUrl,
  isGenerating = false,
  autoPlay = true,
  stripAlt = 'Your printed photobooth strip',
  machineLabel = "Jelly's Photo Dispenser",
  onComplete,
}: BoothPrinterAnimationProps) {
  const [stage, setStage] = useState<PrinterStage>('developing')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [playSeed, setPlaySeed] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [zoomOpen, setZoomOpen] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const feedStopRef = useRef<(() => void) | null>(null)
  const timersRef = useRef<number[]>([])
  const soundEnabledRef = useRef(soundEnabled)
  soundEnabledRef.current = soundEnabled
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const clearAllTimers = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id)
    }
    timersRef.current = []
  }, [])

  const stopFeedSound = useCallback(() => {
    if (feedStopRef.current) {
      try {
        feedStopRef.current()
      } catch {
        // ignore audio cleanup error
      }
      feedStopRef.current = null
    }
  }, [])

  const getAudioCtx = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined' || !soundEnabledRef.current) return null
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return null
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx()
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {})
      }
      return audioCtxRef.current
    } catch {
      return null
    }
  }, [])

  const playPrepSound = useCallback(() => {
    const ctx = getAudioCtx()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(520, now)
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.08)
      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.035, now + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.15)
    } catch {
      // ignore audio restrictions
    }
  }, [getAudioCtx])

  const startFeedSound = useCallback(() => {
    stopFeedSound()
    const ctx = getAudioCtx()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      // Gentle mechanical roller hum with soft cadence
      const osc = ctx.createOscillator()
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      const masterGain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(78, now)

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(240, now)

      lfo.type = 'sine'
      lfo.frequency.setValueAtTime(5.5, now)
      lfoGain.gain.setValueAtTime(0.01, now)
      lfoGain.connect(masterGain.gain)

      masterGain.gain.setValueAtTime(0.018, now)

      osc.connect(filter)
      filter.connect(masterGain)
      masterGain.connect(ctx.destination)

      osc.start(now)
      lfo.start(now)

      feedStopRef.current = () => {
        try {
          const t = ctx.currentTime
          masterGain.gain.cancelScheduledValues(t)
          masterGain.gain.setTargetAtTime(0.0001, t, 0.03)
          osc.stop(t + 0.08)
          lfo.stop(t + 0.08)
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore audio errors
    }
  }, [getAudioCtx, stopFeedSound])

  const playCompleteChime = useCallback(() => {
    const ctx = getAudioCtx()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const notes = [587.33, 880] // D5 -> A5 warm vintage chime
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + i * 0.09)
        gain.gain.setValueAtTime(0.0001, now + i * 0.09)
        gain.gain.linearRampToValueAtTime(0.035, now + i * 0.09 + 0.015)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.28)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.09)
        osc.stop(now + i * 0.09 + 0.3)
      })
    } catch {
      // ignore
    }
  }, [getAudioCtx])

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  // Stop active motor audio immediately if muted mid-print
  useEffect(() => {
    if (!soundEnabled) {
      stopFeedSound()
    }
  }, [soundEnabled, stopFeedSound])

  // Orchestrate the virtual printing sequence
  useEffect(() => {
    clearAllTimers()
    stopFeedSound()

    if (isGenerating || !stripUrl) {
      setStage('developing')
      return
    }

    if (reducedMotion || !autoPlay) {
      setStage('complete')
      onCompleteRef.current?.()
      return
    }

    setStage('preparing')
    playPrepSound()

    const t1 = window.setTimeout(() => {
      setStage('printing')
      startFeedSound()
    }, 620)

    const t2 = window.setTimeout(() => {
      stopFeedSound()
      setStage('complete')
      playCompleteChime()
      onCompleteRef.current?.()
    }, 620 + 2850)

    timersRef.current = [t1, t2]

    return () => {
      clearAllTimers()
      stopFeedSound()
    }
  }, [
    stripUrl,
    isGenerating,
    autoPlay,
    reducedMotion,
    playSeed,
    clearAllTimers,
    stopFeedSound,
    playPrepSound,
    startFeedSound,
    playCompleteChime,
  ])

  useEffect(() => {
    return () => {
      stopFeedSound()
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {})
      }
    }
  }, [stopFeedSound])

  const handleSkip = () => {
    clearAllTimers()
    stopFeedSound()
    setStage('complete')
    onCompleteRef.current?.()
  }

  const handleReplay = () => {
    if (isGenerating || !stripUrl) return
    setPlaySeed((s) => s + 1)
  }

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev)
  }

  const stageLabel =
    stage === 'developing'
      ? 'Developing film…'
      : stage === 'preparing'
      ? 'Warming up printer…'
      : stage === 'printing'
      ? 'Printing photo strip…'
      : 'Print ready'

  const isAnimating = stage === 'developing' || stage === 'preparing' || stage === 'printing'

  return (
    <div className="w-full max-w-xl mx-auto select-none">
      {/* Zoom Inspection Lightbox */}
      {zoomOpen && stripUrl && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(10,8,6,0.92)', backdropFilter: 'blur(8px)' }}
          onClick={() => setZoomOpen(false)}
        >
          <div className="relative animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <img
              src={stripUrl}
              alt={stripAlt}
              referrerPolicy="no-referrer"
              className="max-w-[92vw] max-h-[85vh] object-contain shadow-2xl"
              style={{ border: '1px solid rgba(255,255,255,0.2)' }}
            />
            <button
              type="button"
              onClick={() => setZoomOpen(false)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
              style={{ background: 'var(--vintage-brown)', color: 'white' }}
              aria-label="Close enlarged strip"
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}

      {/* Virtual Physical Photobooth Dispenser Machine */}
      <div
        className={`relative rounded-sm transition-transform ${
          stage === 'printing' ? 'printer-hum' : ''
        }`}
        style={{
          background: 'var(--parchment)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 30px var(--shadow-color), inset 0 1px 0 rgba(255,255,255,0.22)',
        }}
      >
        {/* Top Bezel / Brand Plate & Controls */}
        <div
          className="px-4 py-3 flex flex-wrap items-center justify-between gap-2"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors duration-300"
              aria-hidden="true"
              style={{
                background:
                  stage === 'preparing'
                    ? '#e29d34'
                    : stage === 'printing'
                    ? '#d96b27'
                    : stage === 'developing'
                    ? '#8b6914'
                    : '#4b8352',
                boxShadow:
                  stage === 'preparing' || stage === 'printing'
                    ? '0 0 8px rgba(226, 157, 52, 0.7)'
                    : 'none',
              }}
            />
            <div className="min-w-0">
              <p
                className="font-display text-xs font-bold tracking-wider uppercase truncate"
                style={{ color: 'var(--vintage-brown)' }}
              >
                {machineLabel}
              </p>
              <p className="font-body text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                {stageLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm font-display text-[10px] tracking-widest uppercase whitespace-nowrap shrink-0 transition-all active:scale-95"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: soundEnabled ? 'var(--vintage-brown)' : 'var(--text-muted)',
              }}
              aria-label={soundEnabled ? 'Mute printer sound' : 'Unmute printer sound'}
              title={soundEnabled ? 'Sound On' : 'Muted'}
            >
              {soundEnabled ? <VolumeOnIcon /> : <VolumeOffIcon />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sound' : 'Muted'}</span>
            </button>

            {/* Skip or Replay */}
            {isAnimating && stripUrl && !reducedMotion && (
              <button
                type="button"
                onClick={handleSkip}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm font-display text-[10px] tracking-widest uppercase whitespace-nowrap shrink-0 transition-all active:scale-95"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-secondary)',
                }}
              >
                <SkipIcon />
                Skip
              </button>
            )}

            {stage === 'complete' && stripUrl && (
              <>
                <button
                  type="button"
                  onClick={() => setZoomOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm font-display text-[10px] tracking-widest uppercase whitespace-nowrap shrink-0 transition-all active:scale-95"
                  style={{
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <ZoomIcon />
                  <span className="hidden sm:inline">Inspect</span>
                </button>
                {!reducedMotion && (
                  <button
                    type="button"
                    onClick={handleReplay}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm font-display text-[10px] tracking-widest uppercase whitespace-nowrap shrink-0 transition-all active:scale-95"
                    style={{
                      background: 'var(--vintage-brown)',
                      color: 'var(--cream)',
                    }}
                  >
                    <ReplayIcon />
                    Replay
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Recessed Dispenser Slot Assembly */}
        <div className="px-4 sm:px-8 pt-4 pb-3">
          <div
            className="relative h-6 rounded-sm flex items-center justify-center overflow-hidden"
            style={{
              background: '#17120e',
              border: '1px solid rgba(0,0,0,0.45)',
              boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            {/* Subtle warm printer prep flash inside slot */}
            {stage === 'preparing' && (
              <div
                className="absolute inset-0 pointer-events-none printer-prep-flash"
                style={{
                  background:
                    'radial-gradient(circle at center, rgba(255,232,175,0.85) 0%, rgba(255,196,95,0.15) 65%, transparent 100%)',
                }}
              />
            )}

            {/* Inner slot opening */}
            <div
              className="w-[88%] h-2 rounded-full"
              style={{
                background: '#080604',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.95)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Output Paper Chute directly under the slot */}
      <div className="relative -mt-3 px-4 sm:px-8 flex justify-center">
        <div className="relative w-full overflow-hidden pt-1 pb-4 flex justify-center">
          {/* Top slot cast shadow over emerging strip */}
          <div
            className="absolute top-0 left-4 right-4 sm:left-8 sm:right-8 h-5 pointer-events-none z-10"
            style={{
              background:
                'linear-gradient(to bottom, rgba(16,12,8,0.42) 0%, rgba(16,12,8,0.12) 45%, transparent 100%)',
            }}
          />

          {/* Developing state before strip image exists */}
          {(stage === 'developing' || !stripUrl) && (
            <div
              className="w-60 sm:w-64 h-64 flex flex-col items-center justify-center rounded-b-sm animate-fade-in"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                boxShadow: '0 8px 24px var(--shadow-color)',
              }}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mb-3"
                style={{ borderColor: 'var(--border)', borderTopColor: 'var(--vintage-brown)' }}
              />
              <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--vintage-brown)' }}>
                Developing Film
              </p>
              <p className="font-body text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Preparing your prints…
              </p>
            </div>
          )}

          {/* Preparing state (hidden strip tucked inside slot waiting for motor feed) */}
          {stripUrl && stage === 'preparing' && (
            <div className="w-full flex justify-center min-h-[140px]">
              <img
                src={stripUrl}
                alt={stripAlt}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[58vh] w-auto object-contain opacity-0"
                style={{ transform: 'translateY(-102%)' }}
              />
            </div>
          )}

          {/* Printing / Complete state: actual photo strip sliding downward out of slot */}
          {stripUrl && (stage === 'printing' || stage === 'complete') && (
            <div
              key={playSeed}
              className={`relative transition-shadow duration-500 ${
                stage === 'printing' ? 'strip-emerge' : ''
              }`}
              style={{
                boxShadow:
                  stage === 'complete'
                    ? '0 16px 36px rgba(20, 14, 8, 0.28), 0 2px 8px rgba(20, 14, 8, 0.14)'
                    : '0 8px 20px rgba(20, 14, 8, 0.2)',
              }}
            >
              <img
                src={stripUrl}
                alt={stripAlt}
                referrerPolicy="no-referrer"
                onClick={() => {
                  if (stage === 'complete') setZoomOpen(true)
                }}
                className={`block max-w-full max-h-[58vh] w-auto object-contain ${
                  stage === 'complete' ? 'cursor-zoom-in' : ''
                }`}
                style={{
                  border: '1px solid var(--border)',
                  background: '#ffffff',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
