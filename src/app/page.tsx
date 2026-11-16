import Nav from '@/components/Nav'
import Link from 'next/link'
import type { Metadata } from 'next'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, getSiteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: DEFAULT_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/opengraph-image'],
  },
}

const FAQS = [
  {
    q: "Is Jelly's Photobooth free and do I need an account?",
    a: "Yes. Both Solo Photobooth and Remote Duo modes are completely free to use in your browser with no sign-up, login, or watermark required.",
  },
  {
    q: 'Are my photos uploaded or stored on a server?',
    a: 'In Solo Photobooth mode, 100% of your camera frames, filters, Live Strip GIFs, and video recordings stay strictly on your device in browser memory. In Remote Duo mode, live video travels via WebRTC and session frames pass ephemerally through volatile server memory only to sync the two participants—zero photos are ever saved to a database or disk.',
  },
  {
    q: 'How does Remote Duo mode work with a friend in another location?',
    a: 'Open Remote Duo, create a private 6-character room, and share the invite link with one friend. You see each other live side by side, trigger synchronized countdown captures, co-edit filters, themes, and stickers in real time, and export Side-by-Side, Stacked, or Twin Parallel photo strips.',
  },
  {
    q: 'Can I upload my own meme stickers and create iOS Live Photo GIF strips?',
    a: 'Yes. You can upload custom PNG, JPG, GIF, or WebP meme stickers (saved locally in your browser via localStorage) and place them 1 by 1 or 4× scattered around the strip. You can also toggle Live Motion to export a looping Life4Cuts-style animated GIF strip and full-session video clip.',
  },
  {
    q: 'What export formats can I download?',
    a: 'You can save a high-resolution PNG for printing, a 1080×1350 Social PNG formatted for Instagram Stories and posts, an animated looping Live Strip (.gif), and a full-session video clip (.mp4 or .webm depending on browser codec support).',
  },
]

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

function DuoIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
      </svg>
    ),
    title: 'Interactive Pan & Zoom Framing',
    desc: 'Drag, pinch, and zoom inside every individual pose slot so every portrait sits in the perfect frame.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l7.1-1.01L12 2z"/>
      </svg>
    ),
    title: 'Strip Designs & Meme Stickers',
    desc: '9 strip themes (Y2K Checker, Gingham, Midnight Stars, Kraft), 4 border styles, drag/rotate stickers, and your own uploaded meme stickers.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"/>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>
    ),
    title: 'Virtual Booth Dispenser',
    desc: 'Watch your photo strip emerge from an interactive photobooth chute with optional mechanical print sound and close-up zoom.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/>
      </svg>
    ),
    title: 'Live Strip GIF & Video Clips',
    desc: 'Export an iOS Live Photo-style looping strip GIF—complete with your filters, themes, and stickers—plus optional session video.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
      </svg>
    ),
    title: '16 Film Filters & 22 Layouts',
    desc: 'Preview Antique, B&W, Noir, Y2K, Sunburn, and Pinky live—then arrange 2, 3, 4, or 6 poses in strips, grids, or polaroids.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Remote Duo Synchronized Booth',
    desc: 'Open a private 6-character room, invite a friend from anywhere, pose together on synchronized timers, and co-edit Side-by-Side or Twin Strips.',
  },
]

export default function HomePage() {
  const siteUrl = getSiteUrl()
  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: "How to take and customize photo strips in Jelly's Photobooth",
    description:
      'Capture, frame, decorate with stickers and themes, and export solo or Remote Duo photo strips right in your browser.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Choose Mode & Set Up',
        text: 'Pick Solo Photobooth (/photobooth) or Remote Duo (/duo), select 2, 3, 4, or 6 poses, countdown timer, and optional Live Motion.',
        url: `${siteUrl}/photobooth`,
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Capture Poses',
        text: 'Follow the countdown as your camera snaps crisp still frames plus optional burst motion frames and session video.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Customize & Add Stickers',
        text: 'Adjust pan and zoom framing per pose, apply any of 16 film filters, pick from 22 layouts and 9 strip themes, and place custom or built-in stickers.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Print & Download',
        text: 'Watch the virtual booth dispenser print your strip and download High-Res Print PNG, 1080×1350 Social PNG, Live Strip GIF, or Video.',
      },
    ],
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  return (
    <div className="min-h-screen film-grain select-none" style={{ background: 'var(--cream)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([howToJsonLd, faqJsonLd]) }}
      />
      <Nav />

      <main className="pt-14">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="stagger-children">
            <p className="font-display text-xs tracking-[0.4em] uppercase mb-4" style={{ color: 'var(--sepia)' }}>
              ✦ Browser-based · Solo &amp; Remote Duo · Free
            </p>
            <h1
              className="font-display text-4xl sm:text-6xl font-bold leading-tight tracking-tight mb-6"
              style={{ color: 'var(--vintage-brown)' }}
            >
              Capture Memories<br />in Film
            </h1>
            <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-10 font-body" style={{ color: 'var(--warm-gray)' }}>
              A vintage photobooth studio in your browser. Snap solo strips privately on your device or invite a friend into a synchronized Remote Duo room—with custom meme stickers, themed borders, virtual print dispensing, and animated Live Strip GIFs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/photobooth"
                className="inline-flex items-center justify-center gap-3 font-display text-sm tracking-widest uppercase px-8 py-5 transition-all active:scale-95 shadow-lg hover:shadow-xl w-full sm:w-auto"
                style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
              >
                <CameraIcon />
                Solo Photobooth
              </Link>
              <Link
                href="/duo"
                className="inline-flex items-center justify-center gap-3 font-display text-sm tracking-widest uppercase px-8 py-5 transition-all active:scale-95 shadow-md hover:shadow-lg w-full sm:w-auto"
                style={{ background: 'var(--surface)', color: 'var(--vintage-brown)', border: '1px solid var(--border)' }}
              >
                <DuoIcon />
                Remote Duo
              </Link>
            </div>
          </div>
        </section>

        {/* Choose Your Mode */}
        <section
          className="py-14 sm:py-16"
          style={{ background: 'var(--parchment)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <p className="font-display text-xs tracking-[0.35em] uppercase mb-2" style={{ color: 'var(--sepia)' }}>
                Two Ways to Shoot
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
                Solo Privacy or Together Anywhere
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="section-card flex flex-col justify-between gap-4">
                <div>
                  <span className="font-display text-[10px] tracking-[0.25em] uppercase" style={{ color: 'var(--sepia)' }}>
                    Mode 01 · 100% On-Device
                  </span>
                  <h3 className="font-display text-xl font-bold mt-1 mb-2" style={{ color: 'var(--vintage-brown)' }}>
                    Solo Photobooth
                  </h3>
                  <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--warm-gray)' }}>
                    Everything happens strictly inside your browser with zero server uploads. Includes optional session video recording, Live Photo GIF strips, custom sticker uploads, and virtual booth printing.
                  </p>
                </div>
                <Link
                  href="/photobooth"
                  className="inline-flex items-center justify-center gap-2 font-display text-xs tracking-widest uppercase py-3.5 px-5 rounded-sm transition-all active:scale-95"
                  style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
                >
                  <CameraIcon />
                  Enter Solo Booth
                </Link>
              </div>

              <div className="section-card flex flex-col justify-between gap-4">
                <div>
                  <span className="font-display text-[10px] tracking-[0.25em] uppercase" style={{ color: 'var(--sepia)' }}>
                    Mode 02 · Live Sync Room
                  </span>
                  <h3 className="font-display text-xl font-bold mt-1 mb-2" style={{ color: 'var(--vintage-brown)' }}>
                    Remote Duo Booth
                  </h3>
                  <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--warm-gray)' }}>
                    Create a private 6-character room link for two people. See each other live via WebRTC, shoot on one synchronized countdown, co-customize strips in real time, and export Side-by-Side, Stacked, or Twin Strips.
                  </p>
                </div>
                <Link
                  href="/duo"
                  className="inline-flex items-center justify-center gap-2 font-display text-xs tracking-widest uppercase py-3.5 px-5 rounded-sm transition-all active:scale-95"
                  style={{ background: 'var(--sepia)', color: 'var(--cream)' }}
                >
                  <DuoIcon />
                  Start Remote Duo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Studio Upgrades & Features */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-12">
            <p className="font-display text-xs tracking-[0.35em] uppercase mb-3" style={{ color: 'var(--sepia)' }}>
              Upgraded Studio Features
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
              Everything You Need to Create
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
        </section>

        {/* How it works */}
        <section
          className="py-16 sm:py-20"
          style={{ background: 'var(--parchment)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <p className="font-display text-xs tracking-[0.35em] uppercase mb-3" style={{ color: 'var(--sepia)' }}>How it works</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
                Four Simple Steps
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
              {[
                { n: '1', label: 'Set Up', desc: 'Pick Solo or Remote Duo, poses, countdown & Live Motion options' },
                { n: '2', label: 'Shoot', desc: 'Synced countdown captures crisp stills plus optional Live bursts & video' },
                { n: '3', label: 'Customize', desc: 'Tune crop/zoom, film filters, strip themes, stickers & captions' },
                { n: '4', label: 'Print & Save', desc: 'Watch the booth dispenser print and save PNG, GIF, or Video' },
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
          </div>
        </section>

        {/* Privacy, Storage & Terms Overview */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <p className="font-display text-xs tracking-[0.35em] uppercase mb-2" style={{ color: 'var(--sepia)' }}>
              Privacy &amp; Fair Use
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
              Built Transparently
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="section-card space-y-3">
              <h3 className="font-display text-sm font-bold tracking-wider uppercase" style={{ color: 'var(--vintage-brown)' }}>
                Privacy Policy Highlights
              </h3>
              <ul className="space-y-2 text-sm font-body leading-relaxed" style={{ color: 'var(--warm-gray)' }}>
                <li>• <strong>Solo Mode stays on-device:</strong> photos, Live GIF bursts, and optional video clips stay strictly in browser memory.</li>
                <li>• <strong>Custom Stickers &amp; Theme:</strong> uploaded meme stickers and dark/light mode are saved locally in your browser&apos;s <code className="font-mono text-xs">localStorage</code> only.</li>
                <li>• <strong>Ephemeral Remote Duo:</strong> partner video streams via WebRTC; room frames and synced edits pass temporarily through volatile server memory with zero database/disk storage and auto-expire.</li>
              </ul>
              <div className="pt-1">
                <Link
                  href="/privacy"
                  className="font-display text-xs tracking-widest uppercase underline"
                  style={{ color: 'var(--sepia)' }}
                >
                  Read Full Privacy Policy →
                </Link>
              </div>
            </div>

            <div className="section-card space-y-3">
              <h3 className="font-display text-sm font-bold tracking-wider uppercase" style={{ color: 'var(--vintage-brown)' }}>
                Terms of Use Highlights
              </h3>
              <ul className="space-y-2 text-sm font-body leading-relaxed" style={{ color: 'var(--warm-gray)' }}>
                <li>• <strong>Consent First:</strong> always obtain consent from anyone photographed in Solo sessions or invited into a Remote Duo room.</li>
                <li>• <strong>Your Creations:</strong> you own your exported strips, GIFs, and videos, and confirm you hold rights to any custom meme stickers you upload.</li>
                <li>• <strong>Private Room Links:</strong> keep your 6-character Duo code private with people you intend to shoot with.</li>
              </ul>
              <div className="pt-1">
                <Link
                  href="/terms"
                  className="font-display text-xs tracking-widest uppercase underline"
                  style={{ color: 'var(--sepia)' }}
                >
                  Read Full Terms of Use →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* AEO / GEO Frequently Asked Questions */}
        <section
          className="py-16"
          style={{ background: 'var(--parchment)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <p className="font-display text-xs tracking-[0.35em] uppercase mb-2" style={{ color: 'var(--sepia)' }}>
                Quick Answers
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: 'var(--vintage-brown)' }}>
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <article key={q} className="section-card">
                  <h3 className="font-display text-base font-bold mb-1.5" style={{ color: 'var(--vintage-brown)' }}>
                    {q}
                  </h3>
                  <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--warm-gray)' }}>
                    {a}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center px-4 pb-16 sm:pb-24">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/photobooth"
              className="inline-flex items-center justify-center gap-3 font-display text-sm tracking-widest uppercase px-8 py-5 transition-all active:scale-95 shadow-lg w-full sm:w-auto"
              style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
            >
              <CameraIcon />
              Solo Photobooth
            </Link>
            <Link
              href="/duo"
              className="inline-flex items-center justify-center gap-3 font-display text-sm tracking-widest uppercase px-8 py-5 transition-all active:scale-95 shadow-md w-full sm:w-auto"
              style={{ background: 'var(--surface)', color: 'var(--vintage-brown)', border: '1px solid var(--border)' }}
            >
              <DuoIcon />
              Try Remote Duo
            </Link>
          </div>
          <p className="mt-4 text-xs font-body" style={{ color: 'var(--text-muted)' }}>
            No account required. Capture solo or pose together from anywhere.
          </p>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--parchment)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--warm-gray)' }}>
            ✦ Jelly&apos;s Photobooth | developed by <a href="https://akaizer.vercel.app/" className="underline hover:text-[var(--vintage-brown)] transition-colors">Angela Gardan</a>
          </p>
          <div className="flex gap-6 font-display text-xs tracking-widest uppercase" style={{ color: 'var(--warm-gray)', opacity: 0.7 }}>
            <Link href="/photobooth" className="hover:opacity-100 transition-opacity">Solo Booth</Link>
            <Link href="/duo" className="hover:opacity-100 transition-opacity">Remote Duo</Link>
            <Link href="/privacy" className="hover:opacity-100 transition-opacity">Privacy</Link>
            <Link href="/terms" className="hover:opacity-100 transition-opacity">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
