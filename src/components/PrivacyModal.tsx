'use client'; // This is the magic fix

interface PrivacyModalProps {
  onAccept: () => void
  onDecline: () => void
}

function CameraIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

const items = [
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    text: 'Your camera feed is processed entirely in your browser — nothing is uploaded or stored.',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    text: 'Camera access is only active while you are in the photobooth session.',
  },
  {
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    text: 'No account, no sign-up, no tracking. Just pure photobooth fun.',
  },
]

export default function PrivacyModal({ onAccept, onDecline }: PrivacyModalProps) {
  return (
    <div
      className="fixed select-none inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(26,20,16,0.8)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="rounded-sm max-w-md w-full p-8 shadow-2xl animate-scale-in"
        style={{
          background: 'var(--aged-white)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 80px rgba(0,0,0,0.35)',
        }}
      >
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3" style={{ color: 'var(--sepia)' }}>
            <CameraIcon />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-wide" style={{ color: 'var(--vintage-brown)' }}>
            Camera Access
          </h2>
          <p className="text-sm mt-1 font-body" style={{ color: 'var(--text-muted)' }}>
            Before we begin, a few things to know
          </p>
        </div>

        <div className="space-y-3 mb-7">
          {items.map(({ icon, text }, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-sm mt-0.5"
                style={{ background: 'var(--parchment)', color: 'var(--sepia)' }}
              >
                {icon}
              </div>
              <p className="text-sm leading-relaxed font-body" style={{ color: 'var(--text-secondary)' }}>
                {text}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2.5">
          <button
            onClick={onAccept}
            className="w-full flex items-center justify-center gap-2.5 font-display text-sm tracking-widest uppercase py-4 transition-all duration-200 active:scale-95"
            style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
          >
            <CameraIcon />
            Allow Camera & Start
          </button>
          <button
            onClick={onDecline}
            className="w-full font-display text-xs tracking-widest uppercase py-3 transition-all active:scale-95"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              background: 'transparent',
            }}
          >
            Go Back
          </button>
        </div>

        <p className="text-center text-xs mt-4 font-body" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline" style={{ color: 'var(--sepia)' }}>Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="underline" style={{ color: 'var(--sepia)' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  )
}
