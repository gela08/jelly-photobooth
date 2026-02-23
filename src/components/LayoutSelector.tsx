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
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 2h4v5"/>
      </svg>
      H
    </span>
  )
}

function LayoutPreview({ id, poses }: { id: LayoutType; poses: number }) {
  const cell = { background: 'var(--vintage-brown)', opacity: 0.5, borderRadius: '1px' }
  const darkCell = { background: '#c4a882', opacity: 0.7, borderRadius: '1px' }

  switch (id) {
    // ── Classic strip (portrait) ─────────────────────────────────────────
    case 'classic':
      return (
        <div className="flex flex-col" style={{ width: '22px', background: '#121010', padding: '3px', gap: '1px' }}>
          <div style={{ height: '5px', background: 'rgba(196,168,130,0.5)', fontSize: '0', marginBottom: '2px' }} />
          {Array.from({ length: poses }).map((_,i) => (
            <div key={i} style={{ height: '9px', ...darkCell }} />
          ))}
          <div style={{ height: '4px', marginTop: '2px' }} />
        </div>
      )
    // ── Classic strip (landscape) ────────────────────────────────────────
    case 'classic_land':
      return (
        <div className="flex flex-col" style={{ width: '36px', background: '#121010', padding: '3px', gap: '1px' }}>
          <div style={{ height: '4px', background: 'rgba(196,168,130,0.5)', marginBottom: '1px' }} />
          {Array.from({ length: poses }).map((_,i) => (
            <div key={i} style={{ height: '6px', ...darkCell }} />
          ))}
          <div style={{ height: '3px', marginTop: '1px' }} />
        </div>
      )
    // ── Film strip (portrait) ────────────────────────────────────────────
    case 'filmstrip':
      return (
        <div className="flex" style={{ width: '26px', height: `${poses*12+12}px`, background: '#0e0b08', borderRadius: '1px', overflow: 'hidden' }}>
          <div className="flex flex-col justify-around items-center" style={{ width: '5px', padding: '2px 0' }}>
            {Array.from({ length: poses+1 }).map((_,i) => (
              <div key={i} style={{ width: '3px', height: '4px', borderRadius: '1px', background: 'rgba(0,0,0,0.8)', border: '0.5px solid rgba(255,255,255,0.12)' }} />
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-px py-1">
            {Array.from({ length: poses }).map((_,i) => (
              <div key={i} className="flex-1" style={{ background: 'rgba(196,168,130,0.45)', borderRadius: '0.5px' }} />
            ))}
          </div>
          <div className="flex flex-col justify-around items-center" style={{ width: '5px', padding: '2px 0' }}>
            {Array.from({ length: poses+1 }).map((_,i) => (
              <div key={i} style={{ width: '3px', height: '4px', borderRadius: '1px', background: 'rgba(0,0,0,0.8)', border: '0.5px solid rgba(255,255,255,0.12)' }} />
            ))}
          </div>
        </div>
      )
    // ── Film strip (landscape) ───────────────────────────────────────────
    case 'filmstrip_land':
      return (
        <div className="flex flex-col" style={{ width: '44px', height: '26px', background: '#0e0b08', borderRadius: '1px', overflow: 'hidden' }}>
          <div className="flex justify-around items-center" style={{ height: '5px' }}>
            {Array.from({ length: poses+1 }).map((_,i) => (
              <div key={i} style={{ width: '4px', height: '3px', borderRadius: '0.5px', background: 'rgba(0,0,0,0.8)', border: '0.5px solid rgba(255,255,255,0.12)' }} />
            ))}
          </div>
          <div className="flex-1 flex gap-px px-1">
            {Array.from({ length: poses }).map((_,i) => (
              <div key={i} className="flex-1" style={{ background: 'rgba(196,168,130,0.45)', borderRadius: '0.5px' }} />
            ))}
          </div>
          <div className="flex justify-around items-center" style={{ height: '5px' }}>
            {Array.from({ length: poses+1 }).map((_,i) => (
              <div key={i} style={{ width: '4px', height: '3px', borderRadius: '0.5px', background: 'rgba(0,0,0,0.8)', border: '0.5px solid rgba(255,255,255,0.12)' }} />
            ))}
          </div>
        </div>
      )
    // ── Duo strip ────────────────────────────────────────────────────────
    case 'twostrip':
      return (
        <div className="flex gap-1 h-12 w-10">
          {[0,1].map(i => <div key={i} className="flex-1" style={cell} />)}
        </div>
      )
    case 'twostrip_land':
      return (
        <div className="flex flex-col gap-1 w-12 h-7">
          {[0,1].map(i => <div key={i} className="flex-1" style={cell} />)}
        </div>
      )
    // ── Triple strip ─────────────────────────────────────────────────────
    case 'threestrip':
      return (
        <div className="flex gap-0.5 h-12 w-14">
          {[0,1,2].map(i => <div key={i} className="flex-1" style={cell} />)}
        </div>
      )
    case 'threestrip_land':
      return (
        <div className="flex flex-col gap-0.5 w-14 h-8">
          {[0,1,2].map(i => <div key={i} className="flex-1" style={cell} />)}
        </div>
      )
    // ── Layout H ─────────────────────────────────────────────────────────
    case 'layout_h':
      return (
        <div className="flex gap-1" style={{ width: '42px', height: '30px' }}>
          <div className="flex-[2]" style={cell} />
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex-1" style={cell} />
            <div className="flex-1" style={cell} />
          </div>
        </div>
      )
    // ── 2×2 grid ─────────────────────────────────────────────────────────
    case 'grid_4':
      return (
        <div className="grid grid-cols-2 gap-0.5 w-10 h-10">
          {[0,1,2,3].map(i => <div key={i} style={cell} />)}
        </div>
      )
    case 'grid_4_land':
      return (
        <div className="grid grid-cols-2 gap-0.5 w-12 h-8">
          {[0,1,2,3].map(i => <div key={i} style={cell} />)}
        </div>
      )
    // ── Layout E ─────────────────────────────────────────────────────────
    case 'layout_e':
      return (
        <div className="flex gap-1" style={{ width: '38px', height: '42px' }}>
          <div style={{ flex: '1.4', ...cell }} />
          <div className="flex-1 flex flex-col gap-1">
            {[0,1,2].map(i => <div key={i} className="flex-1" style={cell} />)}
          </div>
        </div>
      )
    // ── Layout 9 ─────────────────────────────────────────────────────────
    case 'layout_9':
      return (
        <div className="flex flex-col gap-1" style={{ width: '38px', height: '34px' }}>
          <div style={{ flex: '1.4', ...cell }} />
          <div className="flex gap-1 flex-1">
            {[0,1,2].map(i => <div key={i} className="flex-1" style={cell} />)}
          </div>
        </div>
      )
    // ── Layout 3 (2×3) ───────────────────────────────────────────────────
    case 'layout_3':
      return (
        <div className="grid grid-cols-3 gap-0.5 w-12 h-10">
          {Array.from({length:6}).map((_,i) => <div key={i} style={cell} />)}
        </div>
      )
    case 'layout_3_land':
      return (
        <div className="grid grid-cols-3 gap-0.5 w-14 h-8">
          {Array.from({length:6}).map((_,i) => <div key={i} style={cell} />)}
        </div>
      )
    // ── Grid 6 (3×2) ─────────────────────────────────────────────────────
    case 'grid_6':
      return (
        <div className="grid grid-cols-2 gap-0.5 w-10" style={{ height: '42px' }}>
          {Array.from({length:6}).map((_,i) => <div key={i} style={cell} />)}
        </div>
      )
    // ── Polaroids ────────────────────────────────────────────────────────
    case 'polaroid_2':
    case 'polaroid_3':
    case 'polaroid_4': {
      const count = id === 'polaroid_2' ? 2 : id === 'polaroid_3' ? 3 : 4
      const cols = count <= 2 ? count : count === 3 ? 3 : 2
      return (
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols},1fr)`, width: count===3?'46px':'36px', height: count<=2?'30px':'42px' }}>
          {Array.from({length:count}).map((_,i) => (
            <div key={i} className="flex flex-col" style={{ background:'white', border:'1px solid var(--border)', boxShadow:'1px 1px 2px rgba(0,0,0,0.15)', transform:`rotate(${i%2===0?-2:2}deg)` }}>
              <div className="flex-1 m-0.5" style={{ background:'var(--vintage-brown)', opacity:0.4, borderRadius:'0.5px' }} />
              <div style={{ height:'3px' }} />
            </div>
          ))}
        </div>
      )
    }
    // ── Diagonal ─────────────────────────────────────────────────────────
    case 'diagonal_2':
    case 'diagonal_3':
    case 'diagonal_4': {
      const count = id === 'diagonal_2' ? 2 : id === 'diagonal_3' ? 3 : 4
      return (
        <div className="relative" style={{ width:'36px', height:`${count*11}px` }}>
          {Array.from({length:count}).map((_,i) => (
            <div key={i} style={{
              position:'absolute', left:i%2===0?'0':'6px', top:`${i*10}px`,
              width:'28px', height:'9px', ...cell
            }} />
          ))}
        </div>
      )
    }
    default:
      return <div style={{ width:'32px', height:'32px', background:'var(--border)', borderRadius:'2px' }} />
  }
}

export default function LayoutSelector({ selected, poseCount, onSelect }: LayoutSelectorProps) {
  const available = getLayoutsForPoseCount(poseCount)

  return (
    <div className="space-y-3">
      <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
        Layout
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {available.map((layout) => {
          const isSelected = selected === layout.id
          return (
            <button
              key={layout.id}
              onClick={() => onSelect(layout.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-sm transition-all duration-200"
              style={{
                border: `1px solid ${isSelected ? 'var(--vintage-brown)' : 'var(--border)'}`,
                background: isSelected ? 'rgba(92,61,30,0.05)' : 'var(--surface)',
              }}
            >
              <div className="h-14 flex items-center justify-center">
                <LayoutPreview id={layout.id} poses={poseCount} />
              </div>
              <div className="flex flex-col items-center gap-1">
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
