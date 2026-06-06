'use client'

import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useMiniPay } from '@/hooks/useMiniPay'
import { useCUSDBalance } from '@/hooks/useCUSDBalance'
import { CHAIN_ID } from '@/lib/constants'

function truncate(addr: string) {
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

export function WalletConnect() {
  const { isMiniPay } = useMiniPay()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { balance } = useCUSDBalance(address)

  const onWrongNetwork = isConnected && chainId !== CHAIN_ID

  // ── MiniPay: auto-connected, show address + balance inline ────────────────
  if (isMiniPay && isConnected && address) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.4rem 0.75rem',
        background: 'rgba(0,211,149,0.08)',
        border: '1px solid rgba(0,211,149,0.2)',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontFamily: 'var(--font-mono)',
      }}>
        <span style={{ color: 'var(--accent-green)' }}>●</span>
        <span style={{ color: 'var(--text-primary)' }}>{truncate(address)}</span>
        {balance && (
          <span style={{ color: 'var(--text-muted)' }}>{balance} cUSD</span>
        )}
      </div>
    )
  }

  // ── Wrong network ─────────────────────────────────────────────────────────
  if (onWrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: CHAIN_ID })}
        style={{
          background: 'rgba(245,166,35,0.12)',
          border: '1px solid rgba(245,166,35,0.3)',
          borderRadius: '999px',
          padding: '0.4rem 0.9rem',
          color: 'var(--accent-amber)',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-mono)',
          cursor: 'pointer',
          minHeight: '44px',
        }}
      >
        Switch to Celo
      </button>
    )
  }

  // ── Browser wallet connected ──────────────────────────────────────────────
  if (isConnected && address) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.4rem 0.75rem',
        background: 'rgba(123,97,255,0.08)',
        border: '1px solid rgba(123,97,255,0.2)',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontFamily: 'var(--font-mono)',
      }}>
        <span style={{ color: 'var(--accent)' }}>●</span>
        <span style={{ color: 'var(--text-primary)' }}>{truncate(address)}</span>
        {balance && (
          <span style={{ color: 'var(--text-muted)' }}>{balance} cUSD</span>
        )}
      </div>
    )
  }

  // ── Not connected: RainbowKit button ─────────────────────────────────────
  return (
    <ConnectButton
      label="Connect"
      accountStatus="address"
      chainStatus="none"
      showBalance={false}
    />
  )
}
