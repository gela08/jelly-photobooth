'use client'; // This is the magic fix

import { useRef } from 'react'
import { FilterType, FILTERS } from '@/lib/types'

interface FilterSelectorProps {
  selected: FilterType
  previewPhoto?: string
  onSelect: (filter: FilterType) => void
  compact?: boolean
  isOpen?: boolean
  onToggle?: () => void
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  )
}

function ToggleIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={isOpen ? '6 9 12 15 18 9' : '6 15 12 9 18 15'} />
    </svg>
  )
}

export default function FilterSelector({ selected, previewPhoto, onSelect, compact = false, isOpen = true, onToggle }: FilterSelectorProps) {
  const railRef = useRef<HTMLDivElement>(null)

  const moveRail = (direction: 'left' | 'right') => {
    railRef.current?.scrollBy({ left: direction === 'right' ? 300 : -300, behavior: 'smooth' })
  }

  if (compact) {
    if (!isOpen) {
      return (
        <button
          type="button"
          onClick={onToggle}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-5 transition-opacity hover:opacity-100 active:opacity-60"
          style={{ color: 'rgba(255,255,255,0.72)' }}
          aria-label="Show filters"
          title="Show filters"
        >
          <ToggleIcon isOpen={false} />
        </button>
      )
    }

    return (
      <div
        className="relative w-full overflow-visible px-6 sm:px-7 pt-4 sm:pt-5 pb-2 rounded-sm"
        style={{
          background: 'rgba(20,14,10,0.34)',
          border: '1px solid rgba(255,255,255,0.24)',
          boxShadow: '0 8px 24px rgba(20,14,10,0.18), inset 0 1px 0 rgba(255,255,255,0.18)',
        }}
      >
        <button
          type="button"
          onClick={() => moveRail('left')}
          className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-center w-6 transition-opacity hover:opacity-100 active:opacity-60"
          style={{ color: 'rgba(255,255,255,0.82)', opacity: 0.72 }}
          aria-label="Previous filters"
        >
          <ArrowIcon direction="left" />
        </button>

        <div
          ref={railRef}
          className="flex gap-2 sm:gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory touch-pan-x select-none scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FILTERS.map((filter) => {
            const isSelected = selected === filter.id
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onSelect(filter.id)}
                title={filter.description}
                className="relative flex flex-col items-center flex-none w-[74px] sm:w-[92px] snap-start transition-all duration-200"
                style={{ opacity: isSelected ? 1 : 0.78 }}
              >
                <div
                  className="relative w-full aspect-[4/3] overflow-hidden rounded-sm transition-all"
                  style={{
                    border: `2px solid ${isSelected ? '#f5f0e8' : 'rgba(255,255,255,0.2)'}`,
                    boxShadow: isSelected ? '0 0 0 1px rgba(92,61,30,0.4)' : 'none',
                  }}
                >
                  {previewPhoto ? (
                    <img src={previewPhoto} alt={filter.label} className="w-full h-full object-cover" style={{ filter: filter.cssFilter }} />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xs"
                      style={{ background: 'linear-gradient(135deg, #c4a882 0%, #e8c99a 50%, #d4a878 100%)', filter: filter.cssFilter, fontFamily: 'Georgia, serif', color: 'rgba(92,61,30,0.65)' }}
                    >
                      ◉
                    </div>
                  )}
                  <span
                    className="absolute bottom-0 left-0 right-0 px-1 py-0.5 font-display text-[9px] sm:text-[10px] tracking-wide leading-tight text-center truncate"
                    style={{
                      background: 'linear-gradient(to top, rgba(14,11,8,0.85), rgba(14,11,8,0.35), transparent)',
                      color: isSelected ? '#faf6ee' : 'rgba(250,246,238,0.85)',
                      fontWeight: isSelected ? '700' : '400',
                    }}
                  >
                    {filter.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => moveRail('right')}
          className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-center w-6 transition-opacity hover:opacity-100 active:opacity-60"
          style={{ color: 'rgba(255,255,255,0.82)', opacity: 0.72 }}
          aria-label="Next filters"
        >
          <ArrowIcon direction="right" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-8 h-5 transition-opacity hover:opacity-100 active:opacity-60"
          style={{ color: 'rgba(255,255,255,0.85)', opacity: 0.78 }}
          aria-label="Hide filters"
          title="Hide filters"
        >
          <ToggleIcon isOpen />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
          Film Filter
        </p>
        <p className="text-xs font-body" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
          {FILTERS.find(f => f.id === selected)?.description}
        </p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
        {FILTERS.map((filter) => {
          const isSelected = selected === filter.id
          return (
            <button
              key={filter.id}
              onClick={() => onSelect(filter.id)}
              title={filter.description}
              className="flex flex-col items-center gap-1.5 transition-all duration-200 group"
              style={{ opacity: isSelected ? 1 : 0.55 }}
            >
              <div
                className="w-full aspect-square rounded-sm overflow-hidden transition-all"
                style={{
                  border: `2px solid ${isSelected ? 'var(--vintage-brown)' : 'transparent'}`,
                  boxShadow: isSelected ? '0 0 0 1px var(--vintage-brown)' : 'none',
                }}
              >
                {previewPhoto ? (
                  <img
                    src={previewPhoto}
                    alt={filter.label}
                    className="w-full h-full object-cover"
                    style={{ filter: filter.cssFilter }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-xs"
                    style={{
                      background: 'linear-gradient(135deg, #c4a882 0%, #e8c99a 50%, #d4a878 100%)',
                      filter: filter.cssFilter,
                      fontFamily: 'Georgia, serif',
                      color: 'rgba(92,61,30,0.6)',
                    }}
                  >
                    ◉
                  </div>
                )}
              </div>
              <span
                className="font-display text-[10px] tracking-wide leading-tight text-center truncate w-full"
                style={{
                  color: isSelected ? 'var(--vintage-brown)' : 'var(--text-muted)',
                  fontWeight: isSelected ? '700' : '400',
                }}
              >
                {filter.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
