import type { Metadata } from 'next'
import DuoComingSoon from '@/components/duo/DuoComingSoon'

const title = "Remote Duo Photobooth (Upgrading) | Jelly's Photobooth"
const description =
  "Remote Duo private rooms are currently upgrading and coming soon. Try Solo Photobooth in your browser with 32 strip layouts, custom colors, stickers, and Live GIFs."

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/duo',
  },
  openGraph: {
    type: 'website',
    url: '/duo',
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

export default function DuoPage() {
  return <DuoComingSoon />
}
