import type { Metadata } from 'next'
import { Playfair_Display, Crimson_Text } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const crimson = Crimson_Text({
  subsets: ['latin'],
  variable: '--font-crimson',
  weight: ['400', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Jelly's Photobooth — Capture Memories in Film",
  description: 'A beautiful vintage-style photobooth that runs entirely in your browser. No uploads, no accounts, just timeless photos.',
  keywords: ['photobooth', 'vintage', 'photo', 'camera', 'film'],
  openGraph: {
    title: "Jelly's Photobooth",
    description: 'Capture memories in film — right in your browser.',
    type: 'website',
    siteName: "Jelly's Photobooth",
    images: [
      {
        url: '/jelly-pb.png', 
        width: 1200,
        height: 630,
        alt: "Jelly's Photobooth Preview",
      },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${crimson.variable}`}>
      <body className="bg-cream min-h-screen font-body antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
