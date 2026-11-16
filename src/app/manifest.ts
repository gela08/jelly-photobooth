import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jelly's Photobooth",
    short_name: "Jelly's PB",
    description:
      'Browser-based vintage photobooth with Solo Mode, Remote Duo rooms, 16 film filters, custom stickers, and Live Strip GIF exports.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f0e8',
    theme_color: '#5c3d1e',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
