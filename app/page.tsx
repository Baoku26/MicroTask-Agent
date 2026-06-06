'use client'

import { TaskCard } from '@/components/TaskCard'
import { WalletConnect } from '@/components/WalletConnect'
import { TxHistory } from '@/components/TxHistory'
import { TASK_TYPES, TASK_LABELS } from '@/lib/constants'

const V1_TASKS = [
  TASK_TYPES.CAPTION,
  TASK_TYPES.EMAIL,
  TASK_TYPES.SUMMARY,
  TASK_TYPES.EXPLAIN,
]

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '2rem 1rem',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'var(--accent)',
            letterSpacing: '-0.02em',
          }}>
            MicroTask Agent
          </h1>
          <WalletConnect />
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Pay once. Get AI output. No account needed.
        </p>
      </div>

      {/* Task grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {V1_TASKS.map((id, i) => (
          <TaskCard key={id} id={id} label={TASK_LABELS[id]} index={i} />
        ))}
      </div>

      {/* Coming soon */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        border: '1px dashed var(--border)',
        borderRadius: '1rem',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Image generator + Translator — coming soon
        </p>
      </div>

      <TxHistory />
    </main>
  )
}
