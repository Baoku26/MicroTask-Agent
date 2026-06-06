'use client'

import { useEffect } from 'react'
import { useAccount } from 'wagmi'
import { X, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { TASK_LABELS, TASK_PRICES } from '@/lib/constants'
import { useCUSDBalance } from '@/hooks/useCUSDBalance'
import { useTaskPayment, PaymentStatus } from '@/hooks/useTaskPayment'

interface PaymentModalProps {
  taskType: number
  isOpen:   boolean
  onClose:  () => void
  onConfirmed: (txHash: string) => void
}

const STATUS_MESSAGES: Record<PaymentStatus, string> = {
  idle:      'Ready to pay',
  approving: 'Approving cUSD spend…',
  approved:  'Allowance set',
  paying:    'Sending payment…',
  confirmed: 'Payment confirmed!',
  error:     'Transaction failed',
}

function shortenAddress(addr: string) {
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

export function PaymentModal({ taskType, isOpen, onClose, onConfirmed }: PaymentModalProps) {
  const { address } = useAccount()
  const { balance } = useCUSDBalance(address)
  const { status, txHash, error, isPending, isConfirmed, startPayment, reset } = useTaskPayment()

  // Bubble confirmed txHash to parent
  useEffect(() => {
    if (isConfirmed && txHash) {
      onConfirmed(txHash)
    }
  }, [isConfirmed, txHash, onConfirmed])

  // Reset state whenever modal re-opens
  useEffect(() => {
    if (isOpen) reset()
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null

  const price = TASK_PRICES[taskType]
  const label = TASK_LABELS[taskType]

  return (
    // Backdrop
    <div
      onClick={!isPending ? onClose : undefined}
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex:         50,
        display:        'flex',
        alignItems:     'flex-end',
        justifyContent: 'center',
        padding:        '0 0 env(safe-area-inset-bottom, 0)',
      }}
    >
      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:          '100%',
          maxWidth:       '480px',
          background:     'var(--bg-card)',
          border:         '1px solid var(--border)',
          borderRadius:   '1.25rem 1.25rem 0 0',
          padding:        '1.5rem 1.5rem calc(1.5rem + env(safe-area-inset-bottom, 0))',
          display:        'flex',
          flexDirection:  'column',
          gap:            '1.25rem',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
            Confirm payment
          </span>
          {!isPending && (
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Task + price row */}
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'center',
          background:     'var(--bg-secondary)',
          borderRadius:   '0.75rem',
          padding:        '1rem',
          border:         '1px solid var(--border)',
        }}>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Task</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{label}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Cost</p>
            <p style={{
              background:    'rgba(0,211,149,0.12)',
              color:         'var(--accent-green)',
              fontFamily:    'var(--font-mono)',
              fontWeight:    700,
              fontSize:      '0.95rem',
              padding:       '0.2rem 0.6rem',
              borderRadius:  '999px',
            }}>
              {price} cUSD
            </p>
          </div>
        </div>

        {/* Wallet info */}
        {address && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Wallet: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{shortenAddress(address)}</span></span>
            <span>Balance: <span style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>{balance ?? '…'} cUSD</span></span>
          </div>
        )}

        {/* Status */}
        <div style={{
          display:       'flex',
          alignItems:    'center',
          gap:           '0.6rem',
          padding:       '0.875rem 1rem',
          borderRadius:  '0.75rem',
          background:    status === 'confirmed' ? 'rgba(0,211,149,0.08)'
                       : status === 'error'     ? 'rgba(255,80,80,0.08)'
                       : 'rgba(123,97,255,0.08)',
          border:        `1px solid ${
                         status === 'confirmed' ? 'rgba(0,211,149,0.25)'
                       : status === 'error'     ? 'rgba(255,80,80,0.25)'
                       : 'rgba(123,97,255,0.25)'}`,
        }}>
          {isPending && <Loader2 size={16} style={{ color: 'var(--accent)', flexShrink: 0, animation: 'spin 1s linear infinite' }} />}
          {isConfirmed && <CheckCircle size={16} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />}
          {status === 'error' && <AlertCircle size={16} style={{ color: '#ff5050', flexShrink: 0 }} />}
          {!isPending && !isConfirmed && status !== 'error' && (
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
          )}
          <span style={{
            fontSize:   '0.85rem',
            fontFamily: 'var(--font-mono)',
            color: status === 'confirmed' ? 'var(--accent-green)'
                 : status === 'error'     ? '#ff5050'
                 : 'var(--accent)',
          }}>
            {STATUS_MESSAGES[status]}
          </span>
        </div>

        {/* Error detail */}
        {error && (
          <p style={{ fontSize: '0.8rem', color: '#ff5050', wordBreak: 'break-word', margin: '-0.5rem 0 0' }}>
            {error}
          </p>
        )}

        {/* Tx hash link */}
        {txHash && (
          <a
            href={`https://celoscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display:    'inline-flex',
              alignItems: 'center',
              gap:        '0.35rem',
              fontSize:   '0.78rem',
              color:      'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              textDecoration: 'none',
            }}
          >
            {txHash.slice(0, 10)}…{txHash.slice(-6)}
            <ExternalLink size={12} />
          </a>
        )}

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['approving','approved','paying','confirmed'] as PaymentStatus[]).map((s, i) => {
            const done    = ['approved','paying','confirmed'].includes(status) && i === 0
                         || ['paying','confirmed'].includes(status) && i === 1
                         || status === 'confirmed' && i === 3
            const active  = status === s
            return (
              <div key={s} style={{
                flex:         1,
                height:       3,
                borderRadius: 999,
                background:   done || active
                  ? (status === 'confirmed' ? 'var(--accent-green)' : 'var(--accent)')
                  : 'var(--border)',
                opacity: active ? 1 : done ? 0.7 : 0.3,
                transition: 'background 0.3s, opacity 0.3s',
              }} />
            )
          })}
        </div>

        {/* Action buttons */}
        {status === 'idle' && (
          <button
            onClick={() => startPayment(taskType)}
            style={{
              background:    'var(--accent)',
              color:         '#fff',
              border:        'none',
              borderRadius:  '0.75rem',
              padding:       '0.875rem',
              fontFamily:    'var(--font-mono)',
              fontWeight:    700,
              fontSize:      '0.9rem',
              minHeight:     '44px',
              cursor:        'pointer',
            }}
          >
            Pay {price} cUSD
          </button>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={reset}
              style={{
                flex:          1,
                background:    'var(--accent)',
                color:         '#fff',
                border:        'none',
                borderRadius:  '0.75rem',
                padding:       '0.875rem',
                fontFamily:    'var(--font-mono)',
                fontWeight:    700,
                fontSize:      '0.875rem',
                minHeight:     '44px',
                cursor:        'pointer',
              }}
            >
              Try again
            </button>
            <button
              onClick={onClose}
              style={{
                flex:          1,
                background:    'transparent',
                color:         'var(--text-secondary)',
                border:        '1px solid var(--border)',
                borderRadius:  '0.75rem',
                padding:       '0.875rem',
                fontFamily:    'var(--font-mono)',
                fontWeight:    700,
                fontSize:      '0.875rem',
                minHeight:     '44px',
                cursor:        'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {isConfirmed && (
          <button
            onClick={onClose}
            style={{
              background:    'var(--accent-green)',
              color:         '#0A0A0F',
              border:        'none',
              borderRadius:  '0.75rem',
              padding:       '0.875rem',
              fontFamily:    'var(--font-mono)',
              fontWeight:    700,
              fontSize:      '0.9rem',
              minHeight:     '44px',
              cursor:        'pointer',
            }}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
