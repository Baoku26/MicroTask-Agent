import { NextRequest, NextResponse } from 'next/server'
import { verifyPayment, PaymentVerificationError } from '@/lib/verifyPayment'
import { TASK_TYPES } from '@/lib/constants'

// ── Simple in-memory rate limiter (10 req/min per IP) ──────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT    = 10
const WINDOW_MS     = 60_000

function checkRateLimit(ip: string): boolean {
  const now    = Date.now()
  const bucket = rateLimitMap.get(ip)

  if (!bucket || now > bucket.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (bucket.count >= RATE_LIMIT) return false

  bucket.count++
  return true
}

// ── Request body shape ──────────────────────────────────────────────────────
interface TaskRequestBody {
  txHash:      string
  taskType:    number
  userAddress: string
  input: {
    text:       string
    tone?:      string
    recipient?: string
    length?:    string
    audience?:  string
  }
}

function err(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: message, code }, { status })
}

// ── POST /api/task ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return err('RATE_LIMITED', 'Too many requests — max 10 per minute', 429)
  }

  // Parse body
  let body: TaskRequestBody
  try {
    body = await req.json()
  } catch {
    return err('INVALID_TX', 'Invalid request body', 400)
  }

  const { txHash, taskType, userAddress, input } = body

  // Validate required fields
  if (!txHash || typeof txHash !== 'string' || !txHash.startsWith('0x')) {
    return err('INVALID_TX', 'txHash is required and must be a hex string', 400)
  }
  if (!userAddress || typeof userAddress !== 'string' || !userAddress.startsWith('0x')) {
    return err('INVALID_TX', 'userAddress is required and must be a hex string', 400)
  }
  if (!taskType || !Object.values(TASK_TYPES).includes(taskType as any)) {
    return err('INVALID_TASK', `taskType must be one of ${Object.values(TASK_TYPES).join(', ')}`, 400)
  }
  if (!input?.text || typeof input.text !== 'string' || input.text.trim().length === 0) {
    return err('INVALID_TX', 'input.text is required', 400)
  }

  // Verify payment onchain — this MUST pass before any AI call
  try {
    await verifyPayment(txHash as `0x${string}`, userAddress, taskType)
  } catch (e) {
    if (e instanceof PaymentVerificationError) {
      return err(e.code, e.message, 403)
    }
    return err('INVALID_TX', 'Payment verification failed', 403)
  }

  // ── AI call goes here (Day 10) ──────────────────────────────────────────
  // For now return a stub so the payment flow can be tested end-to-end
  return NextResponse.json({
    success:  true,
    result:   `[Day 10 stub] Task type ${taskType} received. AI integration coming next.`,
    taskType,
    chars:    0,
    txHash,
  })
}
