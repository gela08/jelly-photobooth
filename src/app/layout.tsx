import type { Metadata } from 'next'
import { Playfair_Display, Crimson_Text } from 'next/font/google'
import { ThemeProvider } from '@/lib/theme'
import {
  CREATOR_NAME,
  CREATOR_URL,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  SITE_NAME,
  getSiteUrl,
} from '@/lib/seo'
// Ignore TS error for side-effect CSS import in Next.js app directory
// @ts-ignore: Importing global CSS for Next.js layout
import './globals.css'

const siteUrl = getSiteUrl()

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
  metadataBase: new URL(siteUrl),
  title: {
    default: DEFAULT_TITLE,
    template: `%s`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: CREATOR_NAME, url: CREATOR_URL }],
  creator: CREATOR_NAME,
  publisher: CREATOR_NAME,
  keywords: [
    "Jelly's Photobooth",
    'Jelly Photobooth',
    'Online Photobooth',
    'Free Vintage Photobooth',
    'Remote Duo Photobooth',
    'Online Couple Photobooth',
    'Life4Cuts Online',
    'Photo Strip Maker',
    'Live Photo GIF Strip',
    'Meme Sticker Photobooth',
    'Film Photobooth App',
    'Angela Gardan',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: "Jelly's Photobooth — Vintage Solo & Remote Duo Booth",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/opengraph-image'],
  },
  manifest: '/manifest.webmanifest',
}

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  alternateName: 'Jelly Photobooth',
  url: siteUrl,
  applicationCategory: 'MultimediaApplication',
  applicationSubCategory: 'Photobooth & Photo Strip Studio',
  operatingSystem: 'All',
  browserRequirements: 'Requires WebRTC / MediaDevices camera browser support',
  isAccessibleForFree: true,
  inLanguage: 'en',
  description: DEFAULT_DESCRIPTION,
  image: `${siteUrl}/opengraph-image`,
  author: {
    '@type': 'Person',
    name: CREATOR_NAME,
    url: CREATOR_URL,
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  featureList: [
    '100% browser-local Solo Photobooth mode with zero uploads',
    'Remote Duo real-time synchronized rooms with WebRTC live cameras',
    '16 vintage and film color filters',
    '32 multi-pose strip, grid, postcard, double-cut, bento, and polaroid layouts',
    'Interactive per-pose pan and zoom photo framing',
    '25+ strip colors & patterns plus custom hex color picker, 4 border styles, and corner accents',
    'Interactive stickers, custom uploaded meme stickers, and 4x scatter mode',
    'Realistic virtual photobooth dispenser print animation with optional sound',
    'iOS Live Photo-style looping GIF strip and optional session video export',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${crimson.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
        />
      </head>
      <body className="bg-cream min-h-screen font-body antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}