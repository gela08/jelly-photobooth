'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  PhotoSession,
  PlacedSticker,
  StickerAsset,
  StickerCategory,
} from '@/lib/types'
import { generatePhotoboothCanvas } from '@/lib/canvasExport'
import {
  BUILTIN_STICKERS,
  STICKER_CATEGORIES,
  loadCustomStickers,
  processUploadedSticker,
  saveCustomStickers,
} from '@/lib/stickers'

interface StickerEditorProps {
  session: PhotoSession
  stickers: PlacedSticker[]
  onChange: (next: PlacedSticker[]) => void
  renderBaseCanvas?: () => Promise<HTMLCanvasElement>
  renderKey?: string
}

type PlacementMode = 'single' | 'scatter'

const SCATTER_PRESETS = [
  { x: 0.14, y: 0.13, rotation: -16, scale: 0.85 },
  { x: 0.86, y: 0.15, rotation: 14, scale: 0.85 },
  { x: 0.15, y: 0.85, rotation: 12, scale: 0.85 },
  { x: 0.85, y: 0.87, rotation: -14, scale: 0.85 },
]

const SINGLE_OFFSETS = [
  { x: 0.5, y: 0.5, rotation: -6 },
  { x: 0.36, y: 0.36, rotation: 8 },
  { x: 0.64, y: 0.62, rotation: -10 },
  { x: 0.35, y: 0.68, rotation: 6 },
  { x: 0.65, y: 0.34, rotation: 12 },
]

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function LayersUpIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function LayersDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function StickerEditor({
  session,
  stickers,
  onChange,
  renderBaseCanvas,
  renderKey,
}: StickerEditorProps) {
  const [baseUrl, setBaseUrl] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(true)
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 })
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<StickerCategory>('cute')
  const [placementMode, setPlacementMode] = useState<PlacementMode>('single')
  const [customStickers, setCustomStickers] = useState<StickerAsset[]>([])
  const [publicStickers, setPublicStickers] = useState<StickerAsset[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const genIdRef = useRef(0)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const lastSyncRef = useRef(0)
  const [dragPos, setDragPos] = useState<{ uid: string; x: number; y: number } | null>(null)
  const dragRef = useRef<{
    uid: string
    startClientX: number
    startClientY: number
    origX: number
    origY: number
    lastX: number
    lastY: number
  } | null>(null)

  // Load saved custom stickers and scan public/stickers/
  useEffect(() => {
    setCustomStickers(loadCustomStickers())
    fetch('/api/stickers')
      .then((res) => (res.ok ? res.json() : { stickers: [] }))
      .then((data) => {
        if (Array.isArray(data?.stickers)) {
          setPublicStickers(data.stickers)
        }
      })
      .catch(() => {
        // Ignore fetch errors silently
      })
  }, [])

  // Generate base strip preview (without stickers, since stickers are interactive overlay)
  useEffect(() => {
    if (!session.photos.length && !renderBaseCanvas) return
    const id = ++genIdRef.current
    setIsRendering(true)
    const timer = setTimeout(() => {
      const promise = renderBaseCanvas
        ? renderBaseCanvas()
        : generatePhotoboothCanvas(session, undefined, { includeStickers: false })
      promise
        .then((canvas) => {
          if (genIdRef.current === id) {
            setBaseUrl(canvas.toDataURL('image/jpeg', 0.88))
          }
        })
        .catch(console.error)
        .finally(() => {
          if (genIdRef.current === id) setIsRendering(false)
        })
    }, 90)
    return () => clearTimeout(timer)
  }, [
    session.photos,
    session.photoTransforms,
    session.filter,
    session.layout,
    session.caption,
    session.showDate,
    session.stripTheme,
    session.borderStyle,
    session.stripDecoration,
    renderBaseCanvas,
    renderKey,
  ])

  // Observe rendered image size so sticker dimensions match canvasExport 1:1
  useEffect(() => {
    const el = imgRef.current
    if (!el) return

    const updateSize = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setDisplaySize({ width: rect.width, height: rect.height })
      }
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [baseUrl])

  // Keep selectedUid valid when stickers change
  useEffect(() => {
    if (selectedUid && !stickers.some((s) => s.uid === selectedUid)) {
      setSelectedUid(null)
    }
  }, [stickers, selectedUid])

  const addStickerAsset = useCallback(
    (asset: StickerAsset, modeOverride?: PlacementMode) => {
      const mode = modeOverride ?? placementMode
      const now = Date.now()

      if (mode === 'scatter') {
        const copies: PlacedSticker[] = SCATTER_PRESETS.map((pos, idx) => ({
          uid: `st-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          assetId: asset.id,
          label: asset.label,
          src: asset.src,
          x: pos.x,
          y: pos.y,
          scale: pos.scale,
          rotation: pos.rotation,
        }))
        onChange([...stickers, ...copies])
        setSelectedUid(copies[0].uid)
      } else {
        const spot = SINGLE_OFFSETS[stickers.length % SINGLE_OFFSETS.length]
        const placed: PlacedSticker = {
          uid: `st-${now}-${Math.random().toString(36).slice(2, 6)}`,
          assetId: asset.id,
          label: asset.label,
          src: asset.src,
          x: spot.x,
          y: spot.y,
          scale: 1,
          rotation: spot.rotation,
        }
        onChange([...stickers, placed])
        setSelectedUid(placed.uid)
      }
    },
    [placementMode, stickers, onChange]
  )

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploadError(null)
    setIsUploading(true)
    try {
      const asset = await processUploadedSticker(file)
      const nextCustom = [asset, ...customStickers]
      setCustomStickers(nextCustom)
      saveCustomStickers(nextCustom)
      setActiveCategory('custom')
      addStickerAsset(asset)
    } catch {
      setUploadError('Please upload a valid PNG, JPG, GIF, or WebP image.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteCustomAsset = (assetId: string) => {
    const next = customStickers.filter((s) => s.id !== assetId)
    setCustomStickers(next)
    saveCustomStickers(next)
  }

  const updateSelected = (patch: Partial<PlacedSticker>) => {
    if (!selectedUid) return
    onChange(
      stickers.map((s) => (s.uid === selectedUid ? { ...s, ...patch } : s))
    )
  }

  const removeSticker = (uid: string) => {
    onChange(stickers.filter((s) => s.uid !== uid))
    if (selectedUid === uid) setSelectedUid(null)
  }

  const moveLayer = (direction: 1 | -1) => {
    if (!selectedUid) return
    const idx = stickers.findIndex((s) => s.uid === selectedUid)
    if (idx === -1) return
    const target = idx + direction
    if (target < 0 || target >= stickers.length) return
    const next = [...stickers]
    const [item] = next.splice(idx, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  const selectedSticker = stickers.find((s) => s.uid === selectedUid) ?? null
  const baseDim = Math.min(displaySize.width, displaySize.height) * 0.18

  const visibleAssets: StickerAsset[] =
    activeCategory === 'custom'
      ? [...customStickers, ...publicStickers]
      : BUILTIN_STICKERS.filter((s) => s.category === activeCategory)

  const myStickersCount = customStickers.length + publicStickers.length

  return (
    <div className="space-y-5 select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            Live Strip &amp; Stickers
          </p>
          <p className="font-body text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Tap a sticker to add, then drag to place
          </p>
        </div>
        {stickers.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onChange([])
              setSelectedUid(null)
            }}
            className="font-display text-[10px] tracking-widest uppercase px-2.5 py-1.5 rounded-sm transition-all active:scale-95"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              background: 'var(--surface)',
            }}
          >
            Clear Stickers ({stickers.length})
          </button>
        )}
      </div>

      {/* Interactive Strip Canvas */}
      <div className="flex justify-center">
        {!baseUrl && isRendering ? (
          <div className="flex flex-col items-center gap-3 py-12" style={{ color: 'var(--text-muted)' }}>
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--vintage-brown)' }}
            />
            <span className="font-display text-xs tracking-widest uppercase">Rendering…</span>
          </div>
        ) : baseUrl ? (
          <div
            className="relative inline-block max-w-full"
            onPointerDown={() => setSelectedUid(null)}
          >
            <img
              ref={imgRef}
              src={baseUrl}
              alt="Interactive photo strip"
              draggable={false}
              onLoad={() => {
                const el = imgRef.current
                if (el) {
                  const r = el.getBoundingClientRect()
                  if (r.width > 0 && r.height > 0) {
                    setDisplaySize({ width: r.width, height: r.height })
                  }
                }
              }}
              className="block max-w-full max-h-[440px] w-auto h-auto pointer-events-none select-none"
              style={{
                border: '1px solid var(--border)',
                boxShadow: '0 6px 28px var(--shadow-color)',
                opacity: isRendering ? 0.85 : 1,
                transition: 'opacity 150ms ease',
              }}
            />

            {/* Sticker interactive overlay layer */}
            {displaySize.width > 0 && (
              <div className="absolute inset-0 overflow-hidden">
                {stickers.map((raw) => {
                  const s = dragPos?.uid === raw.uid ? { ...raw, x: dragPos.x, y: dragPos.y } : raw
                  const active = s.uid === selectedUid
                  const boxDim = Math.max(18, baseDim * s.scale)
                  return (
                    <div
                      key={s.uid}
                      onPointerDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setSelectedUid(s.uid)
                        dragRef.current = {
                          uid: s.uid,
                          startClientX: e.clientX,
                          startClientY: e.clientY,
                          origX: s.x,
                          origY: s.y,
                          lastX: s.x,
                          lastY: s.y,
                        }
                        setDragPos({ uid: s.uid, x: s.x, y: s.y })
                        try {
                          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                        } catch {
                          // ignore if unavailable
                        }
                      }}
                      onPointerMove={(e) => {
                        if (!dragRef.current || dragRef.current.uid !== s.uid) return
                        if (displaySize.width <= 0 || displaySize.height <= 0) return
                        const dx = e.clientX - dragRef.current.startClientX
                        const dy = e.clientY - dragRef.current.startClientY
                        const nx = clamp(dragRef.current.origX + dx / displaySize.width, 0.03, 0.97)
                        const ny = clamp(dragRef.current.origY + dy / displaySize.height, 0.03, 0.97)
                        dragRef.current.lastX = nx
                        dragRef.current.lastY = ny
                        setDragPos({ uid: s.uid, x: nx, y: ny })

                        const now = Date.now()
                        if (now - lastSyncRef.current >= 160) {
                          lastSyncRef.current = now
                          onChange(
                            stickers.map((item) =>
                              item.uid === s.uid ? { ...item, x: nx, y: ny } : item
                            )
                          )
                        }
                      }}
                      onPointerUp={() => {
                        if (dragRef.current?.uid === s.uid) {
                          const { lastX, lastY } = dragRef.current
                          dragRef.current = null
                          setDragPos(null)
                          onChange(
                            stickers.map((item) =>
                              item.uid === s.uid ? { ...item, x: lastX, y: lastY } : item
                            )
                          )
                        }
                      }}
                      onPointerCancel={() => {
                        if (dragRef.current?.uid === s.uid) {
                          const { lastX, lastY } = dragRef.current
                          dragRef.current = null
                          setDragPos(null)
                          onChange(
                            stickers.map((item) =>
                              item.uid === s.uid ? { ...item, x: lastX, y: lastY } : item
                            )
                          )
                        }
                      }}
                      className="absolute touch-none cursor-grab active:cursor-grabbing"
                      style={{
                        left: `${s.x * 100}%`,
                        top: `${s.y * 100}%`,
                        width: `${boxDim}px`,
                        height: `${boxDim}px`,
                        transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
                        outline: active ? '1.5px dashed var(--vintage-brown)' : 'none',
                        outlineOffset: '3px',
                        borderRadius: '4px',
                      }}
                    >
                      <img
                        src={s.src}
                        alt={s.label}
                        draggable={false}
                        className="w-full h-full object-contain pointer-events-none select-none"
                      />
                      {active && (
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation()
                            removeSticker(s.uid)
                          }}
                          className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shadow-md"
                          style={{ background: '#b83227', color: '#ffffff' }}
                          aria-label={`Remove ${s.label}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Selected sticker controls */}
      {selectedSticker && (
        <div
          className="p-3 rounded-sm space-y-3"
          style={{
            background: 'var(--parchment)',
            border: '1px solid var(--border)',
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display text-[11px] tracking-widest uppercase font-bold" style={{ color: 'var(--vintage-brown)' }}>
              {selectedSticker.label}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => moveLayer(-1)}
                className="flex items-center gap-1 px-2 py-1 rounded-sm font-display text-[10px] tracking-wider uppercase"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}
                title="Send backward"
              >
                <LayersDownIcon /> Back
              </button>
              <button
                type="button"
                onClick={() => moveLayer(1)}
                className="flex items-center gap-1 px-2 py-1 rounded-sm font-display text-[10px] tracking-wider uppercase"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)' }}
                title="Bring forward"
              >
                <LayersUpIcon /> Front
              </button>
              <button
                type="button"
                onClick={() => removeSticker(selectedSticker.uid)}
                className="flex items-center gap-1 px-2 py-1 rounded-sm font-display text-[10px] tracking-wider uppercase"
                style={{ background: '#b83227', color: '#ffffff' }}
              >
                <TrashIcon /> Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2.5 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              <span className="w-12 text-[10px] font-display uppercase tracking-wider">Size</span>
              <input
                type="range"
                min={0.4}
                max={2.5}
                step={0.05}
                value={selectedSticker.scale}
                onChange={(e) => updateSelected({ scale: parseFloat(e.target.value) })}
                className="flex-1 accent-[#5c3d1e]"
              />
              <span className="w-10 text-right text-[11px]">{selectedSticker.scale.toFixed(1)}×</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
              <span className="w-12 text-[10px] font-display uppercase tracking-wider">Rotate</span>
              <input
                type="range"
                min={-180}
                max={180}
                step={2}
                value={selectedSticker.rotation}
                onChange={(e) => updateSelected({ rotation: parseInt(e.target.value, 10) })}
                className="flex-1 accent-[#5c3d1e]"
              />
              <span className="w-10 text-right text-[11px]">{selectedSticker.rotation}°</span>
            </label>
          </div>
        </div>
      )}

      {/* Mode toggle + Meme upload bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="inline-flex rounded-sm overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setPlacementMode('single')}
            className="px-3 py-1.5 font-display text-[10px] tracking-widest uppercase transition-colors"
            style={{
              background: placementMode === 'single' ? 'var(--vintage-brown)' : 'var(--surface)',
              color: placementMode === 'single' ? 'var(--cream)' : 'var(--text-secondary)',
            }}
          >
            1 by 1
          </button>
          <button
            type="button"
            onClick={() => setPlacementMode('scatter')}
            className="px-3 py-1.5 font-display text-[10px] tracking-widest uppercase transition-colors"
            style={{
              background: placementMode === 'scatter' ? 'var(--vintage-brown)' : 'var(--surface)',
              color: placementMode === 'scatter' ? 'var(--cream)' : 'var(--text-secondary)',
            }}
          >
            Scatter (4×)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-display text-[10px] tracking-widest uppercase transition-all active:scale-95 disabled:opacity-50"
            style={{
              border: '1px solid var(--vintage-brown)',
              color: 'var(--vintage-brown)',
              background: 'var(--surface)',
            }}
          >
            <UploadIcon />
            {isUploading ? 'Adding…' : 'Upload Meme'}
          </button>
        </div>
      </div>

      {uploadError && (
        <p className="text-xs font-body" style={{ color: '#b83227' }}>
          {uploadError}
        </p>
      )}

      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STICKER_CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-sm font-display text-[10px] tracking-widest uppercase transition-all"
              style={{
                background: active ? 'var(--vintage-brown)' : 'var(--surface)',
                color: active ? 'var(--cream)' : 'var(--text-secondary)',
                border: `1px solid ${active ? 'var(--vintage-brown)' : 'var(--border)'}`,
              }}
            >
              {cat.label}
              {cat.id === 'custom' && myStickersCount > 0 ? ` (${myStickersCount})` : ''}
            </button>
          )
        })}
      </div>

      {/* Sticker grid */}
      {visibleAssets.length === 0 ? (
        <div
          className="text-center py-6 px-4 rounded-sm space-y-2"
          style={{ border: '1px dashed var(--border)', background: 'var(--surface)' }}
        >
          <p className="font-body text-xs" style={{ color: 'var(--text-muted)' }}>
            Upload your favorite meme or PNG sticker once — it stays saved in your browser for reuse!
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm font-display text-[10px] tracking-widest uppercase"
            style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
          >
            <UploadIcon /> Upload Image
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {visibleAssets.map((asset) => (
            <div key={asset.id} className="relative group">
              <button
                type="button"
                onClick={() => addStickerAsset(asset)}
                className="w-full flex flex-col items-center gap-1 p-1.5 sm:p-2 rounded-sm transition-all hover:scale-[1.03] active:scale-95"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                }}
                title={`Add ${asset.label} (${placementMode === 'scatter' ? '4× scatter' : '1 by 1'})`}
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <img
                    src={asset.src}
                    alt={asset.label}
                    className="max-w-full max-h-full object-contain"
                    draggable={false}
                  />
                </div>
                <span
                  className="font-body text-[10px] leading-tight text-center line-clamp-1 w-full"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {asset.label}
                </span>
              </button>

              {asset.isCustom && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteCustomAsset(asset.id)
                  }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] leading-none opacity-80 hover:opacity-100"
                  style={{ background: '#b83227', color: '#fff' }}
                  title="Remove from My Stickers"
                  aria-label={`Delete ${asset.label}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
