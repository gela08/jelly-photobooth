'use client'; // This is the magic fix

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/theme'

interface NavProps {
  insideBooth?: boolean
  onLeaveConfirm?: () => void
}

const BaseLinks = [
  { href: '/', label: 'Home' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
]

function FilmIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
      <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
      <line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/>
      <line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/>
      <line x1="17" y1="7" x2="22" y2="7"/>
    </svg>
  )
}
function CameraIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}
function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
function ArrowRightIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}
function AlertTriangleIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

// ── Leave Confirmation Modal ──────────────────────────────────────────────────
// FIX: onConfirm calls router.push(destination) — not Link — so navigation actually happens
function LeaveModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in select-none"
      style={{ background: 'rgba(26,20,16,0.80)', backdropFilter: 'blur(5px)' }}
      onClick={onCancel}
    >
      <div
        className="animate-scale-in rounded-sm p-8 max-w-sm w-full text-center"
        style={{
          background: 'var(--aged-white)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4" style={{ color: 'var(--sepia)' }}>
          <AlertTriangleIcon />
        </div>
        <h3 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--vintage-brown)' }}>
          Leave Without Saving?
        </h3>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
          You have unsaved progress. If you leave now, your photos and settings will be lost.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 font-display text-xs tracking-widest uppercase py-3.5 rounded-sm transition-all active:scale-95"
            style={{ border: '1px solid var(--border)', color: 'var(--vintage-brown)', background: 'var(--surface)' }}
          >
            Stay Here
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 font-display text-xs tracking-widest uppercase py-3.5 rounded-sm transition-all active:scale-95"
            style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Nav({ insideBooth = false, onLeaveConfirm }: NavProps) {
  const [open, setOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  // FIX: store the destination we want to navigate to after confirm
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => { setOpen(false) }, [])

  useEffect(() => {
    document.body.style.overflow = open || leaveTarget ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open, leaveTarget])

  // Intercept clicks when inside booth — store destination & show modal
  const handleProtectedClick = (e: React.MouseEvent, href: string) => {
    if (insideBooth) {
      e.preventDefault()
      setLeaveTarget(href)
      setOpen(false)
    }
  }

  // FIX: confirmed → call router.push with the stored destination
  const handleLeaveConfirm = () => {
    const dest = leaveTarget
    setLeaveTarget(null)
    onLeaveConfirm?.()
    if (dest) router.push(dest)
  }

  const handleLeaveCancel = () => setLeaveTarget(null)

  return (
    <>
      {/* Leave Modal */}
      {leaveTarget && (
        <LeaveModal onConfirm={handleLeaveConfirm} onCancel={handleLeaveCancel} />
      )}

      <nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md"
        style={{ background: 'rgba(var(--cream-rgb, 245,240,232),0.97)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

          {/* Logo */}
          {insideBooth ? (
            <button
              onClick={() => setLeaveTarget('/')}
              className="flex items-center gap-2 font-display tracking-widest text-xs uppercase font-bold transition-opacity hover:opacity-70"
              style={{ color: 'var(--vintage-brown)' }}
            >
              <span style={{ color: 'var(--sepia)' }}><FilmIcon /></span>
              <span className="hidden sm:inline">Jelly's Photobooth</span>
              <span className="sm:hidden">Jelly's PB</span>
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 font-display tracking-widest text-xs uppercase font-bold transition-opacity hover:opacity-70"
              style={{ color: 'var(--vintage-brown)' }}
            >
              <span style={{ color: 'var(--sepia)' }}><FilmIcon /></span>
              <span className="hidden sm:inline">Jelly's Photobooth</span>
              <span className="sm:hidden">Jelly's PB</span>
            </Link>
          )}

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-5">
            {BaseLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={insideBooth ? '#' : href}
                onClick={(e) => handleProtectedClick(e, href)}
                className="font-display text-xs tracking-widest uppercase transition-colors duration-150"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--vintage-brown)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {label}
              </Link>
            ))}

            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="flex items-center justify-center w-8 h-8 rounded-sm transition-all active:scale-90"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {insideBooth ? (
              <button
                onClick={() => setLeaveTarget('/photobooth')}
                className="flex items-center gap-1.5 font-display text-xs tracking-widest uppercase px-4 py-2 rounded-sm transition-all active:scale-95"
                style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
              >
                <CameraIcon />
                <span>Open Booth</span>
              </button>
            ) : (
              <Link
                href="/photobooth"
                className="flex items-center gap-1.5 font-display text-xs tracking-widest uppercase px-4 py-2 rounded-sm transition-all active:scale-95"
                style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
              >
                <CameraIcon />
                <span>Open Booth</span>
              </Link>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="flex items-center justify-center w-8 h-8 rounded-sm"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)', background: 'var(--surface)' }}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="flex items-center justify-center w-9 h-9 rounded-sm transition-all active:scale-90"
              style={{ color: 'var(--vintage-brown)', border: '1px solid var(--border)', background: 'var(--surface)' }}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          style={{ background: 'rgba(26,20,16,0.4)', backdropFilter: 'blur(2px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed top-14 left-0 right-0 z-50 sm:hidden animate-slide-down"
          style={{
            background: 'var(--cream)',
            borderBottom: '1px solid var(--border)',
            boxShadow: '0 8px 32px var(--shadow-color)',
          }}
        >
          <div className="px-4 py-4 space-y-1">
            {BaseLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={insideBooth ? '#' : href}
                onClick={(e) => {
                  handleProtectedClick(e, href)
                  if (!insideBooth) setOpen(false)
                }}
                className="flex items-center justify-between font-display text-sm tracking-widest uppercase py-3 px-4 rounded-sm transition-all"
                style={{ color: 'var(--text-secondary)', border: '1px solid transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-3)'
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.borderColor = 'transparent'
                }}
              >
                <span>{label}</span>
                <ArrowRightIcon />
              </Link>
            ))}

            <div className="pt-2">
              {insideBooth ? (
                <button
                  onClick={() => { setOpen(false); setLeaveTarget('/photobooth') }}
                  className="flex items-center justify-center gap-2 w-full font-display text-sm tracking-widest uppercase py-4 rounded-sm transition-all active:scale-95"
                  style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                >
                  <CameraIcon />
                  Open Photobooth
                </button>
              ) : (
                <Link
                  href="/photobooth"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 w-full font-display text-sm tracking-widest uppercase py-4 rounded-sm transition-all active:scale-95"
                  style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                >
                  <CameraIcon />
                  Open Photobooth
                </Link>
              )}
            </div>

            <div
              className="flex items-center justify-between py-3 px-1 mt-2"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <span className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                Dark Mode
              </span>
              <button
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                className={`toggle-track ${theme === 'dark' ? 'on' : ''}`}
              >
                <div className="toggle-thumb" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
