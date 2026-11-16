import type { Metadata } from 'next'

const title = "Solo Photobooth Studio | Jelly's Photobooth"
const description =
  'Take browser-private solo photobooth strips with 16 film filters, 22 layouts, custom meme stickers, animated Live GIFs, and high-res PNG downloads.'

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/photobooth',
  },
  openGraph: {
    type: 'website',
    url: '/photobooth',
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

export default function PhotoboothLayout({ children }: { children: React.ReactNode }) {
  return children
}
