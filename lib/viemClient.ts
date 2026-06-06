import { createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'
import { CELO_RPC } from './constants'

export const publicClient = createPublicClient({
  chain: celo,
  transport: http(CELO_RPC),
})
