import Link from 'next/link'
import { ArrowLeft, Camera, Layers, Sparkles, Users, Wrench } from 'lucide-react'
import Nav from '@/components/Nav'

const UPGRADE_HIGHLIGHTS = [
  {
    icon: Users,
    title: 'Private 6-Character Invite Rooms',
    desc: 'Shareable one-click room codes so two friends can pose together from anywhere.',
  },
  {
    icon: Sparkles,
    title: 'Synchronized Live Countdown & Cameras',
    desc: 'Low-latency live partner preview and synchronized shutter capture across devices.',
  },
  {
    icon: Layers,
    title: 'Side-by-Side, Stacked & Twin Strips',
    desc: 'Co-edited filters, custom strip colors, meme stickers, and animated Live Strip GIFs.',
  },
]

export default function DuoComingSoon() {
  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden film-grain select-none"
      style={{ background: 'var(--cream)' }}
    >
      <Nav />

      <main className="flex-1 pt-14 flex items-center">
        <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center mb-10">
            <div
              className="w-12 h-12 rounded-sm mx-auto mb-5 flex items-center justify-center"
              style={{
                background: 'var(--parchment)',
                border: '1px solid var(--border)',
                color: 'var(--sepia)',
              }}
            >
              <Wrench size={20} strokeWidth={1.7} />
            </div>

            <p
              className="font-display text-xs tracking-[0.35em] uppercase mb-3"
              style={{ color: 'var(--sepia)' }}
            >
              Under Construction · Coming Soon
            </p>

            <h1
              className="font-display text-3xl sm:text-5xl font-bold leading-tight tracking-tight mb-4"
              style={{ color: 'var(--vintage-brown)', textWrap: 'balance' }}
            >
              Remote Duo is Upgrading
            </h1>

            <p
              className="font-body text-base sm:text-lg leading-relaxed max-w-xl mx-auto"
              style={{ color: 'var(--warm-gray)' }}
            >
              We&apos;re currently upgrading the real-time multi-device server infrastructure for Remote Duo rooms. While we finish tuning it, Solo Photobooth is fully live with all 32 layouts, 25+ strip colors &amp; custom color tinting, meme stickers, and Live GIF strips.
            </p>
          </div>

          <div className="section-card mb-8 divide-y" style={{ borderColor: 'var(--border)' }}>
            {UPGRADE_HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 py-4 first:pt-1 last:pb-1"
                style={{ borderColor: 'var(--border)' }}
              >
                <div
                  className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'var(--parchment)', color: 'var(--sepia)' }}
                >
                  <Icon size={17} strokeWidth={1.7} />
                </div>
                <div>
                  <h2
                    className="font-display text-sm font-bold tracking-wide mb-0.5"
                    style={{ color: 'var(--vintage-brown)' }}
                  >
                    {title}
                  </h2>
                  <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--warm-gray)' }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/photobooth"
              className="inline-flex items-center justify-center gap-2.5 font-display text-xs tracking-widest uppercase px-8 py-4 rounded-sm transition-all active:scale-95 shadow-lg hover:shadow-xl w-full sm:w-auto whitespace-nowrap"
              style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
            >
              <Camera size={16} strokeWidth={1.8} />
              Open Solo Photobooth
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 font-display text-xs tracking-widest uppercase px-6 py-4 rounded-sm transition-all active:scale-95 w-full sm:w-auto whitespace-nowrap"
              style={{
                background: 'var(--surface)',
                color: 'var(--vintage-brown)',
                border: '1px solid var(--border)',
              }}
            >
              <ArrowLeft size={15} strokeWidth={1.8} />
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--parchment)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--warm-gray)' }}>
            ✦ Jelly&apos;s Photobooth | developed by{' '}
            <a
              href="https://akaizer.vercel.app/"
              className="underline hover:text-[var(--vintage-brown)] transition-colors"
            >
              Angela Gardan
            </a>
          </p>
          <div
            className="flex gap-6 font-display text-xs tracking-widest uppercase"
            style={{ color: 'var(--warm-gray)', opacity: 0.75 }}
          >
            <Link href="/photobooth" className="hover:opacity-100 transition-opacity">
              Solo Booth
            </Link>
            <Link href="/privacy" className="hover:opacity-100 transition-opacity">
              Privacy
            </Link>
            <Link href="/terms" className="hover:opacity-100 transition-opacity">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
