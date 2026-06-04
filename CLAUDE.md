# CLAUDE.md — MicroTask Agent

This file gives AI assistants (Claude, Copilot, Cursor, etc.) full context about this project so every suggestion is accurate, on-stack, and aligned with the product's goals. Read this before touching any file in the repo.

---

## What This Project Is

**MicroTask Agent** is a pay-per-use AI toolbox built on Celo and distributed through MiniPay. Users access AI capabilities — text generation, image creation, translation — by paying tiny fixed amounts in cUSD per request. No account. No subscription. No credit card. Just connect a wallet, pay for what you need, get the result.

**One-line principle:** The AI never runs unless payment is confirmed onchain. No payment = no output.

**Built for:** Celo Proof of Ship Season 2 — June 2026. Submission deadline June 22, 2026.

---

## Repo Structure

```
microtask-agent/
├── app/                        # Next.js 14 App Router
│   ├── page.tsx                # Home — task picker grid
│   ├── layout.tsx              # Root layout, providers
│   ├── task/[type]/page.tsx    # Per-task input screen
│   └── api/
│       └── task/route.ts       # POST /api/task — the core backend endpoint
│
├── components/
│   ├── WalletConnect.tsx       # MiniPay detection + RainbowKit fallback
│   ├── TaskCard.tsx            # Task picker card with price badge
│   ├── TaskInput.tsx           # Per-task input form
│   ├── PaymentModal.tsx        # Pre-payment confirmation modal
│   ├── ResultCard.tsx          # AI result display + copy/share
│   └── TxHistory.tsx           # Session transaction history (localStorage)
│
├── hooks/
│   ├── useMiniPay.ts           # Detects window.ethereum.isMiniPay
│   ├── useTaskPayment.ts       # Handles approve() + requestTask() flow
│   └── useCUSDBalance.ts       # Reads user's cUSD balance
│
├── lib/
│   ├── contract.ts             # ABI, address constants, Viem client setup
│   ├── verifyPayment.ts        # Backend TX verification logic (Celo RPC)
│   ├── taskRouter.ts           # Routes taskType to correct AI provider + prompt
│   └── constants.ts            # Task types, prices, chain config
│
├── contracts/
│   ├── MicroTaskPayment.sol    # The payment contract
│   ├── hardhat.config.js       # Hardhat config for Alfajores + Celo Mainnet
│   └── scripts/
│       └── deploy.ts           # Deployment script
│
├── styles/
│   └── globals.css             # Tailwind base + CSS variable tokens
│
├── public/                     # Static assets
├── .env.local                  # Local env (never commit — see .env.example)
├── .env.example                # Template for required env vars
├── CLAUDE.md                   # This file
├── planning.md                 # Product decisions, roadmap, architecture summary
└── tasks.md                    # Sprint checklist — current status of every task
```

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14 (App Router) | Use server components where possible |
| Styling | Tailwind CSS | Utility-first, no CSS modules |
| Animation | Framer Motion | Entrance animations, payment state transitions |
| Icons | Lucide React | Outline style only |
| Wallet | Wagmi v2 + Viem | Primary chain interaction layer |
| Wallet UI | RainbowKit | Browser wallet fallback only |
| Contract lang | Solidity 0.8.19 | Simple, no proxy patterns |
| Contract tooling | Hardhat + hardhat-celo | Deploy + verify on Celoscan |
| AI — text (V1) | Anthropic API | Model: `claude-haiku-4-5` |
| AI — image (V2) | Replicate API | Model: SDXL or Flux Schnell |
| AI — translation (V3) | LibreTranslate | Self-hosted |
| Deployment | Vercel | Frontend + Edge API routes |
| Chain | Celo Mainnet | chainId: 42220 |
| Payment token | cUSD | ERC-20, 18 decimals |

---

## Key Constants

```typescript
// lib/constants.ts

export const CHAIN_ID = 42220 // Celo Mainnet

export const CUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a'

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!

export const TASK_TYPES = {
  CAPTION:   1,
  EMAIL:     2,
  SUMMARY:   3,
  EXPLAIN:   4,
  IMAGE:     5,  // V2
  TRANSLATE: 6,  // V3
} as const

export const TASK_PRICES: Record<number, string> = {
  1: '0.10', // cUSD
  2: '0.25',
  3: '0.25',
  4: '0.10',
  5: '0.50', // V2
  6: '0.10', // V3
}

export const TASK_LABELS: Record<number, string> = {
  1: 'Caption writer',
  2: 'Email drafter',
  3: 'Text summarizer',
  4: 'Concept explainer',
  5: 'Image generator',  // V2
  6: 'Translator',       // V3
}

export const CELO_RPC = 'https://forno.celo.org'
```

---

## Environment Variables

```bash
# .env.example

# ── Public (safe in client) ──
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CUSD_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_CHAIN_ID=42220
NEXT_PUBLIC_APP_URL=https://microtask-agent.vercel.app

# ── Private (server-side only — never NEXT_PUBLIC_) ──
ANTHROPIC_API_KEY=sk-ant-...
REPLICATE_API_TOKEN=r8_...
LIBRETRANSLATE_URL=https://your-instance.railway.app
LIBRETRANSLATE_API_KEY=...
```

**Rule:** AI API keys must never appear in client-side code. If you see `NEXT_PUBLIC_ANTHROPIC_API_KEY` anywhere, that is a bug — remove it immediately.

---

## Core Flow (How It Works End to End)

```
1. User opens app in MiniPay or browser
2. MiniPay detected? → auto-connect | Browser? → RainbowKit modal
3. User picks a task type from the grid
4. User fills in input (text, tone, etc.)
5. User clicks "Pay & Generate"
6. UI calls approve(CONTRACT_ADDRESS, amount) on cUSD contract
7. UI calls requestTask(taskType) on MicroTaskPayment contract
   → contract calls cUSD.transferFrom(user, contract, price)
   → contract emits TaskRequested(user, taskType, amount, requestId, timestamp)
8. UI sends POST /api/task { txHash, taskType, userAddress, input }
9. Backend: getTransactionReceipt(txHash) from Celo RPC
10. Backend: decode logs → find TaskRequested event → verify user + taskType match
11. Backend: build system prompt → call AI provider
12. Backend: return { success: true, result: "..." }
13. UI displays result → user can copy, share, or run another task
```

**If step 10 fails** (tx not found, wrong contract, event mismatch) → return 403, never call AI.

---

## MiniPay-Specific Notes

- MiniPay injects `window.ethereum` with `isMiniPay: true`
- Auto-connect on load — do NOT show the wallet modal to MiniPay users
- Use `feeCurrency: CUSD_ADDRESS` on all transactions so users pay gas in cUSD
- MiniPay does not support `eth_signTypedData_v4` — avoid typed signatures
- Always test on actual MiniPay app, not just Chrome with MetaMask
- The MiniPay hook (detecting `isMiniPay` and adapting UX) gives a Proof of Ship score booster

```typescript
// hooks/useMiniPay.ts
export function useMiniPay() {
  const [isMiniPay, setIsMiniPay] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum?.isMiniPay) {
      setIsMiniPay(true)
    }
  }, [])
  return { isMiniPay }
}
```

---

## Smart Contract Summary

**File:** `contracts/MicroTaskPayment.sol`  
**Solidity:** `^0.8.19`  
**cUSD (mainnet):** `0x765DE816845861e75A25fCA122bb6898B8B1282a`  
**cUSD (testnet):** `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`

**Key functions:**
- `requestTask(uint8 taskType)` — transfers cUSD, emits `TaskRequested` event
- `withdraw()` — owner only, pulls accumulated cUSD
- `updatePrice(uint8 taskType, uint256 newPrice)` — owner only
- `getPrice(uint8 taskType)` — public view

**Critical:** The contract must be verified on Celoscan after mainnet deploy. Use `hardhat verify`.

---

## Backend: POST /api/task

**File:** `app/api/task/route.ts`

This is the only API route. It does three things in sequence:
1. **Verify** the tx onchain via Celo RPC — reject if invalid
2. **Route** to the correct AI provider based on `taskType`
3. **Return** the formatted result

**Request body:**
```typescript
{
  txHash:      string   // Celo tx hash
  taskType:    number   // 1–6
  userAddress: string   // connected wallet
  input: {
    text:      string   // required always
    tone?:     string   // caption only
    recipient?: string  // email only
    length?:   string   // summary only
    audience?: string   // explainer only
  }
}
```

**Response:**
```typescript
// Success
{ success: true,  result: string, taskType: number, chars: number, txHash: string }
// Error
{ success: false, error: string, code: string }
```

**Error codes:** `INVALID_TX` | `WRONG_CONTRACT` | `EVENT_NOT_FOUND` | `USER_MISMATCH` | `INVALID_TASK` | `AI_ERROR` | `RATE_LIMITED`

---

## Design System

**Aesthetic:** Dark-mode premium utility. High-end terminal meets consumer app. Dense but breathable.

```css
/* styles/globals.css — CSS tokens */
:root {
  --bg-primary:    #0A0A0F;
  --bg-secondary:  #111118;
  --bg-card:       #16161E;
  --border:        #2A2A38;
  --accent:        #7B61FF;   /* Purple */
  --accent-green:  #00D395;   /* cUSD / success */
  --accent-amber:  #F5A623;   /* Warning */
  --text-primary:  #F0F0FF;
  --text-secondary:#8888AA;
  --text-muted:    #4A4A66;
}
```

**Typography:**
- Display / monospace: `Space Mono` (Google Fonts)
- Body: `DM Sans` (Google Fonts)

**Component rules:**
- Minimum touch target: 44px (MiniPay mobile)
- Task cards: `rounded-2xl`, subtle border, hover glow
- Price badges: green pill with cUSD symbol
- Primary buttons: solid `--accent` fill
- All loading states: skeleton shimmer — never blank screens
- Modals: bottom sheet on mobile (not centered)

---

## What NOT To Do

- Never put AI API keys in client-side code or `NEXT_PUBLIC_` env vars
- Never call the AI provider before verifying the tx onchain
- Never use `ethers.js` — this project uses Viem exclusively
- Never use `localStorage` to store API keys or tx data beyond session history
- Never use `position: fixed` in components rendered inside MiniPay's browser
- Never skip the `approve()` step before `requestTask()` — the contract will revert
- Never use typed signatures (`eth_signTypedData_v4`) — MiniPay doesn't support them
- Never deploy without verifying the contract on Celoscan

---

## Commands

```bash
# Install
npm install

# Dev server
npm run dev

# Contract: compile
npx hardhat compile

# Contract: deploy to Alfajores testnet
npx hardhat run contracts/scripts/deploy.ts --network alfajores

# Contract: deploy to Celo Mainnet
npx hardhat run contracts/scripts/deploy.ts --network celo

# Contract: verify on Celoscan
npx hardhat verify --network celo <CONTRACT_ADDRESS> <CUSD_ADDRESS>

# Build for production
npm run build

# Type check
npm run type-check
```

---

## External Resources

| Resource | URL |
|---------|-----|
| Celo Docs | https://docs.celo.org |
| MiniPay Quickstart | https://docs.celo.org/developer/build-on-minipay/overview |
| Celo Composer | https://github.com/celo-org/celo-composer |
| Alfajores Faucet | https://faucet.celo.org |
| Alfajores Explorer | https://alfajores.celoscan.io |
| Celo Mainnet Explorer | https://celoscan.io |
| Celo Mainnet RPC | https://forno.celo.org |
| Anthropic API Docs | https://docs.anthropic.com |
| Replicate Docs | https://replicate.com/docs |
| talent.app | https://talent.app |
| Proof of Ship | https://talent.app/earn/proof-of-ship |
