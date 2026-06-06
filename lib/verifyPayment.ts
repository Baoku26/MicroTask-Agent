import { decodeEventLog, getAddress } from 'viem'

type RawLog = {
  address:          `0x${string}`
  data:             `0x${string}`
  topics:           [`0x${string}`, ...`0x${string}`[]] | []
  blockHash:        `0x${string}`
  blockNumber:      bigint
  transactionHash:  `0x${string}`
  transactionIndex: number
  logIndex:         number
  removed:          boolean
}
import { publicClient } from '@/lib/viemClient'
import { CONTRACT_ADDRESS } from '@/lib/constants'
import { MICROTASK_ABI } from '@/lib/contract'

export class PaymentVerificationError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = 'PaymentVerificationError'
  }
}

export async function verifyPayment(
  txHash:      `0x${string}`,
  userAddress: string,
  taskType:    number,
): Promise<true> {
  // 1. Fetch receipt from Celo RPC
  let receipt: Awaited<ReturnType<typeof publicClient.getTransactionReceipt>>
  try {
    receipt = await publicClient.getTransactionReceipt({ hash: txHash })
  } catch {
    throw new PaymentVerificationError('INVALID_TX', 'Transaction not found on Celo')
  }

  // 2. Must be successful
  if (receipt.status !== 'success') {
    throw new PaymentVerificationError('INVALID_TX', 'Transaction reverted')
  }

  // 3. Must have been sent to our contract
  if (!receipt.to || getAddress(receipt.to) !== getAddress(CONTRACT_ADDRESS)) {
    throw new PaymentVerificationError('WRONG_CONTRACT', 'Transaction not sent to MicroTaskPayment contract')
  }

  // 4. Find and decode the TaskRequested event
  const logs = receipt.logs as unknown as RawLog[]

  const taskRequestedLog = logs.find(log => {
    try {
      const decoded = decodeEventLog({
        abi:       MICROTASK_ABI,
        data:      log.data,
        topics:    log.topics,
        eventName: 'TaskRequested',
      })
      return decoded.eventName === 'TaskRequested'
    } catch {
      return false
    }
  })

  if (!taskRequestedLog) {
    throw new PaymentVerificationError('EVENT_NOT_FOUND', 'TaskRequested event not found in transaction logs')
  }

  const event = decodeEventLog({
    abi:       MICROTASK_ABI,
    data:      taskRequestedLog.data,
    topics:    taskRequestedLog.topics as [`0x${string}`, ...`0x${string}`[]],
    eventName: 'TaskRequested',
  })

  // 5. Verify the user matches
  if (getAddress(event.args.user) !== getAddress(userAddress)) {
    throw new PaymentVerificationError('USER_MISMATCH', 'Transaction sender does not match provided address')
  }

  // 6. Verify the task type matches
  if (Number(event.args.taskType) !== taskType) {
    throw new PaymentVerificationError('INVALID_TASK', `Task type mismatch: expected ${taskType}, got ${event.args.taskType}`)
  }

  return true
}
