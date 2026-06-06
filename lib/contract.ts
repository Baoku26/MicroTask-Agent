import { CHAIN_ID, CELO_RPC, CONTRACT_ADDRESS, CUSD_ADDRESS } from '@/lib/constants'

export { CONTRACT_ADDRESS, CUSD_ADDRESS }

export const MICROTASK_ABI = [
  {
    name: 'requestTask',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'taskType', type: 'uint8' }],
    outputs: [{ name: 'requestId', type: 'bytes32' }],
  },
  {
    name: 'getPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'taskType', type: 'uint8' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    anonymous: false,
    name: 'TaskRequested',
    type: 'event',
    inputs: [
      { indexed: true,  name: 'user',      type: 'address' },
      { indexed: true,  name: 'taskType',  type: 'uint8'   },
      { indexed: false, name: 'amount',    type: 'uint256' },
      { indexed: false, name: 'requestId', type: 'bytes32' },
      { indexed: false, name: 'timestamp', type: 'uint256' },
    ],
  },
] as const

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount',  type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner',   type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const
