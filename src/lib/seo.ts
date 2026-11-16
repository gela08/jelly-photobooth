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

export const DEFAULT_TITLE = "Jelly's Photobooth – Vintage Solo & Remote Duo Booth"
export const DEFAULT_DESCRIPTION =
  'Snap vintage photo strips solo or with friends in Remote Duo. Customize 16 film filters, meme stickers, Live Strip GIFs & virtual print animations free.'
