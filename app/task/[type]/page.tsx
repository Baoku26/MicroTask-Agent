'use client'

import { useState } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useAccount } from 'wagmi'
import { WalletConnect } from '@/components/WalletConnect'
import { TaskInput, type TaskInputValue } from '@/components/TaskInput'
import { PaymentModal } from '@/components/PaymentModal'
import { ResultCard } from '@/components/ResultCard'
import { TASK_LABELS, TASK_PRICES, TASK_DESCRIPTIONS } from '@/lib/constants'
import { saveEntry } from '@/lib/txHistory'

const VALID_TASK_IDS = [1, 2, 3, 4]

interface TaskPageProps {
  params: { type: string }
}

export default function TaskPage({ params }: TaskPageProps) {
  const taskType = parseInt(params.type, 10)
  if (!VALID_TASK_IDS.includes(taskType)) notFound()

  const label       = TASK_LABELS[taskType]
  const price       = TASK_PRICES[taskType]
  const description = TASK_DESCRIPTIONS[taskType]

  const { address, isConnected } = useAccount()

  const [inputValue,  setInputValue]  = useState<TaskInputValue>({ text: '' })
  const [modalOpen,   setModalOpen]   = useState(false)
  const [isLoading,   setIsLoading]   = useState(false)
  const [result,      setResult]      = useState<string | null>(null)
  const [confirmedTx, setConfirmedTx] = useState<string | null>(null)
  const [apiError,    setApiError]    = useState<string | null>(null)

  const hasInput    = inputValue.text.trim().length > 0
  const canPay      = isConnected && hasInput && !isLoading

  async function handlePaymentConfirmed(txHash: string) {
    setModalOpen(false)
    setIsLoading(true)
    setApiError(null)

    try {
      const res = await fetch('/api/task', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txHash,
          taskType,
          userAddress: address,
          input: inputValue,
        }),
      })
      const data = await res.json()

      if (!data.success) {
        setApiError(data.error ?? 'Something went wrong')
      } else {
        setResult(data.result)
        setConfirmedTx(txHash)
        saveEntry({ taskType, txHash, result: data.result, timestamp: Date.now() })
      }
    } catch {
      setApiError('Network error — please try again')
    } finally {
      setIsLoading(false)
    }
  }

  function reset() {
    setResult(null)
    setConfirmedTx(null)
    setApiError(null)
    setInputValue({ text: '' })
  }

  return (
    <main style={{
      minHeight:  '100vh',
      background: 'var(--bg-primary)',
      padding:    '2rem 1rem calc(2rem + env(safe-area-inset-bottom, 0))',
      maxWidth:   '480px',
      margin:     '0 auto',
    }}>
      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <Link
          href="/"
          style={{
            display:    'inline-flex',
            alignItems: 'center',
            gap:        '0.4rem',
            color:      'var(--text-secondary)',
            fontSize:   '0.875rem',
          }}
        >
          <ArrowLeft size={16} />
          All tasks
        </Link>
        <WalletConnect />
      </div>

      {/* Task header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   '1.2rem',
            fontWeight: 700,
            color:      'var(--text-primary)',
          }}>
            {label}
          </h1>
          <span style={{
            background:   'rgba(0,211,149,0.12)',
            color:        'var(--accent-green)',
            fontSize:     '0.8rem',
            fontFamily:   'var(--font-mono)',
            fontWeight:   700,
            padding:      '0.25rem 0.7rem',
            borderRadius: '999px',
          }}>
            {price} cUSD
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {description}
        </p>
      </div>

      {/* Result view */}
      {result && confirmedTx ? (
        <ResultCard
          result={result}
          taskType={taskType}
          txHash={confirmedTx}
          onReset={reset}
        />
      ) : (
        <>
          {/* Input form */}
          <div style={{
            background:    'var(--bg-card)',
            border:        '1px solid var(--border)',
            borderRadius:  '1rem',
            padding:       '1.25rem',
            marginBottom:  '1rem',
          }}>
            <TaskInput taskType={taskType} onChange={setInputValue} />
          </div>

          {/* API error */}
          {apiError && (
            <div style={{
              background:   'rgba(255,80,80,0.08)',
              border:       '1px solid rgba(255,80,80,0.25)',
              borderRadius: '0.75rem',
              padding:      '0.875rem 1rem',
              fontSize:     '0.85rem',
              color:        '#ff5050',
              marginBottom: '1rem',
            }}>
              {apiError}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '0.6rem',
              padding:        '1.25rem',
              background:     'var(--bg-card)',
              border:         '1px solid var(--border)',
              borderRadius:   '1rem',
              marginBottom:   '1rem',
              color:          'var(--text-secondary)',
              fontSize:       '0.875rem',
              fontFamily:     'var(--font-mono)',
            }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} />
              Generating…
            </div>
          )}

          {/* CTA */}
          <button
            disabled={!canPay}
            onClick={() => setModalOpen(true)}
            style={{
              width:        '100%',
              background:   'var(--accent)',
              color:        '#fff',
              border:       'none',
              borderRadius: '0.75rem',
              padding:      '0.95rem',
              fontFamily:   'var(--font-mono)',
              fontWeight:   700,
              fontSize:     '0.95rem',
              minHeight:    '48px',
              cursor:       canPay ? 'pointer' : 'not-allowed',
              opacity:      canPay ? 1 : 0.45,
              transition:   'opacity 0.15s',
            }}
          >
            {isLoading ? 'Generating…' : `Pay ${price} cUSD & Generate`}
          </button>

          {!isConnected && (
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              Connect your wallet above to continue
            </p>
          )}

          {isConnected && !hasInput && (
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              Fill in the form to unlock payment
            </p>
          )}
        </>
      )}

      <PaymentModal
        taskType={taskType}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirmed={handlePaymentConfirmed}
      />
    </main>
  )
}
