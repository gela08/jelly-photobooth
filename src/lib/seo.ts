export const SITE_NAME = "Jelly's Photobooth"
export const CREATOR_NAME = 'Angela Gardan'
export const CREATOR_URL = 'https://akaizer.vercel.app/'

export function getSiteUrl(): string {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://jelly-photobooth.vercel.app'
  return raw.replace(/\/+$/, '')
}

export const DEFAULT_TITLE = "Jelly's Photobooth – Vintage Photobooth Studio"
export const DEFAULT_DESCRIPTION =
  'Snap vintage photo strips with 32 layouts, 25+ strip colors & custom hex picker, 16 film filters, meme stickers, and Live Strip GIFs free. Remote Duo coming soon.'
