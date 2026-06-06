import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
    }}>
      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        404 — page not found
      </p>
      <Link
        href="/"
        style={{
          color: 'var(--accent)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
        }}
      >
        Go home
      </Link>
    </main>
  )
}
