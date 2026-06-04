# MicroTask Agent — Product Requirements Document

**Version:** 1.0  
**Author:** DML  
**Date:** June 2026  
**Program:** Celo Proof of Ship — Season 2 (June Edition)  
**Submission Deadline:** June 22, 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Target Users](#4-target-users)
5. [Goals & Success Metrics](#5-goals--success-metrics)
6. [Product Scope](#6-product-scope)
7. [Feature Specifications](#7-feature-specifications)
8. [Technical Architecture](#8-technical-architecture)
9. [Smart Contract Design](#9-smart-contract-design)
10. [MiniPay Integration](#10-minipay-integration)
11. [UI/UX Requirements](#11-uiux-requirements)
12. [Pricing Model](#12-pricing-model)
13. [Progressive Roadmap](#13-progressive-roadmap)
14. [20-Day Sprint Plan](#14-20-day-sprint-plan)
15. [Competitive Analysis](#15-competitive-analysis)
16. [Risks & Mitigations](#16-risks--mitigations)
17. [Open Questions](#17-open-questions)

---

## 1. Executive Summary

**MicroTask Agent** is a pay-per-use AI toolbox built on Celo, distributed through MiniPay. Users access powerful AI capabilities — text generation, image creation, and translation — by paying tiny fixed amounts in cUSD per request. No account creation. No monthly subscription. No credit card. Just connect your wallet, pay for exactly what you need, and get results instantly.

The product is designed for the 14M+ MiniPay users across emerging markets, where access to AI tools is limited by payment infrastructure, prohibitive subscription costs, and lack of globally accepted payment methods. cUSD is the payment rail, Celo is the settlement layer, and an AI agent is the value delivery mechanism.

---

## 2. Problem Statement

### The Gap
AI tools like ChatGPT, Midjourney, and DeepL have transformed how people work — but their access models are broken for most of the world:

- **Subscriptions are expensive.** $20/month is a significant cost in markets where the average daily income is under $10.
- **Payment methods don't work.** Credit cards are inaccessible for a large portion of MiniPay's user base in Africa and Southeast Asia.
- **Usage is sporadic.** Most users don't need AI tools daily — they need them occasionally, for specific tasks. Paying for a full month to use a tool twice is wasteful.
- **Account fatigue.** Creating new accounts, verifying email, setting up profiles — every friction point loses users.

### The Opportunity
MiniPay has 14M+ wallets across 60+ countries. These users already hold and transact with cUSD daily. An AI tool that accepts cUSD, requires no account, and charges only for what's used is a fundamentally new access model — one that fits their actual behavior.

Celo's Proof of Ship program explicitly lists *"pay as you go access to LLMs and image creation tools, as an alternative to subscriptions"* as a desired category — validating this as a high-priority product for the ecosystem.

---

## 3. Solution Overview

MicroTask Agent is a responsive web application (optimized for MiniPay's in-app browser) that provides three AI capabilities through a micro-payment model:

| Tool | What It Does | Cost per Request |
|------|-------------|-----------------|
| ✍️ Text Tools | Write captions, emails, summaries, essays | 0.10 – 0.50 cUSD |
| 🎨 Image Generator | Generate images from text prompts | 0.50 cUSD |
| 🌐 Translator | Translate text between languages | 0.10 cUSD |

**How it works:**
1. User opens the app in MiniPay or browser
2. Selects a task type and enters their input
3. Pays the fixed cUSD fee onchain (one tap in MiniPay)
4. Smart contract confirms payment and emits an event
5. Backend picks up the event and calls the AI provider
6. Result is returned and displayed — copyable, downloadable

**Key principle:** The AI agent never runs unless payment is confirmed onchain. No payment = no output.

---

## 4. Target Users

### Primary: MiniPay Users in Emerging Markets
- Location: Nigeria, Kenya, Ghana, South Africa, Philippines, Colombia
- Device: Mobile-first, Android
- Profile: Young professionals, students, freelancers, small business owners
- Need: Occasional AI access for work tasks — writing, translation, image creation
- Willingness to pay: High for per-use, low for subscriptions

### Secondary: Crypto-native Users (Browser)
- Location: Global
- Device: Desktop or mobile browser
- Profile: Web3 developers, crypto enthusiasts, power users
- Need: Same AI tools, prefer crypto-native payment over cards
- Extra value: No account, censorship-resistant access

### Tertiary: Developers / Power Users
- Use the product as a reference implementation for MiniPay + AI agent patterns
- May fork or build on top of the open-source repo

---

## 5. Goals & Success Metrics

### Program Goals (by June 22nd)
| Metric | Target |
|--------|--------|
| Deployed to Celo Mainnet | ✅ Required |
| Verified smart contract | ✅ Required |
| Public GitHub repo (open source) | ✅ Required |
| Onchain transactions | 50+ |
| Unique active wallets | 20+ |
| GitHub commits | 40+ across 20 days |
| MiniPay hook implemented | ✅ Score booster |

### Product Goals (V1)
- End-to-end flow working: connect wallet → select task → pay → receive result
- Text generation tools fully functional (3+ task types)
- Mobile-optimized for MiniPay browser
- Sub-5 second result delivery after payment confirmation
- Zero failed transactions due to contract bugs

### Business Goals (Season 2+)
- Establish onchain reputation as a credible, recurring builder on Celo
- Qualify for Celo Grants and Prezenti Grants post-program
- Grow to 500+ unique users by end of Season 2

---

## 6. Product Scope

### In Scope (V1 — June 22nd)
- Wallet connection (MiniPay auto-detect + RainbowKit/wagmi fallback)
- Payment flow with Celo smart contract
- Text generation: Caption Writer, Email Drafter, Text Summarizer, Concept Explainer
- Result display with copy-to-clipboard
- Transaction history (session-based, no backend storage needed)
- Mobile-first responsive design
- Mainnet deployment with verified contract

### In Scope (V2 — stretch goal within sprint)
- Image generation from text prompts (via Replicate/fal.ai)
- Image download functionality
- Prompt history (localStorage)

### Out of Scope (V1)
- User accounts / authentication
- Persistent server-side history
- Translation tools (V3)
- Batch processing
- NFT minting of generated images
- Referral or reward system
- Multi-language UI

---

## 7. Feature Specifications

### 7.1 Wallet Connection

**MiniPay Detection:**
```javascript
const isMiniPay = typeof window !== 'undefined' && window.ethereum?.isMiniPay === true
```

- If MiniPay detected: auto-connect silently, skip wallet modal entirely
- If browser: show "Connect Wallet" button — support MetaMask, Valora, and WalletConnect
- Celo network enforced: if user is on wrong network, prompt to switch to Celo Mainnet (chainId: 42220)
- Show connected address (shortened) and cUSD balance in header

**Error states:**
- No wallet detected → show install MiniPay / MetaMask prompt
- Wrong network → "Switch to Celo Mainnet" CTA
- Insufficient balance → show balance + top-up guidance

---

### 7.2 Task Selection

A clean task picker UI with 4 cards in V1:

| Task | Icon | Description | Price |
|------|------|-------------|-------|
| Caption Writer | ✍️ | Write social media captions from a topic or image description | 0.10 cUSD |
| Email Drafter | 📧 | Draft professional emails from bullet points or intent | 0.25 cUSD |
| Text Summarizer | 📄 | Summarize long text into key points | 0.25 cUSD |
| Concept Explainer | 💡 | Explain any topic simply | 0.10 cUSD |

Each card shows: task name, description, price badge, and a "Use" button.

---

### 7.3 Input Interface

Per-task input form:
- **Caption Writer:** Topic/description textarea + tone selector (professional, casual, funny, viral)
- **Email Drafter:** Intent textarea + recipient type selector (client, colleague, boss, cold outreach)
- **Text Summarizer:** Paste text area (max 2000 chars in V1) + summary length selector (short/medium/detailed)
- **Concept Explainer:** Topic input + audience selector (beginner, intermediate, expert)

Each input view shows:
- Task name + price prominently
- Character/word count indicator where relevant
- "Pay & Generate" primary CTA button (disabled until input is valid)
- Estimated delivery time ("Results in ~3–5 seconds")

---

### 7.4 Payment Flow

**Step 1 — Pre-payment confirmation:**
- Modal showing: task type, input preview, exact cUSD cost, wallet address, current balance
- "Confirm & Pay" button triggers the contract call

**Step 2 — Transaction in progress:**
- Spinner + "Waiting for confirmation…" state
- Transaction hash displayed (linkable to Celo Explorer)
- Timeout handling: if no confirmation after 30s, show retry option

**Step 3 — Payment confirmed:**
- Brief success flash ("Payment confirmed ✓")
- Immediately transitions to "Generating result…" state with progress animation

**Step 4 — Result delivery:**
- Result displayed in a clean output card
- Copy button (copies full text)
- "Try another" CTA
- "Share result" option (copies shareable text)

**Step 5 — Error handling:**
- Transaction rejected by user → return to input with message
- Transaction failed onchain → show error + refund note (contract design handles this)
- AI provider error → retry once automatically, then show error with support link

---

### 7.5 Transaction History (Session)

- Sidebar or bottom sheet showing current session's transactions
- Each entry: task type, timestamp, tx hash (linked), result preview
- Persisted in localStorage for 24 hours
- "View on Celo Explorer" link per transaction

---

### 7.6 Image Generation (V2)

**Input:**
- Prompt textarea (max 200 chars)
- Style selector: Photorealistic, Illustration, Pixel Art, Abstract
- Aspect ratio selector: Square, Portrait, Landscape

**Output:**
- Image displayed in result card
- Download button (PNG)
- "Regenerate" option (costs another 0.50 cUSD)
- Share button

**Provider:** Replicate API (SDXL or Flux model — cost-effective, fast)

---

## 8. Technical Architecture

```
┌──────────────────────────────────────────────────────┐
│                     CLIENT LAYER                     │
│   Next.js 14 App Router + Tailwind + Framer Motion   │
│                                                      │
│   MiniPay Detection → Auto-connect                   │
│   Wagmi + Viem → Contract interaction                │
│   RainbowKit → Fallback wallet modal                 │
└──────────────────┬───────────────────────────────────┘
                   │ Payment TX
                   ▼
┌──────────────────────────────────────────────────────┐
│              CELO MAINNET (Smart Contract)           │
│                                                      │
│   MicroTaskPayment.sol                               │
│   - Receives cUSD payments                           │
│   - Validates task type + amount                     │
│   - Emits TaskRequested event                        │
│   - Owner can withdraw accumulated fees              │
└──────────────────┬───────────────────────────────────┘
                   │ Event emitted
                   ▼
┌──────────────────────────────────────────────────────┐
│                    BACKEND LAYER                     │
│   Next.js API Routes (Vercel Edge Functions)         │
│                                                      │
│   /api/task                                          │
│   - Verifies TX hash on Celo RPC                     │
│   - Validates event matches request                  │
│   - Calls AI provider                               │
│   - Returns result                                   │
└──────────────────┬───────────────────────────────────┘
                   │ AI API call
                   ▼
┌──────────────────────────────────────────────────────┐
│                   AI PROVIDER LAYER                  │
│                                                      │
│   V1: Anthropic API (claude-haiku — text tools)      │
│   V2: Replicate API (SDXL/Flux — image generation)   │
│   V3: DeepL / LibreTranslate (translation)           │
└──────────────────────────────────────────────────────┘
```

### Key Design Decisions

**Why Next.js API Routes (not a separate backend)?**
Simplest deployment path. Vercel handles scaling. No separate server to manage. Edge functions keep latency low for global users.

**Why verify TX onchain in the backend?**
Security. A client could lie about having paid. The backend independently queries the Celo RPC to confirm the event was emitted with the correct parameters before calling any AI provider.

**Why Anthropic claude-haiku for text?**
Fastest model, lowest cost per token. Text tasks don't require claude-sonnet-level capability. Keeps margins high and response times low.

**Why Replicate for images?**
Much cheaper than DALL-E 3 or Stability AI's hosted API. SDXL and Flux models produce high-quality outputs at ~$0.01–0.02 per image.

---

## 9. Smart Contract Design

### Contract: `MicroTaskPayment.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract MicroTaskPayment {
    address public owner;
    IERC20 public cUSD;

    // Task type IDs
    uint8 public constant CAPTION = 1;
    uint8 public constant EMAIL = 2;
    uint8 public constant SUMMARY = 3;
    uint8 public constant EXPLAIN = 4;
    uint8 public constant IMAGE = 5;
    uint8 public constant TRANSLATE = 6;

    // Prices in cUSD (6 decimals)
    mapping(uint8 => uint256) public taskPrices;

    event TaskRequested(
        address indexed user,
        uint8 indexed taskType,
        uint256 amount,
        bytes32 requestId,
        uint256 timestamp
    );

    constructor(address _cUSD) {
        owner = msg.sender;
        cUSD = IERC20(_cUSD);

        // Set prices (cUSD has 18 decimals on Celo)
        taskPrices[CAPTION]   = 0.10 ether;
        taskPrices[EMAIL]     = 0.25 ether;
        taskPrices[SUMMARY]   = 0.25 ether;
        taskPrices[EXPLAIN]   = 0.10 ether;
        taskPrices[IMAGE]     = 0.50 ether;
        taskPrices[TRANSLATE] = 0.10 ether;
    }

    function requestTask(uint8 taskType) external returns (bytes32 requestId) {
        require(taskPrices[taskType] > 0, "Invalid task type");
        uint256 price = taskPrices[taskType];

        require(
            cUSD.transferFrom(msg.sender, address(this), price),
            "Payment failed"
        );

        requestId = keccak256(
            abi.encodePacked(msg.sender, taskType, block.timestamp, block.number)
        );

        emit TaskRequested(msg.sender, taskType, price, requestId, block.timestamp);
    }

    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        uint256 balance = cUSD.balanceOf(address(this));
        require(balance > 0, "Nothing to withdraw");
        cUSD.transfer(owner, balance);
    }

    function updatePrice(uint8 taskType, uint256 newPrice) external {
        require(msg.sender == owner, "Not owner");
        taskPrices[taskType] = newPrice;
    }
}
```

### Backend Verification Logic

```javascript
// /api/task/route.ts
async function verifyPayment(txHash: string, taskType: number, userAddress: string) {
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash })
  
  // Check transaction succeeded
  if (receipt.status !== 'success') throw new Error('Transaction failed')
  
  // Check it's our contract
  if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
    throw new Error('Wrong contract')
  }
  
  // Find TaskRequested event in logs
  const event = receipt.logs.find(log => {
    // Decode and match taskType + userAddress
    const decoded = decodeEventLog({ abi: CONTRACT_ABI, ...log })
    return decoded.eventName === 'TaskRequested' 
      && decoded.args.taskType === taskType
      && decoded.args.user.toLowerCase() === userAddress.toLowerCase()
  })
  
  if (!event) throw new Error('Payment event not found')
  
  return true
}
```

### cUSD Contract Address (Celo Mainnet)
`0x765DE816845861e75A25fCA122bb6898B8B1282a`

---

## 10. MiniPay Integration

### Detection & Auto-connect

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

### MiniPay-specific Behavior
- Auto-connect on load (no wallet modal shown)
- Use `window.ethereum` directly with Viem's custom transport
- cUSD is the default token — no ETH gas needed (Celo supports fee abstraction)
- MiniPay handles transaction signing natively within its browser

### Celo Fee Abstraction
Celo allows users to pay gas fees in cUSD instead of CELO. For MiniPay users:
```typescript
const txHash = await walletClient.sendTransaction({
  to: CONTRACT_ADDRESS,
  data: encodeFunctionData({ ... }),
  feeCurrency: CUSD_ADDRESS, // Pay gas in cUSD
})
```

### Score Booster
Implementing the MiniPay hook (detecting `isMiniPay` and adapting UX) qualifies the project for a score boost in the Proof of Ship leaderboard evaluation.

---

## 11. UI/UX Requirements

### Design System

**Aesthetic direction:** Dark-mode premium utility. Think a high-end terminal meets a consumer app. Not startup-generic. Dense but breathable.

**Color palette:**
```css
--bg-primary: #0A0A0F;
--bg-secondary: #111118;
--bg-card: #16161E;
--border: #2A2A38;
--accent: #7B61FF;        /* Purple — Celo ecosystem alignment */
--accent-green: #00D395;  /* cUSD/success states */
--accent-amber: #F5A623;  /* Warnings */
--text-primary: #F0F0FF;
--text-secondary: #8888AA;
--text-muted: #4A4A66;
```

**Typography:**
- Display: `Space Mono` (monospace, technical credibility)
- Body: `DM Sans` (readable, warm, modern)

**Component principles:**
- All interactive elements: 44px minimum touch target (MiniPay mobile)
- Task cards: rounded-2xl, subtle border, hover glow effect
- Buttons: solid accent fill for primary, ghost for secondary
- Price badges: green pill with cUSD symbol
- Loading states: skeleton shimmer, never blank screens

### Screen Flow

```
App Load
    │
    ├── MiniPay detected? → Auto-connect → Home
    └── Browser → Connect Wallet CTA → Home

Home
    │
    └── Task Grid (4 cards V1)
            │
            └── Select Task → Input Screen
                                    │
                                    └── "Pay & Generate" → Payment Modal
                                                                │
                                                                └── TX in Progress → 
                                                                    Result Screen →
                                                                    Home / Try Again
```

### Mobile Optimization
- Full-width single-column layout on mobile
- Bottom sheet for modals (not centered modal — awkward on mobile)
- Sticky "Pay & Generate" button at bottom of input screens
- Haptic feedback cues via Vibration API where available
- Max content width 480px on mobile, centered on desktop

---

## 12. Pricing Model

### User-facing Prices (V1)

| Task | Price | Notes |
|------|-------|-------|
| Caption Writer | 0.10 cUSD | Short output, fast |
| Concept Explainer | 0.10 cUSD | Short output, fast |
| Email Drafter | 0.25 cUSD | Medium output |
| Text Summarizer | 0.25 cUSD | Depends on input size |
| Image Generator | 0.50 cUSD | V2 |
| Translator | 0.10 cUSD | V3 |

### Unit Economics

| Task | Price | API Cost | Gas (est.) | Margin |
|------|-------|----------|-----------|--------|
| Caption | $0.10 | ~$0.001 | ~$0.001 | ~98% |
| Email | $0.25 | ~$0.005 | ~$0.001 | ~98% |
| Summary | $0.25 | ~$0.005 | ~$0.001 | ~98% |
| Image | $0.50 | ~$0.02 | ~$0.001 | ~96% |

### Price Design Rationale
- Prices are low enough to feel like "pocket change" — lower friction than any subscription
- Prices are high enough to cover API costs at 95%+ margin
- cUSD denomination keeps prices stable (not volatile like CELO)
- Prices are adjustable by contract owner (updatePrice function) — can tune without redeployment

---

## 13. Progressive Roadmap

### V1 — Core Text Tools (June 22nd target)
**Goal:** Ship a working, deployed, onchain product with real user utility.

Features:
- Wallet connection (MiniPay + browser)
- 4 text task types
- Smart contract on Celo Mainnet
- cUSD payment flow
- Result delivery
- Session transaction history

Success: 50+ transactions, 20+ unique wallets, deployed and verified

---

### V2 — Image Generation (June stretch / Season 3)
**Goal:** Add the most visually impressive feature to drive user acquisition and social sharing.

Features:
- Image generation from text prompt
- Style and aspect ratio controls
- Image download
- Replicate/fal.ai integration

New contract function: `IMAGE` task type (already in V1 contract)

---

### V3 — Translation Tools (Season 3+)
**Goal:** Serve multilingual use cases in MiniPay's core markets (Nigeria: English/Yoruba/Igbo, Kenya: English/Swahili, Colombia: Spanish/English).

Features:
- Language pair selection
- Text + document translation
- Batch translation option
- Local language UI strings

Provider: LibreTranslate (open source, self-hostable) or DeepL API

---

### V4 — Agent Mode (Long-term)
**Goal:** Move beyond single-turn tasks to multi-step AI agents that can autonomously complete complex workflows, paying for each step onchain.

Features:
- Multi-step task chaining ("Research X, then write a report about it")
- Autonomous spending limit approval
- Agent activity log
- Custom agent templates

---

## 14. 20-Day Sprint Plan

| Days | Focus | Deliverable |
|------|-------|-------------|
| Day 1–2 | Contract development | `MicroTaskPayment.sol` written, tested on Alfajores testnet |
| Day 3 | Contract mainnet deploy | Verified contract on Celo Mainnet + Celo Explorer |
| Day 4–5 | Next.js scaffold | Project setup, Tailwind config, design system tokens, routing |
| Day 6–7 | Wallet integration | MiniPay detection, wagmi config, Viem client, connect flow |
| Day 8 | Payment integration | Contract call, tx confirmation, event parsing |
| Day 9–10 | AI backend | `/api/task` route, TX verification, Anthropic API integration |
| Day 11–12 | Task UIs | All 4 input screens, result display, copy functionality |
| Day 13 | Polish & mobile | MiniPay browser testing, touch targets, responsive fixes |
| Day 14 | Image gen (V2 stretch) | Replicate API integration, image result UI |
| Day 15 | End-to-end testing | Full flow testing on mainnet with real cUSD |
| Day 16 | Bug fixes | Address all critical issues from testing |
| Day 17 | README + docs | Thorough README, architecture diagram, setup instructions |
| Day 18 | Demo video | 4-min walkthrough: intro, demo, tech stack, roadmap |
| Day 19 | talent.app setup | KarmaGAP profile, milestones, GitHub + contract linked |
| Day 20 | Buffer + submission | Final checks, Proof of Ship submission |

### Daily Rhythm (4–6 hrs/day)
- **0:00–1:00** — Review yesterday's work, plan today's tasks
- **1:00–4:00** — Core development block
- **4:00–5:00** — Testing + commit push
- **5:00–6:00** — GitHub README update, social post (counts toward activity score)

---

## 15. Competitive Analysis

| Product | Model | Weaknesses | Our Advantage |
|---------|-------|-----------|--------------|
| ChatGPT | $20/mo subscription | Too expensive, requires credit card, no crypto | Pay-per-use, cUSD, no account |
| Midjourney | $10–$30/mo | Subscription, Discord-gated, no crypto | Per-image pricing, MiniPay native |
| DeepL | Freemium / $7.49/mo | Subscription, credit card required | Per-translation micropayment |
| Hugging Face Spaces | Free but limited | Rate-limited, no payment model | Reliable, paid, onchain |
| Other Celo AI dApps | Various | Most don't combine AI + MiniPay + micropayments | First-mover in this exact combination |

### Positioning Statement
> MicroTask Agent is the only AI toolbox that charges per use in cUSD via MiniPay — making advanced AI accessible to anyone with a mobile phone and a few cents, no subscription or credit card required.

---

## 16. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Smart contract bug causes lost funds | Low | High | Thorough testnet testing; contract audited internally; no complex logic in V1 |
| Anthropic API rate limits | Medium | Medium | Implement retry with backoff; cache common outputs where appropriate |
| MiniPay browser inconsistencies | Medium | Medium | Test early on actual MiniPay; maintain browser fallback path |
| Low user adoption before deadline | Medium | Medium | Share in Proof of Ship Telegram, personal network, Twitter |
| TX confirmation too slow (UX) | Low | Medium | Show tx hash immediately; set appropriate gas price; use Celo's fast finality |
| Replicate API unavailable for image gen | Low | Low | Image gen is V2 stretch — won't block submission |
| Vercel cold start delays | Low | Low | Use Edge runtime for API routes; warm up before demo |
| cUSD approval needed before contract | Medium | Medium | Implement ERC-20 approve step in UI flow before calling requestTask |

### Critical Pre-launch Checklist
- [ ] Contract deployed and verified on Celo Mainnet
- [ ] cUSD approval flow implemented (user must approve contract to spend cUSD)
- [ ] All 4 text tasks working end-to-end on mainnet
- [ ] MiniPay tested on actual MiniPay app (not just browser)
- [ ] Error states handled for all failure modes
- [ ] API keys stored as environment variables (never in client code)
- [ ] Rate limiting on `/api/task` endpoint
- [ ] README complete with setup instructions

---

## 17. Open Questions

1. **Name:** Final product name not locked. Candidates: *Zap*, *Chip*, *Pico*, *Taskr*, *Numo*. Decision needed before UI build (affects branding, domain, GitHub repo name).

2. **cUSD Approval UX:** Users need to approve the contract to spend their cUSD before the first transaction. This is a two-step flow (approve → requestTask). Should this be a single combined UI step or two explicit steps? Recommendation: combine into one UX step with explanation.

3. **Result storage:** Should results be stored server-side (allows history across sessions) or client-side only (simpler, more private)? V1 recommendation: localStorage only. Revisit in V2.

4. **Output quality guardrails:** Should there be prompt filtering to prevent misuse? Recommendation: implement basic Anthropic content policy compliance (handled by API) + a simple input length cap.

5. **Revenue withdrawal strategy:** Contract accumulates cUSD from all payments. Owner can call `withdraw()` anytime. Set a policy for when to withdraw (weekly? when balance exceeds X cUSD?).

6. **Domain + Branding:** Should a custom domain be purchased, or deploy on Vercel subdomain for V1? Recommendation: Vercel subdomain for V1 (`microtask-agent.vercel.app` or similar), custom domain for V2.

---

## Appendix A: Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Icons | Lucide React |
| Wallet connection | Wagmi v2 + Viem + RainbowKit |
| Smart contract lang | Solidity 0.8.19 |
| Contract tooling | Hardhat |
| AI (text) | Anthropic API (claude-haiku-4-5) |
| AI (image) | Replicate API (SDXL / Flux) |
| Deployment | Vercel (frontend + API routes) |
| Chain | Celo Mainnet (chainId: 42220) |
| Payment token | cUSD (0x765DE816845861e75A25fCA122bb6898B8B1282a) |

---

## Appendix B: Key External Resources

- Celo Docs: https://docs.celo.org
- MiniPay Quickstart: https://docs.celo.org/developer/build-on-minipay/overview
- Celo Composer: https://github.com/celo-org/celo-composer
- Celo Faucet (testnet): https://faucet.celo.org
- Alfajores Explorer: https://alfajores.celoscan.io
- Celo Mainnet Explorer: https://celoscan.io
- talent.app: https://talent.app
- Proof of Ship campaign: https://talent.app/earn/proof-of-ship

---

*Document last updated: June 2026 | Version 1.0*
