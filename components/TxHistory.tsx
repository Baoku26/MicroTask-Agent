'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Clock, Trash2 } from 'lucide-react'
import { loadHistory, clearHistory, type TxEntry } from '@/lib/txHistory'

const PREVIEW_CHARS = 80

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function TxHistory() {
  const [entries, setEntries] = useState<TxEntry[]>([])

  useEffect(() => {
    setEntries(loadHistory())
  }, [])

  function handleClear() {
    clearHistory()
    setEntries([])
  }

  if (entries.length === 0) return null

  return (
    <div style={{ marginTop: '2rem' }}>
      {/* Header */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{
            fontSize:      '0.75rem',
            fontFamily:    'var(--font-mono)',
            color:         'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            Session history
          </span>
        </div>
        <button
          onClick={handleClear}
          style={{
            background: 'none',
            border:     'none',
            cursor:     'pointer',
            color:      'var(--text-muted)',
            display:    'flex',
            alignItems: 'center',
            gap:        '0.3rem',
            fontSize:   '0.75rem',
            padding:    '0.25rem',
          }}
        >
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {entries.map(entry => (
          <div
            key={entry.id}
            style={{
              background:   'var(--bg-card)',
              border:       '1px solid var(--border)',
              borderRadius: '0.75rem',
              padding:      '0.875rem 1rem',
            }}
          >
            {/* Row 1: label + time + celoscan link */}
            <div style={{
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'center',
              marginBottom:   '0.4rem',
            }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize:   '0.8rem',
                color:      'var(--text-primary)',
              }}>
                {entry.taskLabel}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {timeAgo(entry.timestamp)}
                </span>
                <a
                  href={`https://celoscan.io/tx/${entry.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color:   'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Row 2: result preview */}
            <p style={{
              fontSize:   '0.82rem',
              color:      'var(--text-secondary)',
              lineHeight: 1.5,
              margin:     0,
            }}>
              {entry.result.length > PREVIEW_CHARS
                ? entry.result.slice(0, PREVIEW_CHARS) + '…'
                : entry.result}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
