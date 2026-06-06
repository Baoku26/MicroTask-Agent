'use client'

import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { wagmiConfig } from '@/lib/wagmi'
import { NetworkGuard } from '@/components/NetworkGuard'

import '@rainbow-me/rainbowkit/styles.css'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#7B61FF',
            accentColorForeground: '#F0F0FF',
            borderRadius: 'large',
            fontStack: 'system',
          })}
        >
          <NetworkGuard>
            {children}
          </NetworkGuard>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
