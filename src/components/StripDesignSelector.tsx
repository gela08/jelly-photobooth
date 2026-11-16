'use client'

import {
  StripBorderStyle,
  StripDecoration,
  StripThemeId,
} from '@/lib/types'
import {
  STRIP_BORDERS,
  STRIP_DECORATIONS,
  STRIP_THEMES,
} from '@/lib/stripDesigns'

interface StripDesignSelectorProps {
  stripTheme: StripThemeId
  customStripColor?: string
  borderStyle: StripBorderStyle
  stripDecoration: StripDecoration
  onThemeChange: (id: StripThemeId) => void
  onCustomColorChange?: (hex: string) => void
  onBorderChange: (style: StripBorderStyle) => void
  onDecorationChange: (dec: StripDecoration) => void
}

function BorderPreviewIcon({ style }: { style: StripBorderStyle }) {
  if (style === 'none') {
    return (
      <div
        className="w-6 h-5 rounded-none"
        style={{ background: 'var(--vintage-pink)', opacity: 0.7 }}
      />
    )
  }
  if (style === 'rounded') {
    return (
      <div
        className="w-6 h-5 rounded-md border-2"
        style={{
          background: 'var(--vintage-pink)',
          borderColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      />
    )
  }
  if (style === 'dashed') {
    return (
      <div
        className="w-6 h-5 border-2 border-dashed"
        style={{
          background: 'var(--vintage-pink)',
          borderColor: 'var(--vintage-brown)',
        }}
      />
    )
  }
  return (
    <div
      className="w-6 h-5 border-2"
      style={{
        background: 'var(--vintage-pink)',
        borderColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}
    />
  )
}

function DecorationIcon({ id }: { id: StripDecoration }) {
  switch (id) {
    case 'corners':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="4 9 4 4 9 4" />
          <polyline points="15 4 20 4 20 9" />
          <polyline points="4 15 4 20 9 20" />
          <polyline points="15 20 20 20 20 15" />
        </svg>
      )
    case 'stars':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6" />
        </svg>
      )
    case 'hearts':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )
    case 'sparkles':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L14 9L21 11L14 13L12 20L10 13L3 11L10 9Z" />
        </svg>
      )
    default:
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      )
  }
}

export default function StripDesignSelector({
  stripTheme,
  customStripColor = '#e8d5c4',
  borderStyle,
  stripDecoration,
  onThemeChange,
  onCustomColorChange,
  onBorderChange,
  onDecorationChange,
}: StripDesignSelectorProps) {
  const activeLabel =
    stripTheme === 'custom'
      ? `Custom (${customStripColor.toUpperCase()})`
      : (STRIP_THEMES.find((t) => t.id === stripTheme)?.label ?? 'Layout Default')

  return (
    <div className="space-y-5 select-none">
      {/* Strip Background / Theme */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Strip Color &amp; Theme
          </p>
          <span className="font-body text-xs italic" style={{ color: 'var(--sepia)' }}>
            {activeLabel}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {STRIP_THEMES.map((t) => {
            const active = stripTheme === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onThemeChange(t.id)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-sm transition-all active:scale-95"
                style={{
                  border: `1.5px solid ${active ? 'var(--vintage-brown)' : 'var(--border)'}`,
                  background: active ? 'rgba(92,61,30,0.08)' : 'var(--surface)',
                }}
                title={t.description}
              >
                <div
                  className="w-full h-7 rounded-sm border"
                  style={{
                    background: t.swatchBg,
                    borderColor: 'rgba(92,61,30,0.22)',
                  }}
                />
                <span
                  className="font-display text-[10px] tracking-wide text-center leading-tight line-clamp-1"
                  style={{
                    color: active ? 'var(--vintage-brown)' : 'var(--text-secondary)',
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>

        {onCustomColorChange && (
          <div
            className="mt-3 flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 rounded-sm"
            style={{
              background: stripTheme === 'custom' ? 'rgba(92,61,30,0.07)' : 'var(--surface-3)',
              border: `1px solid ${stripTheme === 'custom' ? 'var(--vintage-brown)' : 'var(--border)'}`,
            }}
          >
            <div className="flex items-center gap-2.5">
              <label
                className="relative w-8 h-8 rounded-sm overflow-hidden cursor-pointer flex-shrink-0 border"
                style={{ background: customStripColor, borderColor: 'rgba(92,61,30,0.28)' }}
                title="Pick any custom background color"
              >
                <input
                  type="color"
                  value={customStripColor}
                  onChange={(e) => {
                    onCustomColorChange(e.target.value)
                    onThemeChange('custom')
                  }}
                  aria-label="Pick custom strip color"
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
              </label>
              <div>
                <p className="font-display text-[11px] tracking-wider uppercase" style={{ color: 'var(--vintage-brown)' }}>
                  Custom Strip Color
                </p>
                <p className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {customStripColor.toUpperCase()} · Auto contrast ink
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {['#f8d7da', '#d4edda', '#d1ecf1', '#e2d9f3', '#2d1e2f', '#1c2541'].map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => {
                    onCustomColorChange(hex)
                    onThemeChange('custom')
                  }}
                  aria-label={`Apply color ${hex}`}
                  className="w-6 h-6 rounded-sm border transition-transform active:scale-90"
                  style={{
                    background: hex,
                    borderColor:
                      stripTheme === 'custom' && customStripColor.toLowerCase() === hex
                        ? 'var(--vintage-brown)'
                        : 'rgba(92,61,30,0.28)',
                    boxShadow:
                      stripTheme === 'custom' && customStripColor.toLowerCase() === hex
                        ? '0 0 0 1.5px var(--vintage-brown)'
                        : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photo Frame Border */}
      <div>
        <p className="font-display text-xs tracking-widest uppercase mb-2.5" style={{ color: 'var(--text-muted)' }}>
          Frame Style
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STRIP_BORDERS.map((b) => {
            const active = borderStyle === b.id
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onBorderChange(b.id)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-sm transition-all active:scale-95"
                style={{
                  border: `1.5px solid ${active ? 'var(--vintage-brown)' : 'var(--border)'}`,
                  background: active ? 'rgba(92,61,30,0.08)' : 'var(--surface)',
                }}
              >
                <BorderPreviewIcon style={b.id} />
                <span
                  className="font-display text-[10px] tracking-wide uppercase"
                  style={{
                    color: active ? 'var(--vintage-brown)' : 'var(--text-secondary)',
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {b.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Accent Decorations */}
      <div>
        <p className="font-display text-xs tracking-widest uppercase mb-2.5" style={{ color: 'var(--text-muted)' }}>
          Corner Accents
        </p>
        <div className="flex flex-wrap gap-2">
          {STRIP_DECORATIONS.map((d) => {
            const active = stripDecoration === d.id
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onDecorationChange(d.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-sm transition-all active:scale-95"
                style={{
                  border: `1.5px solid ${active ? 'var(--vintage-brown)' : 'var(--border)'}`,
                  background: active ? 'var(--vintage-brown)' : 'var(--surface)',
                  color: active ? 'var(--cream)' : 'var(--text-secondary)',
                }}
              >
                <DecorationIcon id={d.id} />
                <span className="font-display text-[10px] tracking-wide uppercase">
                  {d.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
