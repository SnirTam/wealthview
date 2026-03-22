import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            background: 'var(--bg2)', borderRadius: 20, padding: '40px 32px',
            border: '1px solid var(--border)', maxWidth: 480, width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-body)', marginBottom: 24 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              style={{
                background: 'linear-gradient(135deg, var(--green), var(--teal))',
                color: '#0a0a0f', padding: '10px 24px', borderRadius: 10,
                fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-display)',
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
