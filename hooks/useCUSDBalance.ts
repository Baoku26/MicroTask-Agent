'use client'

import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { CUSD_ADDRESS } from '@/lib/constants'

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export function useCUSDBalance(address?: `0x${string}`) {
  const { data, isLoading, refetch } = useReadContract({
    address: CUSD_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      // Refresh every ~5s (≈ 1 Celo block) while wallet is connected
      refetchInterval: address ? 5000 : false,
    },
  })

  const formatted = data !== undefined
    ? parseFloat(formatEther(data)).toFixed(2)
    : null

  return { balance: formatted, raw: data, isLoading, refetch }
}
