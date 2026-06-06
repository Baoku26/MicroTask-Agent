'use client'

import { useState, useEffect } from 'react'
import { useConnect, useAccount } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false)
  const { connect } = useConnect()
  const { address, isConnected } = useAccount()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window.ethereum as any)?.isMiniPay) {
      setIsMiniPay(true)
      if (!isConnected) {
        connect({ connector: injected() })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { isMiniPay, address, isConnected }
}
