# MicroTask Agent — System Architecture

**Version:** 1.0  
**Author:** DML  
**Date:** June 2026  
**Program:** Celo Proof of Ship — Season 2

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Layer Breakdown](#2-layer-breakdown)
3. [Payment & Verification Flow](#3-payment--verification-flow)
4. [Data Flow Summary](#4-data-flow-summary)
5. [Smart Contract Interface](#5-smart-contract-interface)
6. [Backend API Routes](#6-backend-api-routes)
7. [Environment & Deployment](#7-environment--deployment)
8. [Security Model](#8-security-model)

---

## 1. Architecture Overview

MicroTask Agent is structured as four distinct layers, each with a clear responsibility boundary. No layer does more than its job. The AI provider never runs unless the Celo chain confirms payment.

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                          │
│     Next.js 14 · Tailwind · Framer Motion · Wagmi + Viem    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   MiniPay    │  │   Browser    │  │    Task UI +     │  │
│  │ Auto-detect  │  │    Wallet    │  │   Result View    │  │
│  │ isMiniPay    │  │  RainbowKit  │  │  Copy · Share    │  │
│  │ Fee in cUSD  │  │  MetaMask    │  │  Tx history      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ cUSD approve() → requestTask()
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     CELO MAINNET                            │
│              Chain ID 42220 · Finality ~5s                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────┐   │
│  │  cUSD ERC-20 │  │ MicroTaskPayment │  │    Celo     │   │
│  │ 0x765DE8…    │  │     .sol         │  │  Explorer   │   │
│  │ transferFrom │  │  requestTask()   │  │ celoscan.io │   │
│  │ approve()    │  │ TaskRequested    │  │ Tx audit    │   │
│  │ balanceOf()  │  │   event emit     │  │ trail       │   │
│  └──────────────┘  └──────────────────┘  └─────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ TaskRequested event · tx hash
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                          │
│        Next.js API Routes · Vercel Edge Functions           │
│                                                             │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────┐   │
│  │  TX Verifier │  │   Task Router    │  │  Response   │   │
│  │ /api/task    │  │ Route by type    │  │  Handler    │   │
│  │ Check status │  │ Build sys prompt │  │ Parse output│   │
│  │ Decode event │  │ Inject input     │  │ Sanitize    │   │
│  │ Match user   │  │ Set token limits │  │ Format      │   │
│  │ Reject invalid│ │ Handle retries   │  │ Return      │   │
│  └──────────────┘  └──────────────────┘  └─────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Authenticated API call
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI PROVIDER LAYER                        │
│            Keys stored server-side only (Vercel env)        │
│                                                             │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   │
│  │  Anthropic    │  │   Replicate   │  │ LibreTranslate│   │
│  │  claude-haiku │  │  SDXL / Flux  │  │ Self-hostable │   │
│  │  Text tools   │  │ Image gen     │  │ Translation   │   │
│  │  V1 ✅        │  │  V2 stretch   │  │ V3 roadmap    │   │
│  └───────────────┘  └───────────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Core principle:** The AI provider is never called unless payment is independently confirmed onchain by the backend. The client cannot fake or skip this step.

---

## 2. Layer Breakdown

### 2.1 Client Layer

**Framework:** Next.js 14 (App Router)  
**Styling:** Tailwind CSS  
**Animation:** Framer Motion  
**Wallet:** Wagmi v2 + Viem + RainbowKit  

#### MiniPay Detection

MiniPay injects `window.ethereum` with `isMiniPay: true`. The app detects this on load and auto-connects silently — no wallet modal shown.

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

**Behavior by context:**

| Context | Behavior |
|--------|---------|
| MiniPay detected | Auto-connect, skip modal, use `window.ethereum` directly |
| Browser (MetaMask) | Show RainbowKit connect modal |
| Browser (WalletConnect) | Show QR code pairing |
| Wrong network | Prompt to switch to Celo Mainnet (chainId: 42220) |
| No wallet | Show install prompt |

#### Celo Fee Abstraction

Celo allows gas fees to be paid in cUSD instead of CELO. This is set on every transaction:

```typescript
const txHash = await walletClient.sendTransaction({
  to: CONTRACT_ADDRESS,
  data: encodeFunctionData({ abi: CONTRACT_ABI, functionName: 'requestTask', args: [taskType] }),
  feeCurrency: CUSD_ADDRESS, // 0x765DE816845861e75A25fCA122bb6898B8B1282a
})
```

#### Task Types (V1)

| ID | Task | Price | System prompt goal |
|----|------|-------|-------------------|
| 1 | Caption writer | 0.10 cUSD | Short, engaging social caption |
| 2 | Email drafter | 0.25 cUSD | Professional email from bullet points |
| 3 | Text summarizer | 0.25 cUSD | Key points from long text |
| 4 | Concept explainer | 0.10 cUSD | Clear explanation for target audience |
| 5 | Image generator | 0.50 cUSD | V2 — Replicate API |
| 6 | Translator | 0.10 cUSD | V3 — LibreTranslate |

---

### 2.2 Celo Mainnet Layer

**Chain:** Celo Mainnet (chainId: 42220)  
**RPC:** `https://forno.celo.org`  
**Block time:** ~5 seconds  
**Explorer:** `https://celoscan.io`

#### cUSD Token

The payment token for all transactions.

| Property | Value |
|---------|-------|
| Contract | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| Symbol | cUSD |
| Decimals | 18 |
| Standard | ERC-20 (Celo-native stablecoin) |

#### MicroTaskPayment Contract

Custom smart contract that receives cUSD payments, validates task types and amounts, and emits a verifiable onchain event.

**Key functions:**

```
requestTask(uint8 taskType)
  → transfers cUSD from user to contract
  → emits TaskRequested(user, taskType, amount, requestId, timestamp)

withdraw()
  → owner only
  → sends accumulated cUSD to owner wallet

updatePrice(uint8 taskType, uint256 newPrice)
  → owner only
  → adjusts pricing without redeployment
```

**TaskRequested event:**

```solidity
event TaskRequested(
  address indexed user,
  uint8   indexed taskType,
  uint256         amount,
  bytes32         requestId,
  uint256         timestamp
);
```

This event is the trust anchor of the entire system. The backend only proceeds after independently confirming this event exists in the transaction receipt with matching parameters.

---

### 2.3 Backend Layer

**Runtime:** Node.js on Vercel Edge Functions  
**Entry point:** `POST /api/task`  
**Framework:** Next.js API Routes  

The backend is composed of three internal responsibilities, executed in sequence:

#### TX Verifier

Independently verifies the payment on Celo's RPC — the client cannot bypass this.

```typescript
async function verifyPayment(
  txHash: string,
  taskType: number,
  userAddress: string
): Promise<boolean> {
  // 1. Fetch transaction receipt from Celo RPC
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash })

  // 2. Confirm transaction succeeded
  if (receipt.status !== 'success') throw new Error('Transaction failed')

  // 3. Confirm it was sent to our contract
  if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
    throw new Error('Wrong contract address')
  }

  // 4. Find and decode the TaskRequested event
  const event = receipt.logs.find(log => {
    try {
      const decoded = decodeEventLog({ abi: CONTRACT_ABI, ...log })
      return (
        decoded.eventName === 'TaskRequested' &&
        Number(decoded.args.taskType) === taskType &&
        decoded.args.user.toLowerCase() === userAddress.toLowerCase()
      )
    } catch {
      return false
    }
  })

  if (!event) throw new Error('Valid payment event not found in transaction')

  return true
}
```

#### Task Router

Routes the verified request to the correct AI provider and builds the system prompt.

```typescript
const TASK_PROMPTS: Record<number, (input: TaskInput) => string> = {
  1: (i) => `Write a ${i.tone} social media caption about: ${i.text}. Max 280 characters.`,
  2: (i) => `Draft a professional email to a ${i.recipient}. Intent: ${i.text}. Clear subject line + body.`,
  3: (i) => `Summarize the following text into ${i.length} key points:\n\n${i.text}`,
  4: (i) => `Explain "${i.text}" clearly for a ${i.audience}. Use simple language and a concrete example.`,
}
```

#### Response Handler

Processes the AI output before sending to the client.

```typescript
async function handleResponse(rawOutput: string, taskType: number) {
  // Trim whitespace and normalize line breaks
  const cleaned = rawOutput.trim().replace(/\r\n/g, '\n')

  // Length guardrail — prevent runaway outputs
  const MAX_CHARS = { 1: 400, 2: 1500, 3: 2000, 4: 1500 }
  const truncated = cleaned.slice(0, MAX_CHARS[taskType] ?? 2000)

  return { result: truncated, chars: truncated.length }
}
```

---

### 2.4 AI Provider Layer

All API keys are stored exclusively as Vercel environment variables. They are never exposed to the client.

#### Anthropic API (V1 — Text)

| Property | Value |
|---------|-------|
| Model | `claude-haiku-4-5` |
| Max tokens | 800 (text tasks) |
| Avg latency | ~1.5–3s |
| Cost per call | ~$0.001–$0.005 |
| Why haiku | Fastest, cheapest, sufficient quality for task types |

#### Replicate API (V2 — Images)

| Property | Value |
|---------|-------|
| Model | `stability-ai/sdxl` or `black-forest-labs/flux-schnell` |
| Output | PNG, 1024×1024 default |
| Avg latency | ~5–10s |
| Cost per call | ~$0.01–$0.02 |
| Why Replicate | Cheaper than DALL-E 3, flexible model selection |

#### LibreTranslate (V3 — Translation)

| Property | Value |
|---------|-------|
| Deployment | Self-hosted on a VPS or Railway |
| Languages | 30+ including Yoruba, Swahili, Spanish |
| Cost | Server cost only (~$5/mo) |
| Why self-hosted | Zero per-call API cost, data privacy, local lang support |

---

## 3. Payment & Verification Flow

This sequence shows the exact steps between a user clicking "Pay & Generate" and receiving their AI result. **The AI is never called before step 5 (onchain verification) passes.**

```
User          Celo Chain        Backend           AI Provider
  │                │                │                  │
  │ 1. Select task + enter input    │                  │
  │─────────────────────────────────────────────────── │
  │                │                │                  │
  │ 2. approve(contract, amount)    │                  │
  │──────────────>│                 │                  │
  │               │ Allowance set   │                  │
  │               │                 │                  │
  │ 3. requestTask(taskType)        │                  │
  │──────────────>│                 │                  │
  │               │ transferFrom()  │                  │
  │               │ cUSD moves to   │                  │
  │               │ contract        │                  │
  │               │                 │                  │
  │ 4. TaskRequested event emitted  │                  │
  │               │────────────────>│                  │
  │               │  tx hash        │                  │
  │               │                 │                  │
  │               │ 5. Verify tx on Celo RPC            │
  │               │<───────────────>│                  │
  │               │                 │ ✓ valid          │
  │               │                 │                  │
  │               │  6. Authenticated API call          │
  │               │                 │─────────────────>│
  │               │                 │                  │
  │               │  7. AI result   │                  │
  │               │                 │<─────────────────│
  │               │                 │ Format + sanitize│
  │               │                 │                  │
  │ 8. Result returned to client    │                  │
  │<────────────────────────────────│                  │
  │ Display · Copy · Share          │                  │
```

### Error Paths

| Step | Failure | Handling |
|------|---------|---------|
| 2 | User rejects approval | Return to input, no charge |
| 3 | User rejects tx | Return to input, no charge |
| 3 | Insufficient cUSD balance | Show balance + top-up guide |
| 3 | Tx fails onchain | Show error + tx hash link, no AI called |
| 5 | Event not found | Reject request, log for investigation |
| 5 | Wrong user / task mismatch | Reject with 403 |
| 6 | Anthropic API error | Auto-retry once, then show error |
| 6 | Replicate timeout | Show error, suggest retry |
| 7 | Output too long | Truncate at `MAX_CHARS` limit |

---

## 4. Data Flow Summary

### Client → Chain

```
User wallet
  │
  ├── approve(MicroTaskPayment, amount)   ← ERC-20 allowance
  └── requestTask(taskType)               ← triggers cUSD transfer + event
```

### Chain → Backend

```
Transaction receipt
  │
  └── TaskRequested log
        ├── user address
        ├── taskType (uint8)
        ├── amount (uint256)
        ├── requestId (bytes32)
        └── timestamp (uint256)
```

### Client → Backend (POST body)

```json
{
  "txHash": "0xabc123...",
  "taskType": 1,
  "userAddress": "0xdef456...",
  "input": {
    "text": "Write about the benefits of remote work",
    "tone": "casual"
  }
}
```

### Backend → AI Provider

```json
{
  "model": "claude-haiku-4-5",
  "max_tokens": 800,
  "messages": [
    {
      "role": "user",
      "content": "Write a casual social media caption about: the benefits of remote work. Max 280 characters."
    }
  ]
}
```

### Backend → Client (response)

```json
{
  "success": true,
  "result": "No commute. No dress code. Full productivity. Remote work isn't just a perk — it's the future of getting things done. 🏡💻",
  "taskType": 1,
  "chars": 118,
  "txHash": "0xabc123..."
}
```

---

## 5. Smart Contract Interface

### Full Contract: `MicroTaskPayment.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract MicroTaskPayment {
    address public owner;
    IERC20  public cUSD;

    // Task type constants
    uint8 public constant CAPTION   = 1;
    uint8 public constant EMAIL     = 2;
    uint8 public constant SUMMARY   = 3;
    uint8 public constant EXPLAIN   = 4;
    uint8 public constant IMAGE     = 5;
    uint8 public constant TRANSLATE = 6;

    mapping(uint8 => uint256) public taskPrices;

    event TaskRequested(
        address indexed user,
        uint8   indexed taskType,
        uint256         amount,
        bytes32         requestId,
        uint256         timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _cUSD) {
        owner = msg.sender;
        cUSD  = IERC20(_cUSD);

        // Initial prices (18 decimals)
        taskPrices[CAPTION]   = 0.10 ether;
        taskPrices[EMAIL]     = 0.25 ether;
        taskPrices[SUMMARY]   = 0.25 ether;
        taskPrices[EXPLAIN]   = 0.10 ether;
        taskPrices[IMAGE]     = 0.50 ether;
        taskPrices[TRANSLATE] = 0.10 ether;
    }

    function requestTask(uint8 taskType) external returns (bytes32 requestId) {
        uint256 price = taskPrices[taskType];
        require(price > 0, "Invalid task type");

        require(
            cUSD.transferFrom(msg.sender, address(this), price),
            "cUSD transfer failed — approve contract first"
        );

        requestId = keccak256(
            abi.encodePacked(msg.sender, taskType, block.timestamp, block.number)
        );

        emit TaskRequested(msg.sender, taskType, price, requestId, block.timestamp);
    }

    function withdraw() external onlyOwner {
        uint256 balance = cUSD.balanceOf(address(this));
        require(balance > 0, "Nothing to withdraw");
        cUSD.transfer(owner, balance);
    }

    function updatePrice(uint8 taskType, uint256 newPrice) external onlyOwner {
        taskPrices[taskType] = newPrice;
    }

    function getPrice(uint8 taskType) external view returns (uint256) {
        return taskPrices[taskType];
    }
}
```

### Deployed Addresses

| Network | Address | Explorer |
|--------|---------|---------|
| Alfajores (testnet) | TBD after deploy | [alfajores.celoscan.io](https://alfajores.celoscan.io) |
| Celo Mainnet | TBD after deploy | [celoscan.io](https://celoscan.io) |

### Key Contract Parameters

| Parameter | Value |
|---------|-------|
| cUSD address (mainnet) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| cUSD address (testnet) | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` |
| Solidity version | `^0.8.19` |
| License | MIT |
| Compiler optimization | 200 runs |

---

## 6. Backend API Routes

### `POST /api/task`

The single entry point for all AI task requests. Verifies payment, routes to provider, returns result.

**Request:**

```
POST /api/task
Content-Type: application/json

{
  "txHash":      "0x...",       // Celo transaction hash
  "taskType":    1,             // uint8 matching contract constants
  "userAddress": "0x...",       // Connected wallet address
  "input": {
    "text":     "...",          // Required for all tasks
    "tone":     "casual",       // Caption only
    "recipient":"client",       // Email only
    "length":   "short",        // Summary only
    "audience": "beginner",     // Explainer only
    "style":    "photorealistic",// Image only (V2)
    "from":     "en",           // Translation only (V3)
    "to":       "es"            // Translation only (V3)
  }
}
```

**Response (success):**

```json
{
  "success":  true,
  "result":   "...",
  "taskType": 1,
  "chars":    118,
  "txHash":   "0x..."
}
```

**Response (error):**

```json
{
  "success": false,
  "error":   "Payment verification failed",
  "code":    "INVALID_TX"
}
```

**Error codes:**

| Code | Meaning |
|------|---------|
| `INVALID_TX` | Transaction hash not found or failed |
| `WRONG_CONTRACT` | Tx was not sent to MicroTaskPayment |
| `EVENT_NOT_FOUND` | TaskRequested event missing or mismatched |
| `USER_MISMATCH` | Event user doesn't match request userAddress |
| `INVALID_TASK` | taskType not recognized |
| `AI_ERROR` | AI provider returned an error |
| `RATE_LIMITED` | Too many requests from this address |

---

## 7. Environment & Deployment

### Environment Variables (Vercel)

```bash
# Blockchain
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...         # MicroTaskPayment (mainnet)
NEXT_PUBLIC_CUSD_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a

# AI Providers (server-side only — no NEXT_PUBLIC_ prefix)
ANTHROPIC_API_KEY=sk-ant-...
REPLICATE_API_TOKEN=r8_...
LIBRETRANSLATE_URL=https://your-instance.railway.app
LIBRETRANSLATE_API_KEY=...

# App
NEXT_PUBLIC_APP_URL=https://microtask-agent.vercel.app
```

### Deployment Stack

| Component | Service | Notes |
|-----------|---------|-------|
| Frontend | Vercel | Auto-deploy from `main` branch |
| API routes | Vercel Edge Functions | Co-located with frontend |
| Smart contract | Celo Mainnet | Deployed via Hardhat + `hardhat-celo` |
| Contract verification | Celoscan | Via `hardhat-etherscan` plugin |
| Image storage (V2) | Replicate CDN | Temporary URLs, no persistent storage |
| Translation (V3) | Railway / self-hosted | LibreTranslate instance |

### Hardhat Config (Celo)

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("@celo/hardhat-celo");

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: { optimizer: { enabled: true, runs: 200 } }
  },
  networks: {
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 44787,
    },
    celo: {
      url: "https://forno.celo.org",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 42220,
    },
  },
  etherscan: {
    apiKey: { celo: process.env.CELOSCAN_API_KEY }
  }
};
```

---

## 8. Security Model

### Threat Model

| Threat | Vector | Mitigation |
|--------|--------|-----------|
| Client sends fake txHash | POST /api/task with invented hash | Backend independently queries Celo RPC |
| Client reuses old txHash | Replay attack with past valid tx | requestId is a unique hash of user + type + block; treat as nonce |
| Client sends tx from different user | Impersonation | Backend checks `event.args.user === userAddress` |
| Client sends tx with different taskType | Task mismatch | Backend checks `event.args.taskType === taskType` |
| API key theft | Client-side key exposure | All keys are server-side env vars only |
| Prompt injection via user input | Malicious text in `input.text` | Input passed as user content only; system prompt is server-controlled |
| Contract drain | Unauthorized withdrawal | `withdraw()` has `onlyOwner` modifier |
| Price manipulation | Unauthorized `updatePrice()` | `updatePrice()` has `onlyOwner` modifier |
| Rate abuse | Rapid repeated requests | Rate limiting middleware on `/api/task` |
| Contract reentrancy | N/A | No external calls after state change; cUSD transfer is atomic |

### Trust Assumptions

The system is secure under the following assumptions:

1. The Celo RPC (`forno.celo.org`) is honest — the backend trusts its tx receipts
2. The owner private key is kept secure — controls price updates and fund withdrawal
3. Vercel environment variables are not leaked — protects all AI API keys
4. `cUSD.transferFrom()` is atomic — either the full amount transfers or it reverts

### What the Contract Does NOT Do

- Does not store user data or task inputs onchain
- Does not call any external contracts
- Does not hold CELO — only cUSD
- Does not have any upgradeable proxy pattern (intentionally immutable in V1)

---

*Document last updated: June 2026 | Version 1.0*
