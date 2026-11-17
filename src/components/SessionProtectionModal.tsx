'use client'

interface SessionProtectionModalProps {
  mode: 'refresh' | 'new_session'
  isSaving: boolean
  saveError: string | null
  onSaveAndProceed: () => void
  onDiscardAndProceed: () => void
  onCancel: () => void
}

function AlertTriangleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export default function SessionProtectionModal({
  mode,
  isSaving,
  saveError,
  onSaveAndProceed,
  onDiscardAndProceed,
  onCancel,
}: SessionProtectionModalProps) {
  const isRefresh = mode === 'refresh'

  const title = isRefresh ? 'You have unsaved work!' : 'Start a New Session?'
  const description = isRefresh
    ? 'Are you sure you want to refresh? Your current session may contain work that has not been saved yet.'
    : 'Starting a new session may clear your current work. Would you like to save your current session first?'

  const saveLabel = isSaving
    ? 'Saving...'
    : isRefresh
      ? 'Save First'
      : 'Save & Start New Session'
  const discardLabel = isRefresh ? 'Refresh Anyway' : 'Start Without Saving'

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-fade-in select-none"
      style={{ background: 'rgba(26,20,16,0.78)', backdropFilter: 'blur(4px)' }}
      onClick={() => { if (!isSaving) onCancel() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-protection-title"
    >
      <div
        className="animate-scale-in rounded-sm p-6 sm:p-7 max-w-sm w-full text-center space-y-4"
        style={{
          background: 'var(--aged-white)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.38)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center" style={{ color: 'var(--sepia)' }}>
          <AlertTriangleIcon />
        </div>

        <div className="space-y-2">
          <h3
            id="session-protection-title"
            className="font-display text-lg font-bold"
            style={{ color: 'var(--vintage-brown)' }}
          >
            {title}
          </h3>
          <p className="text-sm leading-relaxed font-body" style={{ color: 'var(--text-muted)' }}>
            {description}
          </p>
        </div>

        {saveError && (
          <p
            className="text-xs font-body px-3 py-2 rounded-sm"
            style={{
              background: 'rgba(184, 50, 39, 0.08)',
              border: '1px solid rgba(184, 50, 39, 0.35)',
              color: '#b83227',
            }}
          >
            {saveError}
          </p>
        )}

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveAndProceed}
            className="w-full font-display text-xs tracking-widest uppercase py-3.5 px-4 rounded-sm transition-all active:scale-95 disabled:opacity-60"
            style={{ background: 'var(--vintage-brown)', color: 'var(--cream)' }}
          >
            {saveLabel}
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={onDiscardAndProceed}
            className="w-full font-display text-xs tracking-widest uppercase py-3 px-4 rounded-sm transition-all active:scale-95 disabled:opacity-50"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--vintage-brown)',
              background: 'var(--surface)',
            }}
          >
            {discardLabel}
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={onCancel}
            className="w-full font-display text-xs tracking-widest uppercase py-2.5 px-4 rounded-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
