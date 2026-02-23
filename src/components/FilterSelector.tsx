'use client'; // This is the magic fix

import { FilterType, FILTERS } from '@/lib/types'

interface FilterSelectorProps {
  selected: FilterType
  previewPhoto?: string
  onSelect: (filter: FilterType) => void
}

export default function FilterSelector({ selected, previewPhoto, onSelect }: FilterSelectorProps) {
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
