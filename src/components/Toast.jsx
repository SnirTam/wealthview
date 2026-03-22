import { useEffect } from 'react'

const SLIDE_IN_STYLE = `
@keyframes toastSlideIn {
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
}
`

function ToastItem({ toast, removeToast }) {
  const isSuccess = toast.type === 'success'

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), 5000)
    return () => clearTimeout(timer)
  }, [toast.id, removeToast])

  return (
    <div style={{
      width: 320,
      borderRadius: 12,
      padding: '14px 16px',
      background: isSuccess ? 'rgba(0,217,139,0.12)' : 'rgba(255,77,109,0.12)',
      border: isSuccess ? '1px solid rgba(0,217,139,0.3)' : '1px solid rgba(255,77,109,0.3)',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      animation: 'toastSlideIn 0.3s ease both',
      position: 'relative',
    }}>
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text)',
            fontFamily: 'var(--font-body)',
            marginBottom: toast.message ? 3 : 0,
            lineHeight: 1.3,
          }}>
            {toast.title}
          </p>
        )}
        {toast.message && (
          <p style={{
            fontSize: 12,
            color: 'var(--muted2)',
            fontFamily: 'var(--font-body)',
            lineHeight: 1.4,
          }}>
            {toast.message}
          </p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={() => removeToast(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--muted)',
          fontSize: 16,
          lineHeight: 1,
          padding: '0 2px',
          fontFamily: 'var(--font-body)',
          flexShrink: 0,
          marginTop: 1,
        }}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}

export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <>
      <style>{SLIDE_IN_STYLE}</style>
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={toast} removeToast={removeToast} />
          </div>
        ))}
      </div>
    </>
  )
}
