import Nav from '@/components/Nav'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Vintage Photobooth',
}

export default function PrivacyPage() {
  const lastUpdated = 'February 23, 2026'
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

          <div className="space-y-8 font-body leading-relaxed" style={{ background: 'var(--aged-white)', border: '1px solid var(--border)', borderRadius: '2px', padding: '2rem', boxShadow: '0 2px 8px var(--shadow-color)' }}>
            {[
              { title: '1. Overview', body: 'Vintage Photobooth ("the App") is a client-side web application that runs entirely within your web browser. We are committed to your privacy and have designed the App so that no personal data, images, or information is ever transmitted to or stored on any server.' },
              { title: '2. Camera & Images', body: 'The App requests access to your device\'s camera solely to capture photos for the photobooth experience. All image processing happens locally in your browser using HTML Canvas and WebAPI. No photos are uploaded, transmitted, or stored on any remote server. Photos exist only in your browser\'s memory during your session and are discarded when you close the page.' },
              { title: '3. Data We Do Not Collect', body: 'We do not collect personal identification information, photos or images, usage analytics, device identifiers, cookies or tracking pixels, or IP addresses. The App is fully offline-capable once loaded.' },
              { title: '4. Local Storage', body: 'The App uses localStorage only to save your dark/light mode preference. No photos, session data, or personal information is ever stored persistently.' },
              { title: '5. Third-Party Services', body: 'The App loads fonts from Google Fonts (Playfair Display and Crimson Text). This is the only external network request made by the application. No other third-party services, analytics tools, or advertising networks are used.' },
              { title: '6. Camera Permissions', body: 'You can revoke camera access at any time through your browser\'s settings. The App will cease functioning for photo capture once permissions are revoked. You can also refresh the page to end a session and release all camera resources.' },
              { title: '7. Children\'s Privacy', body: 'Given that we collect no personal data of any kind, the App is safe for use by individuals of all ages. We recommend that parents supervise children when granting camera permissions on any website.' },
              { title: '8. Contact', body: 'If you have any questions about this privacy policy or the App\'s data practices, you are welcome to reach out. As the App collects no data, we have nothing to provide, delete, or correct — but we are happy to clarify anything in this document.' },
            ].map(({ title, body }) => (
              <section key={title}>
                <h2 className="font-display text-lg font-bold tracking-wide mb-3" style={{ color: 'var(--vintage-brown)' }}>{title}</h2>
                <p style={{ color: 'var(--warm-gray)' }}>{body}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link 
  href="/" 
  className="font-display text-xs tracking-widest uppercase transition-colors text-[var(--warm-gray)] hover:text-[var(--vintage-brown)]"
>
  ← Back to Home
</Link>
          </div>
        </div>

        <footer style={{ borderTop: '1px solid var(--border)', background: 'var(--parchment)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="font-display text-xs tracking-widest uppercase" style={{ color: 'var(--warm-gray)' }}>✦ Vintage Photobooth</p>
            <div className="flex gap-6 font-display text-xs tracking-widest uppercase" style={{ color: 'var(--warm-gray)', opacity: 0.6 }}>
              <Link href="/privacy" style={{ color: 'inherit' }}>Privacy</Link>
              <Link href="/terms" style={{ color: 'inherit' }}>Terms</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
