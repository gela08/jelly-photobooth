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
        className="relative w-full overflow-visible px-7 pt-5 pb-2"
        style={{
          background: 'rgba(250,246,238,0.18)',
          border: '1px solid rgba(255,255,255,0.28)',
          boxShadow: '0 8px 24px rgba(20,14,10,0.12), inset 0 1px 0 rgba(255,255,255,0.25)',
          //backdropFilter: 'blur(12px) saturate(1.1)',
          // WebkitBackdropFilter: 'blur(12px) saturate(1.1)',
        }}
      >
        <button
          type="button"
          onClick={() => moveRail('left')}
          className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-center w-6 transition-opacity hover:opacity-100 active:opacity-60"
          style={{ color: 'rgba(255,255,255,0.72)', opacity: 0.62 }}
          aria-label="Previous filters"
        >
          <ArrowIcon direction="left" />
        </button>

        <div
          ref={railRef}
          className="flex gap-3 overflow-x-auto overscroll-x-contain snap-x snap-mandatory touch-pan-x select-none scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FILTERS.map((filter) => {
            const isSelected = selected === filter.id
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => onSelect(filter.id)}
                title={filter.description}
                className="relative flex flex-col items-center flex-none w-[92px] snap-start transition-all duration-200"
                style={{ opacity: isSelected ? 1 : 0.72 }}
              >
                <div
                  className="w-full aspect-[4/3] overflow-hidden transition-all"
                  style={{
                    border: `1px solid ${isSelected ? 'var(--vintage-brown)' : 'rgba(92,61,30,0.1)'}`,
                    boxShadow: isSelected ? '0 0 0 1px rgba(92,61,30,0.18)' : 'none',
                  }}
                >
                  {previewPhoto ? (
                    <img src={previewPhoto} alt={filter.label} className="w-full h-full object-cover" style={{ filter: filter.cssFilter }} />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-xs"
                      style={{ background: 'linear-gradient(135deg, #c4a882 0%, #e8c99a 50%, #d4a878 100%)', filter: filter.cssFilter, fontFamily: 'Georgia, serif', color: 'rgba(92,61,30,0.6)' }}
                    >
                      ◉
                    </div>
                  )}
                  <span
                    className="absolute bottom-0 left-0 right-0 px-1 py-1 font-display text-[10px] tracking-wide leading-tight text-center truncate"
                    style={{ color: isSelected ? 'var(--vintage-brown)' : 'var(--text-muted)', fontWeight: isSelected ? '700' : '400' }}
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
          style={{ color: 'rgba(255,255,255,0.72)', opacity: 0.62 }}
          aria-label="Next filters"
        >
          <ArrowIcon direction="right" />
        </button>

        <button
          type="button"
          onClick={onToggle}
          className="absolute bottom-[4.80rem] left-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-8 h-5 transition-opacity hover:opacity-100 active:opacity-60"
          style={{ color: 'rgba(255,255,255,0.72)', opacity: 0.62 }}
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
