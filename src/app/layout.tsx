import type { Metadata } from 'next'
import { Playfair_Display, Crimson_Text } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme'

const siteUrl = 'https://jelly-photobooth.vercel.app/'

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
  title: {
    default: "Jelly's Photobooth | Vintage-style photobooth by Angela Gardan",
    template: "%s | Angela Gardan",
  },

  description: 'A beautiful vintage-style photobooth that runs entirely in your browser. No uploads, no accounts, just timeless photos.',

  keywords: [
    "Jelly Photobooth",
    "Angela Gardan", 
    "Jelly's Photobooth", 
    "Jelly Vintage Photobooth", 
    "Photobooth App", 
    "Photobooth Website", 
    "Free Photobooth", 
    "Online Free Photobooth",
    "Online Photobooth", 
    "Vintage Photobooth",
    "Film Photobooth", 
    "Jelly",
    "jelly app",
    "jelly photobooth app",
    "jelly photobooth website",
    "jelly vintage photobooth",
    "jelly film photobooth",
  ],

  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Jelly's Photobooth",
    description: 'Developed by Angela Gardan. Capture memories in film — right in your browser.',
    siteName: "Jelly's Photobooth",
    images: [
      {
        url: '/icon.png', 
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