'use client'; // This is the magic fix

import { LayoutType, LayoutConfig, PoseCount, getLayoutsForPoseCount } from '@/lib/types'

interface LayoutSelectorProps {
  selected: LayoutType
  poseCount: PoseCount
  onSelect: (layout: LayoutType) => void
}

// ── Orientation tag icon ──────────────────────────────────────────────────
function LandscapeTag() {
  return (
    <span
      className="inline-flex items-center gap-0.5 font-mono text-[9px] px-1 py-0.5 rounded-sm"
      style={{ background: 'rgba(92,61,30,0.1)', color: 'var(--text-muted)', letterSpacing: '0.04em' }}
    >
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 2h4v5" />
      </svg>
      L
    </span>
  )
}

function LayoutPreview({ id, poses }: { id: LayoutType; poses: number }) {
  const cell = { background: 'var(--vintage-brown)', opacity: 0.45, borderRadius: '1px' }
  const darkCell = { background: '#c4a882', opacity: 0.72, borderRadius: '0.5px' }
  const whiteFrame = {
    background: '#ffffff',
    border: '0.5px solid rgba(92,61,30,0.16)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
  }

  switch (id) {
    // ── Classic strip (portrait) ─────────────────────────────────────────
    case 'classic': {
      const h = poses === 6 ? 56 : poses === 4 ? 48 : poses === 3 ? 40 : 32
      return (
        <div
          className="flex flex-col rounded-[1px]"
          style={{
            width: '22px',
            height: `${h}px`,
            background: '#121010',
            padding: '4px 2.5px 5px',
            gap: '1.5px',
          }}
        >
          {Array.from({ length: poses }).map((_, i) => (
            <div key={i} className="flex-1 w-full" style={darkCell} />
          ))}
        </div>
      )
    }

    // ── Classic strip (landscape) ────────────────────────────────────────
    case 'classic_land': {
      const w = poses === 6 ? 76 : poses === 4 ? 64 : poses === 3 ? 52 : 40
      return (
        <div
          className="flex flex-row items-stretch rounded-[1px]"
          style={{
            width: `${w}px`,
            height: '26px',
            background: '#121010',
            padding: '4px 3px 5px',
            gap: '1.5px',
          }}
        >
          {Array.from({ length: poses }).map((_, i) => (
            <div key={i} className="flex-1 h-full" style={darkCell} />
          ))}
        </div>
      )
    }

    // ── Film strip (portrait) ────────────────────────────────────────────
    case 'filmstrip': {
      const h = poses === 6 ? 56 : poses === 4 ? 50 : poses === 3 ? 42 : 34
      const holeCount = poses === 6 ? 7 : poses === 4 ? 6 : 5
      return (
        <div
          className="flex overflow-hidden rounded-[1px]"
          style={{ width: '28px', height: `${h}px`, background: '#0e0b08' }}
        >
          <div className="flex flex-col justify-evenly items-center" style={{ width: '5px', padding: '1px 0' }}>
            {Array.from({ length: holeCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '2.5px',
                  height: '3.5px',
                  borderRadius: '0.5px',
                  background: 'rgba(255,255,255,0.16)',
                }}
              />
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-[1.5px] py-[4px]">
            {Array.from({ length: poses }).map((_, i) => (
              <div key={i} className="flex-1 w-full" style={{ background: 'rgba(196,168,130,0.52)', borderRadius: '0.5px' }} />
            ))}
          </div>
          <div className="flex flex-col justify-evenly items-center" style={{ width: '5px', padding: '1px 0' }}>
            {Array.from({ length: holeCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '2.5px',
                  height: '3.5px',
                  borderRadius: '0.5px',
                  background: 'rgba(255,255,255,0.16)',
                }}
              />
            ))}
          </div>
        </div>
      )
    }

    // ── Film strip (landscape) ───────────────────────────────────────────
    case 'filmstrip_land': {
      const w = poses === 6 ? 76 : poses === 4 ? 64 : poses === 3 ? 52 : 40
      const holeCount = poses === 6 ? 8 : poses === 4 ? 7 : 5
      return (
        <div
          className="flex flex-col overflow-hidden rounded-[1px]"
          style={{ width: `${w}px`, height: '28px', background: '#0e0b08' }}
        >
          <div className="flex justify-evenly items-center" style={{ height: '5px' }}>
            {Array.from({ length: holeCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '3.5px',
                  height: '2.5px',
                  borderRadius: '0.5px',
                  background: 'rgba(255,255,255,0.16)',
                }}
              />
            ))}
          </div>
          <div className="flex-1 flex gap-[1.5px] px-[4px]">
            {Array.from({ length: poses }).map((_, i) => (
              <div key={i} className="flex-1 h-full" style={{ background: 'rgba(196,168,130,0.52)', borderRadius: '0.5px' }} />
            ))}
          </div>
          <div className="flex justify-evenly items-center" style={{ height: '5px' }}>
            {Array.from({ length: holeCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '3.5px',
                  height: '2.5px',
                  borderRadius: '0.5px',
                  background: 'rgba(255,255,255,0.16)',
                }}
              />
            ))}
          </div>
        </div>
      )
    }

    // ── Duo strip ────────────────────────────────────────────────────────
    case 'twostrip':
      return (
        <div className="flex flex-row gap-[3px] p-[4px] items-stretch" style={{ width: '50px', height: '38px', ...whiteFrame }}>
          {[0, 1].map((i) => (
            <div key={i} className="flex-1 h-full" style={cell} />
          ))}
        </div>
      )

    case 'twostrip_land':
      return (
        <div className="flex flex-col gap-[3px] p-[4px]" style={{ width: '36px', height: '48px', ...whiteFrame }}>
          {[0, 1].map((i) => (
            <div key={i} className="flex-1 w-full" style={cell} />
          ))}
        </div>
      )

    // ── Triple strip ─────────────────────────────────────────────────────
    case 'threestrip':
      return (
        <div className="flex flex-row gap-[2.5px] p-[4px] items-stretch" style={{ width: '66px', height: '36px', ...whiteFrame }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 h-full" style={cell} />
          ))}
        </div>
      )

    case 'threestrip_land':
      return (
        <div className="flex flex-col gap-[2.5px] p-[3.5px]" style={{ width: '36px', height: '54px', ...whiteFrame }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 w-full" style={cell} />
          ))}
        </div>
      )

    // ── Layout H (1 large + 2 stacked right) ─────────────────────────────
    case 'layout_h':
      return (
        <div className="p-[4px]" style={{ width: '56px', height: '40px', ...whiteFrame }}>
          <div className="flex gap-[2.5px] w-full h-full">
            <div className="flex-[1.7] h-full" style={cell} />
            <div className="flex-1 flex flex-col gap-[2.5px] h-full">
              <div className="flex-1 w-full" style={cell} />
              <div className="flex-1 w-full" style={cell} />
            </div>
          </div>
        </div>
      )

    // ── 2×2 grid (4 poses) ───────────────────────────────────────────────
    case 'grid_4':
      return (
        <div className="p-[4px]" style={{ width: '50px', height: '44px', ...whiteFrame }}>
          <div className="grid grid-cols-2 grid-rows-2 gap-[2.5px] w-full h-full">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={cell} />
            ))}
          </div>
        </div>
      )

    case 'grid_4_land':
      return (
        <div className="p-[3.5px]" style={{ width: '62px', height: '42px', ...whiteFrame }}>
          <div className="grid grid-cols-2 grid-rows-2 gap-[2px] w-full h-full">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={cell} />
            ))}
          </div>
        </div>
      )

    // ── Layout E (1 large left + 3 stacked right) ────────────────────────
    case 'layout_e':
      return (
        <div className="p-[4px]" style={{ width: '56px', height: '46px', ...whiteFrame }}>
          <div className="flex gap-[2.5px] w-full h-full">
            <div className="flex-[2] h-full" style={cell} />
            <div className="flex-1 flex flex-col gap-[2px] h-full">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex-1 w-full" style={cell} />
              ))}
            </div>
          </div>
        </div>
      )

    // ── Layout 9 (1 large top + 3 across bottom) ─────────────────────────
    case 'layout_9':
      return (
        <div className="p-[4px]" style={{ width: '54px', height: '48px', ...whiteFrame }}>
          <div className="flex flex-col gap-[2.5px] w-full h-full">
            <div className="flex-[2] w-full" style={cell} />
            <div className="flex-1 flex gap-[2px] w-full">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex-1 h-full" style={cell} />
              ))}
            </div>
          </div>
        </div>
      )

    // ── Layout 3 (2 rows × 3 cols) ───────────────────────────────────────
    case 'layout_3':
      return (
        <div className="p-[4px]" style={{ width: '56px', height: '40px', ...whiteFrame }}>
          <div className="grid grid-cols-3 grid-rows-2 gap-[2px] w-full h-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={cell} />
            ))}
          </div>
        </div>
      )

    case 'layout_3_land':
      return (
        <div className="p-[4px]" style={{ width: '66px', height: '42px', ...whiteFrame }}>
          <div className="grid grid-cols-3 grid-rows-2 gap-[2px] w-full h-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={cell} />
            ))}
          </div>
        </div>
      )

    // ── Grid 6 (3 rows × 2 cols) ─────────────────────────────────────────
    case 'grid_6':
      return (
        <div className="p-[4px]" style={{ width: '40px', height: '54px', ...whiteFrame }}>
          <div className="grid grid-cols-2 grid-rows-3 gap-[2px] w-full h-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={cell} />
            ))}
          </div>
        </div>
      )

    // ── Polaroids ────────────────────────────────────────────────────────
    case 'polaroid_2':
      return (
        <div className="flex flex-col items-center gap-[3px]">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex flex-col"
              style={{
                width: '24px',
                height: '22px',
                padding: '2px 2px 5px',
                transform: `rotate(${i % 2 === 0 ? -3 : 3}deg)`,
                ...whiteFrame,
              }}
            >
              <div className="flex-1 w-full" style={cell} />
            </div>
          ))}
        </div>
      )

    case 'polaroid_3':
      return (
        <div className="flex flex-col items-center gap-[2px]">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col"
              style={{
                width: '19px',
                height: '16px',
                padding: '1.5px 1.5px 3.5px',
                transform: `rotate(${i === 1 ? 3 : -3}deg)`,
                ...whiteFrame,
              }}
            >
              <div className="flex-1 w-full" style={cell} />
            </div>
          ))}
        </div>
      )

    case 'polaroid_4':
      return (
        <div className="grid grid-cols-2 gap-[4px]">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col"
              style={{
                width: '23px',
                height: '22px',
                padding: '2px 2px 5px',
                transform: `rotate(${i % 2 === 0 ? -3 : 3}deg)`,
                ...whiteFrame,
              }}
            >
              <div className="flex-1 w-full" style={cell} />
            </div>
          ))}
        </div>
      )

    // ── Diagonal ─────────────────────────────────────────────────────────
    case 'diagonal_2':
    case 'diagonal_3':
    case 'diagonal_4': {
      const count = id === 'diagonal_2' ? 2 : id === 'diagonal_3' ? 3 : 4
      const cardW = count === 4 ? 24 : 28
      const cardH = count === 4 ? 17 : 20
      const step = count === 4 ? 11 : count === 3 ? 14 : 16
      const containerH = (count - 1) * step + cardH

      return (
        <div className="relative" style={{ width: '44px', height: `${containerH}px` }}>
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: i % 2 === 0 ? '4px' : `${40 - cardW}px`,
                top: `${i * step}px`,
                width: `${cardW}px`,
                height: `${cardH}px`,
                padding: '1.5px',
                zIndex: i + 1,
                transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)`,
                ...whiteFrame,
              }}
            >
              <div className="w-full h-full" style={cell} />
            </div>
          ))}
        </div>
      )
    }

    // ── Wide strip ───────────────────────────────────────────────────────
    case 'wide_strip': {
      const h = poses === 6 ? 56 : poses === 4 ? 48 : poses === 3 ? 40 : 32
      return (
        <div
          className="flex flex-col rounded-[1px]"
          style={{
            width: '32px',
            height: `${h}px`,
            padding: '4px 3px 5px',
            gap: '2px',
            ...whiteFrame,
          }}
        >
          {Array.from({ length: poses }).map((_, i) => (
            <div key={i} className="flex-1 w-full" style={cell} />
          ))}
        </div>
      )
    }

    // ── Double cut (twin parallel strips) ────────────────────────────────
    case 'double_cut': {
      const h = poses === 4 ? 48 : poses === 3 ? 40 : 32
      return (
        <div
          className="flex items-stretch gap-[3px] p-[3px] rounded-[1px]"
          style={{ width: '44px', height: `${h}px`, ...whiteFrame }}
        >
          {[0, 1].map((col) => (
            <div key={col} className="flex-1 flex flex-col gap-[1.5px] py-[2px]">
              {Array.from({ length: poses }).map((_, i) => (
                <div key={i} className="flex-1 w-full" style={cell} />
              ))}
            </div>
          ))}
        </div>
      )
    }

    // ── Postcard (4×6 landscape with editorial panel) ────────────────────
    case 'postcard': {
      const cols = poses <= 2 ? 1 : poses <= 4 ? 2 : 3
      const rows = 2
      const count = cols * rows
      return (
        <div
          className="flex items-stretch gap-[3px] p-[4px]"
          style={{ width: '68px', height: '42px', ...whiteFrame }}
        >
          <div
            className="flex-[2.2] grid gap-[2px]"
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
          >
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                style={
                  poses === 3 && i === 3
                    ? { border: '0.75px dashed rgba(92,61,30,0.4)', borderRadius: '1px' }
                    : cell
                }
              />
            ))}
          </div>
          <div
            className="flex-1 flex flex-col justify-between pl-[3px]"
            style={{ borderLeft: '0.75px solid rgba(92,61,30,0.28)' }}
          >
            <div className="w-[7px] h-[9px] self-end" style={{ border: '0.75px dashed rgba(92,61,30,0.4)' }} />
            <div className="space-y-[2.5px]">
              <div className="h-[1px] w-full" style={{ background: 'rgba(92,61,30,0.28)' }} />
              <div className="h-[1px] w-full" style={{ background: 'rgba(92,61,30,0.28)' }} />
            </div>
          </div>
        </div>
      )
    }

    // ── Layered duo (overlap 2) ──────────────────────────────────────────
    case 'overlap_2':
      return (
        <div className="relative p-[3px]" style={{ width: '54px', height: '44px', ...whiteFrame }}>
          <div style={{ width: '34px', height: '25px', ...cell }} />
          <div
            style={{
              position: 'absolute',
              right: '4px',
              bottom: '4px',
              width: '23px',
              height: '17px',
              padding: '1.5px',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }}
          >
            <div className="w-full h-full" style={cell} />
          </div>
        </div>
      )

    // ── Top banner (1 wide + 2 bottom) ───────────────────────────────────
    case 'banner_3':
      return (
        <div className="p-[4px]" style={{ width: '50px', height: '46px', ...whiteFrame }}>
          <div className="flex flex-col gap-[2px] w-full h-full">
            <div className="flex-[1.3] w-full" style={cell} />
            <div className="flex-1 flex gap-[2px] w-full">
              <div className="flex-1 h-full" style={cell} />
              <div className="flex-1 h-full" style={cell} />
            </div>
          </div>
        </div>
      )

    // ── Tall triptych (3 vertical windows) ───────────────────────────────
    case 'triptych_3':
      return (
        <div className="flex gap-[3px] p-[4px] items-stretch" style={{ width: '62px', height: '42px', ...whiteFrame }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 h-full" style={cell} />
          ))}
        </div>
      )

    // ── Bento mosaic (asymmetric 2×2) ────────────────────────────────────
    case 'bento_4':
      return (
        <div className="flex flex-col gap-[2px] p-[4px]" style={{ width: '54px', height: '44px', ...whiteFrame }}>
          <div className="flex-1 flex gap-[2px]">
            <div className="flex-[1.7]" style={cell} />
            <div className="flex-1" style={cell} />
          </div>
          <div className="flex-1 flex gap-[2px]">
            <div className="flex-1" style={cell} />
            <div className="flex-[1.7]" style={cell} />
          </div>
        </div>
      )

    // ── Slim bookmark 4 ──────────────────────────────────────────────────
    case 'bookmark_4':
      return (
        <div
          className="flex flex-col gap-[1.5px] p-[4px]"
          style={{ width: '20px', height: '54px', ...whiteFrame }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex-1 w-full" style={cell} />
          ))}
        </div>
      )

    // ── Collage 6 (1 large + 5) ──────────────────────────────────────────
    case 'collage_6':
      return (
        <div className="flex flex-col gap-[2px] p-[4px]" style={{ width: '52px', height: '46px', ...whiteFrame }}>
          <div className="flex-[2] flex gap-[2px]">
            <div className="flex-[2.1] h-full" style={cell} />
            <div className="flex-1 flex flex-col gap-[2px] h-full">
              <div className="flex-1 w-full" style={cell} />
              <div className="flex-1 w-full" style={cell} />
            </div>
          </div>
          <div className="flex-1 flex gap-[2px]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex-1 h-full" style={cell} />
            ))}
          </div>
        </div>
      )

    // ── Proof contact sheet (3×2 with index stripe) ──────────────────────
    case 'contact_6':
      return (
        <div className="p-[4px]" style={{ width: '64px', height: '44px', ...whiteFrame }}>
          <div className="grid grid-cols-3 grid-rows-2 gap-x-[2px] gap-y-[4px] w-full h-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full h-full" style={cell} />
            ))}
          </div>
        </div>
      )

    default:
      return <div style={{ width: '32px', height: '32px', background: 'var(--border)', borderRadius: '2px' }} />
  }
}

export default function LayoutSelector({ selected, poseCount, onSelect }: LayoutSelectorProps) {
  const available = getLayoutsForPoseCount(poseCount)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Layout
        </p>
        <span className="font-body text-xs italic" style={{ color: 'var(--sepia)' }}>
          {available.length} styles
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {available.map((layout) => {
          const isSelected = selected === layout.id
          return (
            <button
              key={layout.id}
              type="button"
              onClick={() => onSelect(layout.id)}
              className="flex flex-col items-center justify-between gap-2.5 p-3 sm:p-4 rounded-sm transition-all duration-200 active:scale-[0.98]"
              style={{
                border: `1.5px solid ${isSelected ? 'var(--vintage-brown)' : 'var(--border)'}`,
                background: isSelected ? 'rgba(92,61,30,0.06)' : 'var(--surface)',
              }}
            >
              <div className="h-16 w-full flex items-center justify-center overflow-hidden">
                <LayoutPreview id={layout.id} poses={poseCount} />
              </div>

              <div className="flex flex-col items-center gap-1 min-h-[26px] justify-center">
                <span
                  className="font-display text-xs tracking-wide leading-tight text-center"
                  style={{ color: isSelected ? 'var(--vintage-brown)' : 'var(--text-muted)', fontWeight: isSelected ? '700' : '400' }}
                >
                  {layout.label}
                </span>
                {layout.orientation === 'landscape' && <LandscapeTag />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
