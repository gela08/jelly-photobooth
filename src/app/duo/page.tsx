import type { Metadata } from 'next'
import DuoBoothSession from '@/components/duo/DuoBoothSession'

const title = "Remote Duo Photobooth Rooms | Jelly's Photobooth"
const description =
  'Create a private room link, pose live via camera with a friend anywhere, and co-design Side-by-Side or Twin photobooth strips synced in real time.'

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

export default async function DuoPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>
}) {
  const resolved = await searchParams
  const room = typeof resolved?.room === 'string' ? resolved.room : ''
  return <DuoBoothSession initialRoomCode={room} />
}
