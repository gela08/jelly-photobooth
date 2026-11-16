import { ImageResponse } from 'next/og'

export const alt = "Jelly's Photobooth — Vintage Solo & Remote Duo Photobooth"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 68px',
          background: '#f5f0e8',
          color: '#3d2817',
          border: '14px solid #5c3d1e',
          fontFamily: 'serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 22,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#8b5e34',
          }}
        >
          <span>✦ Jelly&apos;s Photobooth</span>
          <span>Browser Studio · Free</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontSize: 66,
              fontWeight: 700,
              lineHeight: 1.08,
              color: '#3d2817',
            }}
          >
            Capture Memories in Film — Solo or Remote Duo
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: '#6b5744',
              maxWidth: 960,
            }}
          >
            16 Film Filters · 22 Layouts · Custom Meme Stickers · Virtual Print Dispenser · iOS Live Strip GIFs &amp; Video
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '2px solid rgba(92, 61, 30, 0.25)',
            paddingTop: 22,
            fontSize: 22,
            color: '#5c3d1e',
          }}
        >
          <span>No Account · No Sign-Up Required</span>
          <span>Developed by Angela Gardan</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
