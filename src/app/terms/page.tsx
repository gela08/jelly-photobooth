import Nav from '@/components/Nav'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use — Vintage Photobooth',
}

export default function TermsPage() {
  const lastUpdated = 'February 23, 2026'
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

          <div className="space-y-8 font-body leading-relaxed" style={{ background: 'var(--aged-white)', border: '1px solid var(--border)', borderRadius: '2px', padding: '2rem', boxShadow: '0 2px 8px var(--shadow-color)' }}>
            {[
              { title: '1. Acceptance of Terms', body: 'By using Vintage Photobooth ("the App"), you agree to these Terms of Use. If you do not agree with these terms, please do not use the App. These terms apply to all visitors and users of the App.' },
              { title: '2. Description of Service', body: 'Vintage Photobooth is a free, browser-based photobooth application that allows users to take photos using their device\'s camera, apply vintage-style filters, arrange photos into layouts, and download the results. The App operates entirely client-side with no server-side processing of user data or images.' },
              { title: '3. Permitted Use', body: 'You may use the App for personal, non-commercial photography and creative use; taking photos of yourself or others with their consent; creating and sharing photobooth strips for personal enjoyment; and events, parties, and social gatherings.' },
              { title: '4. Prohibited Use', body: 'You may not use the App to capture images of individuals without their consent; create, distribute, or store illegal content of any kind; attempt to circumvent browser security or permission models; use the App in any way that violates applicable laws or regulations; or reproduce, copy, or resell the App without permission.' },
              { title: '5. Intellectual Property', body: 'The App\'s design, code, and visual elements are protected intellectual property. Photos you take using the App belong to you. You are responsible for ensuring you have the right to photograph any individuals in your sessions and to use those images as you see fit.' },
              { title: '6. Consent to be Photographed', body: 'You are solely responsible for obtaining the consent of any individuals you photograph using the App. By using the App to capture photos of others, you represent that you have obtained all necessary consents and that your use of those images complies with all applicable privacy laws and regulations.' },
              { title: '7. Disclaimer of Warranties', body: 'The App is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the App will be uninterrupted, error-free, or compatible with all browsers and devices. Camera availability depends on your device hardware and browser permissions.' },
              { title: '8. Limitation of Liability', body: 'To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App, including but not limited to loss of photos, failure to capture or download images, or camera permission issues.' },
              { title: '9. Changes to Terms', body: 'We reserve the right to update these Terms of Use at any time. Continued use of the App after changes are posted constitutes your acceptance of the revised terms. The date of the most recent revision is indicated at the top of this page.' },
              { title: '10. Governing Law', body: 'These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the appropriate courts.' },
            ].map(({ title, body }) => (
              <section key={title}>
                <h2 className="font-display text-lg font-bold tracking-wide mb-3" style={{ color: 'var(--vintage-brown)' }}>{title}</h2>
                <p style={{ color: 'var(--warm-gray)' }}>{body}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="font-display text-xs tracking-widest uppercase transition-colors" style={{ color: 'var(--warm-gray)' }}>
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
