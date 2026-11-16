import Nav from '@/components/Nav'
import Link from 'next/link'
import type { Metadata } from 'next'

const title = "Privacy Policy | Jelly's Photobooth"
const description =
  "Learn how Jelly's Photobooth keeps Solo Mode 100% browser-local and handles ephemeral WebRTC/WebSocket memory for Remote Duo rooms without accounts."

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    type: 'website',
    url: '/privacy',
    title,
    description,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/opengraph-image'],
  },
}

export default function PrivacyPage() {
  const lastUpdated = 'November 16, 2026'
  const sections = [
    {
      title: '1. Overview',
      body: "Jelly's Photobooth (\"the App\") provides two distinct photobooth experiences: Solo Photobooth (/photobooth), which runs entirely inside your web browser with zero server uploads, and Remote Duo (/duo), which connects two invited participants over an ephemeral real-time room. We do not require accounts, sign-ups, or persistent tracking profiles.",
    },
    {
      title: '2. Camera, Microphone & Session Media (Solo Mode)',
      body: 'In Solo Photobooth mode, camera access is used strictly to preview your live viewfinder and capture photos inside browser memory. If you enable optional Live Motion & Video Recording or Microphone Audio, burst frames, MediaRecorder video clips (.mp4 or .webm), and animated Live Strip GIFs are processed entirely on your device. Nothing from Solo Mode is transmitted to or stored on any server; all temporary Blob URLs and images are discarded when you start a new session or close the tab.',
    },
    {
      title: '3. Remote Duo Ephemeral Rooms (/duo)',
      body: 'When you explicitly create or join a Remote Duo room, the server holds volatile in-memory state solely to match your 6-character room code, synchronize countdown timers, relay WebRTC connection handshakes (using public STUN servers), relay fallback video frames if peer-to-peer UDP is blocked by a firewall, sync strip customization edits, and deliver each pose photo between the two participants. Nothing is saved to a database or written to disk, and all room memory is automatically purged when participants leave or after 45 minutes of inactivity.',
    },
    {
      title: '4. Local Storage & Browser Persistence',
      body: 'The App uses your browser’s localStorage only to remember your Light/Dark appearance theme and your custom uploaded stickers ("My Stickers") so you do not have to re-upload meme images across sessions. In Remote Duo mode, sessionStorage stores a temporary random participant ID so brief connection blips reconnect cleanly. You can clear custom stickers individually in the Sticker Editor or via browser site data settings at any time.',
    },
    {
      title: '5. Data We Do Not Collect',
      body: 'We do not operate user accounts, analytics dashboards, advertising pixels, behavioral tracking cookies, or persistent media storage. We do not sell, archive, or index your photos, videos, audio, or stickers.',
    },
    {
      title: '6. Third-Party Services & Built-In Assets',
      body: 'The App loads typography from Google Fonts (Playfair Display and Crimson Text), serves built-in decorative sticker files from the App’s static public directory, and uses standard STUN servers (stun.l.google.com) solely during Remote Duo sessions to negotiate peer-to-peer WebRTC connections.',
    },
    {
      title: '7. Revoking Permissions',
      body: 'You may revoke camera or microphone permissions at any moment through your browser’s site permissions menu. Camera and microphone tracks are released immediately when you finish shooting, leave a room, or close the page.',
    },
    {
      title: '8. Children’s Privacy',
      body: 'The App collects no personal account data or persistent user profiles. Parents and guardians should supervise minors when granting camera/microphone permissions or sharing private Remote Duo room invite links.',
    },
  ]

  return (
    <div className="min-h-screen select-none film-grain" style={{ background: 'var(--cream)' }}>
      <Nav />
      <main className="pt-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-10">
            <p className="font-display text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--sepia)' }}>Legal</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold" style={{ color: 'var(--vintage-brown)' }}>Privacy Policy</h1>
            <p className="text-sm mt-2" style={{ color: 'var(--warm-gray)' }}>Last updated: {lastUpdated}</p>
          </div>

          <div
            className="space-y-8 font-body leading-relaxed"
            style={{
              background: 'var(--aged-white)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              padding: '2rem',
              boxShadow: '0 2px 8px var(--shadow-color)',
            }}
          >
            {sections.map(({ title, body }) => (
              <section key={title}>
                <h2 className="font-display text-lg font-bold tracking-wide mb-3" style={{ color: 'var(--vintage-brown)' }}>{title}</h2>
                <p style={{ color: 'var(--warm-gray)' }}>{body}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-6">
            <Link
              href="/"
              className="font-display text-xs tracking-widest uppercase transition-colors text-[var(--warm-gray)] hover:text-[var(--vintage-brown)]"
            >
              ← Back to Home
            </Link>
            <Link
              href="/terms"
              className="font-display text-xs tracking-widest uppercase transition-colors text-[var(--sepia)] hover:text-[var(--vintage-brown)]"
            >
              Terms of Use →
            </Link>
          </div>
        </div>

        <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--parchment)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--warm-gray)' }}>
              ✦ Jelly&apos;s Photobooth | developed by <a href="https://akaizer.vercel.app/" className="underline hover:text-[var(--vintage-brown)] transition-colors">Angela Gardan</a>
            </p>
            <div className="flex gap-6 font-display text-xs tracking-widest uppercase" style={{ color: 'var(--warm-gray)', opacity: 0.7 }}>
              <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link>
              <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
