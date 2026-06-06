'use client'

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { CHAIN_ID } from '@/lib/constants'

interface NetworkGuardProps {
  children: React.ReactNode
}

export function NetworkGuard({ children }: NetworkGuardProps) {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  const onWrongNetwork = isConnected && chainId !== CHAIN_ID

  if (!onWrongNetwork) return <>{children}</>

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      gap: '1.25rem',
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'rgba(245,166,35,0.12)',
        border: '1px solid rgba(245,166,35,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
      }}>
        ⚠
      </div>

      <div>
        <h2 style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.4rem',
        }}>
          Wrong network
        </h2>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          maxWidth: '280px',
        }}>
          MicroTask Agent runs on Celo Mainnet. Switch your wallet to continue.
        </p>
      </div>

      <button
        onClick={() => switchChain({ chainId: CHAIN_ID })}
        disabled={isPending}
        style={{
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: '0.75rem',
          padding: '0.875rem 1.75rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: isPending ? 'not-allowed' : 'pointer',
          opacity: isPending ? 0.6 : 1,
          minHeight: '44px',
          minWidth: '200px',
        }}
      >
        {isPending ? 'Switching…' : 'Switch to Celo'}
      </button>
    </div>
  )
}
