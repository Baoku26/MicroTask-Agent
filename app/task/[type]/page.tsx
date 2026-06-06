'use client'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { WalletConnect } from '@/components/WalletConnect'
import { TASK_LABELS, TASK_PRICES, TASK_DESCRIPTIONS } from '@/lib/constants'

const VALID_TASK_IDS = [1, 2, 3, 4]

interface TaskPageProps {
  params: { type: string }
}

export default function TaskPage({ params }: TaskPageProps) {
  const taskType = parseInt(params.type, 10)

  if (!VALID_TASK_IDS.includes(taskType)) notFound()

  const label = TASK_LABELS[taskType]
  const price = TASK_PRICES[taskType]
  const description = TASK_DESCRIPTIONS[taskType]

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '2rem 1rem',
      maxWidth: '480px',
      margin: '0 auto',
    }}>
      {/* Back nav + wallet */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
          }}
        >
          <ArrowLeft size={16} />
          All tasks
        </Link>
        <WalletConnect />
      </div>

      {/* Task header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            {label}
          </h1>
          <span style={{
            background: 'rgba(0, 211, 149, 0.12)',
            color: 'var(--accent-green)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            padding: '0.25rem 0.7rem',
            borderRadius: '999px',
          }}>
            {price} cUSD
          </span>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          {description}
        </p>
      </div>

      {/* Input form placeholder — wired up Day 11 */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '1rem',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div className="skeleton" style={{ height: '120px' }} />
        <div className="skeleton" style={{ height: '44px' }} />

        {/* Pay button — wired Day 8 */}
        <button
          disabled
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '0.875rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: '0.9rem',
            minHeight: '44px',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        >
          Pay {price} cUSD &amp; Generate
        </button>
      </div>
    </main>
  )
}
