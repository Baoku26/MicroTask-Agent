import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { celo } from 'wagmi/chains'
import { http } from 'wagmi'
import { CELO_RPC } from './constants'

export const wagmiConfig = getDefaultConfig({
  appName: 'MicroTask Agent',
  // Get a free project ID at cloud.walletconnect.com (required for WalletConnect)
  // MiniPay users auto-connect without it; browser wallet users need it
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'b56e18d47e7a9f499c25e655a52e2e96',
  chains: [celo],
  transports: {
    [celo.id]: http(CELO_RPC),
  },
  ssr: true,
})
