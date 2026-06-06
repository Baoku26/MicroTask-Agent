'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { TASK_LABELS } from '@/lib/constants'

interface ResultCardProps {
  result: string
  taskType: number
  txHash: string
  onReset: () => void
}

export function ResultCard({ result, taskType, txHash, onReset }: ResultCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: '1rem',
      padding: '1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {TASK_LABELS[taskType]?.toUpperCase()}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            padding: '0.4rem 0.75rem',
            cursor: 'pointer',
            color: copied ? 'var(--accent-green)' : 'var(--text-secondary)',
            fontSize: '0.8rem',
            transition: 'color 0.2s',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <p style={{
        color: 'var(--text-primary)',
        lineHeight: 1.7,
        fontSize: '0.95rem',
        whiteSpace: 'pre-wrap',
        marginBottom: '1.5rem',
      }}>
        {result}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <a
          href={`https://celoscan.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <ExternalLink size={12} />
          {txHash.slice(0, 10)}…{txHash.slice(-6)}
        </a>

        <button
          onClick={onReset}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '0.75rem',
            padding: '0.75rem',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            minHeight: '44px',
          }}
        >
          Try another task
        </button>
      </div>
    </div>
  )
}
