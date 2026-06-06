'use client'

import { useState, useCallback } from 'react'
import { useWriteContract, usePublicClient, useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { TASK_PRICES, CUSD_ADDRESS, CONTRACT_ADDRESS } from '@/lib/constants'
import { MICROTASK_ABI, ERC20_ABI } from '@/lib/contract'

export type PaymentStatus = 'idle' | 'approving' | 'approved' | 'paying' | 'confirmed' | 'error'

export function useTaskPayment() {
  const [status, setStatus] = useState<PaymentStatus>('idle')
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [error,  setError]  = useState<string | null>(null)

  const { address }                    = useAccount()
  const { writeContractAsync }         = useWriteContract()
  const publicClient                   = usePublicClient()

  const startPayment = useCallback(async (taskType: number) => {
    if (!address || !publicClient) return

    const price = parseEther(TASK_PRICES[taskType])

    try {
      setStatus('approving')
      setError(null)
      setTxHash(null)

      // Step 1: approve cUSD spend
      const approveTx = await writeContractAsync({
        address:      CUSD_ADDRESS  as `0x${string}`,
        abi:          ERC20_ABI,
        functionName: 'approve',
        args:         [CONTRACT_ADDRESS as `0x${string}`, price],
        account:      address,
      } as any)
      await publicClient.waitForTransactionReceipt({ hash: approveTx })
      setStatus('approved')

      // Step 2: call requestTask — contract pulls the cUSD
      setStatus('paying')
      const requestTx = await writeContractAsync({
        address:      CONTRACT_ADDRESS as `0x${string}`,
        abi:          MICROTASK_ABI,
        functionName: 'requestTask',
        args:         [taskType],
        account:      address,
      } as any)
      setTxHash(requestTx)
      await publicClient.waitForTransactionReceipt({ hash: requestTx })
      setStatus('confirmed')

    } catch (err: any) {
      setStatus('error')
      setError(err.shortMessage ?? err.message ?? 'Transaction failed')
    }
  }, [address, publicClient, writeContractAsync])

  const reset = useCallback(() => {
    setStatus('idle')
    setTxHash(null)
    setError(null)
  }, [])

  return {
    status,
    txHash,
    error,
    isPending:   status === 'approving' || status === 'paying',
    isConfirmed: status === 'confirmed',
    startPayment,
    reset,
  }
}
