import Nav from '@/components/Nav'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jelly Photobooth — Capture Memories in Film',
  description: 'A beautiful vintage-style photobooth that runs entirely in your browser. No uploads, no accounts, just timeless photos.',
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Fully Private',
    desc: 'Everything runs in your browser. No uploads, no servers, no accounts.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
      </svg>
    ),
    title: '16 Film Filters',
    desc: 'Choose from sepia, noir, dreamy, grain, and more — applied live.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
        <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
      </svg>
    ),
    title: 'Multiple Layouts',
    desc: 'Classic strips, film strips, polaroids, grids, diagonal — pick your style.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    title: 'Instant Download',
    desc: 'Export high-res PNG for print or a 1080×1350 version for Instagram.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen film-grain select-none" style={{ background: 'var(--cream)' }}>
      <Nav />

      <main className="pt-14">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="stagger-children">
            <p className="font-display text-xs tracking-[0.4em] uppercase mb-4" style={{ color: 'var(--sepia)' }}>
              ✦ Browser-based · No signup · Free
            </p>
            <h1
              className="font-display text-4xl sm:text-6xl font-bold leading-tight tracking-tight mb-6"
              style={{ color: 'var(--vintage-brown)' }}
            >
              Capture Memories<br />in Film
            </h1>
            <p className="text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10 font-body" style={{ color: 'var(--warm-gray)' }}>
              A beautiful vintage photobooth that lives entirely in your browser. Take photos, apply film filters, choose a layout, and download your strip — no sign-up required.
            </p>
            <Link
              href="/photobooth"
              className="inline-flex items-center gap-3 font-display text-sm tracking-widest uppercase px-8 py-5 transition-all active:scale-95 shadow-lg hover:shadow-xl"
              style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
            >
              <CameraIcon />
              Open Photobooth
            </Link>
          </div>
        </section>

        {/* Features */}
        <section
          className="py-16 sm:py-20"
          style={{ background: 'var(--parchment)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="font-display text-xs tracking-[0.35em] uppercase mb-3" style={{ color: 'var(--sepia)' }}>Features</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
                Everything You Need
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {features.map(({ icon, title, desc }) => (
                <div key={title} className="section-card flex gap-4">
                  <div
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-sm mt-0.5"
                    style={{ background: 'var(--parchment)', color: 'var(--sepia)' }}
                  >
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold tracking-wide mb-1" style={{ color: 'var(--vintage-brown)' }}>{title}</h3>
                    <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--warm-gray)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-12">
            <p className="font-display text-xs tracking-[0.35em] uppercase mb-3" style={{ color: 'var(--sepia)' }}>How it works</p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
              Four Simple Steps
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {[
              { n: '1', label: 'Set Up', desc: 'Choose poses, countdown, and a starting filter' },
              { n: '2', label: 'Shoot', desc: 'Camera runs automatically with countdown' },
              { n: '3', label: 'Customize', desc: 'Adjust filter, pick a layout, add a caption' },
              { n: '4', label: 'Download', desc: 'Save high-res PNG for print or social' },
            ].map(({ n, label, desc }) => (
              <div key={n} className="text-center section-card">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'var(--vintage-brown)' }}
                >
                  <span className="font-display font-bold text-sm" style={{ color: 'var(--cream)' }}>{n}</span>
                </div>
                <h3 className="font-display text-sm font-bold mb-1" style={{ color: 'var(--vintage-brown)' }}>{label}</h3>
                <p className="text-xs font-body leading-relaxed" style={{ color: 'var(--warm-gray)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center px-4 pb-16 sm:pb-24">
          <Link
            href="/photobooth"
            className="inline-flex items-center gap-3 font-display text-sm tracking-widest uppercase px-8 py-5 transition-all active:scale-95 shadow-lg"
            style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
          >
            <CameraIcon />
            Get Started — It&apos;s Free
          </Link>
          <p className="mt-4 text-xs font-body" style={{ color: 'var(--text-muted)' }}>
            No account. No uploads. Just photos.
          </p>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--parchment)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--warm-gray)' }}>
            ✦ Jelly's Photobooth | developed by <a href="https://akaizer.vercel.app/" className="underline hover:text-[var(--vintage-brown)] transition-colors">Angela Gardan</a>
          </p>
          <div className="flex gap-6 font-display text-xs tracking-widest uppercase" style={{ color: 'var(--warm-gray)', opacity: 0.6 }}>
            <Link href="/privacy" className="hover:opacity-100 transition-opacity">Privacy</Link>
            <Link href="/terms" className="hover:opacity-100 transition-opacity">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
