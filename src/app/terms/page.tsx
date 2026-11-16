import Nav from '@/components/Nav'
import Link from 'next/link'
import type { Metadata } from 'next'

const title = "Terms of Use | Jelly's Photobooth"
const description =
  "Read the Terms of Use for Jelly's Photobooth covering Solo and Remote Duo sessions, participant consent, custom sticker uploads, and media exports."

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    type: 'website',
    url: '/terms',
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

export default function TermsPage() {
  const lastUpdated = 'November 16, 2026'
  const sections = [
    {
      title: '1. Acceptance of Terms',
      body: "By accessing or using Jelly's Photobooth (\"the App\"), including Solo Photobooth and Remote Duo modes, you agree to these Terms of Use. If you do not agree with these terms, please discontinue use of the App.",
    },
    {
      title: '2. Description of Service',
      body: "Jelly's Photobooth is a free, browser-based photobooth application offering client-side film filters, multi-pose strip layouts, interactive crop and zoom framing, themed backgrounds and borders, customizable sticker overlays, virtual dispenser printing, optional Live Strip GIF and session video exports, and optional synchronized two-person Remote Duo rooms.",
    },
    {
      title: '3. Permitted Use',
      body: 'You may use the App for personal, creative, and non-commercial photography; capturing solo strips or consented group and Remote Duo sessions; customizing strips with built-in or self-uploaded stickers; and saving or sharing your exported PNG, GIF, or video files for personal enjoyment and events.',
    },
    {
      title: '4. User-Uploaded Stickers & Custom Content',
      body: 'When uploading meme images or custom stickers into the Sticker Editor, you represent that you own the image or hold the necessary permission to use it. Custom stickers are stored only within your local browser storage, and you are solely responsible for any imagery you place onto exported strips or share inside a Remote Duo room.',
    },
    {
      title: '5. Remote Duo Rooms & Participant Consent',
      body: 'Before capturing photos or starting a synchronized Remote Duo session with another person, you must obtain their clear consent. Keep 6-character room codes and invite links private to intended participants. Because Remote Duo runs strictly in volatile memory without server backups, sessions will be lost if all participants disconnect or when a room expires.',
    },
    {
      title: '6. Prohibited Use',
      body: 'You may not use the App to record, photograph, or transmit images of any individual without their consent; share unlawful, abusive, harassing, or infringing media in Remote Duo rooms; attempt to disrupt room signaling or abuse WebSocket endpoints; or redistribute/resell the App without authorization.',
    },
    {
      title: '7. Intellectual Property',
      body: "The App's interface, visual design, built-in sticker artwork, and source code remain protected intellectual property. You retain ownership of the photographs, strips, Live GIFs, and video recordings you capture using the App.",
    },
    {
      title: '8. Media Codec & Hardware Availability',
      body: 'Video recording formats (.mp4 / .webm), audio capture, camera resolution, WebRTC peer connectivity, and GIF encoding performance depend on your device hardware, browser permissions, and network firewall rules. Optional live/video features may gracefully degrade or be unavailable on unsupported browsers.',
    },
    {
      title: '9. Disclaimer of Warranties & Limitation of Liability',
      body: 'The App is provided "as is" and "as available" without warranties of any kind. To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from lost unsaved sessions, network interruptions in Remote Duo rooms, or device permission issues.',
    },
    {
      title: '10. Changes to Terms',
      body: 'We may update these Terms of Use as new features are introduced. Continued use of the App after revisions are published constitutes acceptance of the updated terms indicated by the date at the top of this page.',
    },
  ]

  return (
    <div className="min-h-screen select-none film-grain" style={{ background: 'var(--cream)' }}>
      <Nav />
      <main className="pt-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-10">
            <p className="font-display text-xs tracking-[0.3em] uppercase mb-3" style={{ color: 'var(--sepia)' }}>Legal</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold" style={{ color: 'var(--vintage-brown)' }}>Terms of Use</h1>
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
              href="/privacy"
              className="font-display text-xs tracking-widest uppercase transition-colors text-[var(--sepia)] hover:text-[var(--vintage-brown)]"
            >
              Privacy Policy →
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
