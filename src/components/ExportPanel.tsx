'use client'; // This is the magic fix

import { useEffect, useRef, useState, useCallback } from 'react'
import { PhotoSession } from '@/lib/types'
import { generatePhotoboothCanvas, downloadPhoto } from '@/lib/canvasExport'

interface ExportPanelProps {
  session: PhotoSession
  onRetake: () => void
}

function PrintIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  )
}
function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.96"/>
    </svg>
  )
}
function FilmIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
      <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

export default function ExportPanel({ session, onRetake }: ExportPanelProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const genIdRef = useRef(0)

  const generatePreview = useCallback(async () => {
    const id = ++genIdRef.current
    setIsGenerating(true)
    try {
      const canvas = await generatePhotoboothCanvas(session)
      if (genIdRef.current === id) setPreviewUrl(canvas.toDataURL('image/png'))
    } catch (err) { console.error('Preview failed:', err) }
    finally { if (genIdRef.current === id) setIsGenerating(false) }
  }, [session])

  useEffect(() => { generatePreview() }, [generatePreview])

  const handleDownload = async (format: 'print' | 'social') => {
    setIsDownloading(true)
    try { await downloadPhoto(session, format) }
    catch (err) { console.error('Download failed:', err) }
    finally { setTimeout(() => setIsDownloading(false), 1000) }
  }

  return (
    <div className="space-y-6 animate-fade-in-up select-none">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold tracking-wide" style={{ color: 'var(--vintage-brown)' }}>
          Your Photobooth Strip
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Looking beautiful! Save your memories.
        </p>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        <div
          className="relative max-h-[65vh] overflow-y-auto rounded-sm p-2"
          style={{
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px var(--shadow-color)',
            background: 'var(--parchment)',
          }}
        >
          {isGenerating ? (
            <div className="w-64 h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="flex justify-center mb-2 animate-pulse"><FilmIcon /></div>
                <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                  Developing film…
                </p>
              </div>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt="Your photobooth strip"
              className="max-w-full max-h-[60vh] object-contain"
              style={{ imageRendering: 'crisp-edges' }}
            />
          ) : (
            <div className="w-64 h-80 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Failed to generate preview
            </div>
          )}
        </div>
      </div>

      {/* Download buttons */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleDownload('print')}
            disabled={isGenerating || isDownloading}
            className="flex flex-col items-center gap-1.5 font-display text-xs tracking-widest uppercase px-4 py-5 transition-all active:scale-95 disabled:opacity-50 rounded-sm"
            style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
          >
            <PrintIcon />
            <span>Save for Print</span>
            <span className="text-xs normal-case font-body tracking-normal" style={{ opacity: 0.65 }}>
              High-res PNG
            </span>
          </button>
          <button
            onClick={() => handleDownload('social')}
            disabled={isGenerating || isDownloading}
            className="flex flex-col items-center gap-1.5 font-display text-xs tracking-widest uppercase px-4 py-5 transition-all active:scale-95 disabled:opacity-50 rounded-sm"
            style={{ background: 'var(--sepia)', color: 'var(--cream)' }}
          >
            <ShareIcon />
            <span>Save for Social</span>
            <span className="text-xs normal-case font-body tracking-normal" style={{ opacity: 0.65 }}>
              1080×1350 PNG
            </span>
          </button>
        </div>

        <button
          onClick={onRetake}
          className="w-full flex items-center justify-center gap-2 font-display text-xs tracking-widest uppercase px-6 py-3.5 transition-all active:scale-95 rounded-sm"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--vintage-brown)',
            background: 'var(--surface)',
          }}
        >
          <RefreshIcon />
          New Session
        </button>
      </div>

      <p className="text-center text-xs flex items-center justify-center gap-1.5" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
        <LockIcon />
        Photos stay in your browser — nothing was uploaded.
      </p>
    </div>
  )
}
