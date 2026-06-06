# planning.md — MicroTask Agent

This document is the single source of truth for product decisions, architecture choices, roadmap, and context. Update it when decisions change. Read it before starting a new feature or sprint.

---

## The Idea (One Paragraph)

Most people in emerging markets can't access AI tools — not because the tools don't exist, but because $20/month subscriptions, credit card requirements, and account creation walls block them out. MicroTask Agent solves this by letting anyone with a MiniPay wallet pay a few cents in cUSD per AI task — no account, no subscription, no friction. The AI never runs until payment is confirmed onchain. It's a fundamentally new access model built on Celo's stablecoin rails, and it's exactly the kind of product Celo's Proof of Ship program is asking for.

---

## Program Context

| Field | Value |
|-------|-------|
| Program | Celo Proof of Ship — Season 2 |
| Active window | June 1–22, 2026 |
| Submission deadline | June 22, 2026 at 23:59 GMT |
| Review period | June 26–29 |
| Rewards payout | June 30 |
| Prize pool | $5,000 USDT (Top 50 projects) |
| Max per project | $2,000 USDT (cumulative Season 2) |
| Top 10 share | 50% of pool (proportional to score) |
| Top 11–50 share | 50% of pool (proportional to score) |

### Why This Project Scores Well

- Celo explicitly named *"pay as you go access to LLMs and image creation tools"* in their wanted list
- Every AI request = one onchain transaction → high transaction count score
- MiniPay hook implemented → score booster
- Solves a real problem for MiniPay's core markets (Nigeria, Kenya, Ghana, etc.)
- Open source + verified contract → meets all eligibility requirements
- Progressive commits across 20 days → strong GitHub activity score

---

## Product Decisions (Locked)

| Decision | Choice | Rationale |
|---------|--------|-----------|
| Chain | Celo Mainnet | Required by Proof of Ship |
| Payment token | cUSD | Stable, already in MiniPay wallets |
| Payment model | Per-request micropayment | Celo wishlist item; lower friction than subscription |
| Frontend framework | Next.js 14 App Router | Familiar stack, easy Vercel deploy, API routes co-located |
| Wallet library | Wagmi v2 + Viem | Recommended by MiniPay docs over ethers.js |
| AI provider (text) | Anthropic claude-haiku-4-5 | Fastest + cheapest model; sufficient for task types |
| AI provider (image) | Replicate (SDXL / Flux) | Cheaper than DALL-E 3; flexible model choice |
| Deployment | Vercel | Zero-config for Next.js; Edge functions for low latency |
| API key storage | Vercel env vars (server-side only) | Security requirement — never in client code |
| Result storage | localStorage (session only) | No backend persistence needed in V1; privacy-preserving |
| Contract pattern | Simple payment receiver | No proxy, no upgradeable pattern — easier to audit |
| Gas payment | cUSD fee currency | Celo fee abstraction — users don't need CELO |

## Open Decisions (Unresolved)

| # | Question | Options | Recommendation |
|---|---------|---------|----------------|
| 1 | Product name | Zap, Chip, Pico, Taskr, Numo | Not locked — decide before UI build |
| 2 | cUSD approval UX | Single combined step vs two explicit steps | Combine into one UX step with explanation |
| 3 | Custom domain | Vercel subdomain vs custom domain | Vercel subdomain for V1 |
| 4 | Withdrawal policy | Weekly vs threshold-based | Withdraw when balance > 10 cUSD |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│   Next.js 14 · Tailwind · Framer Motion · Wagmi/Viem    │
│   MiniPay auto-detect · RainbowKit fallback             │
└─────────────────────────┬───────────────────────────────┘
                          │ approve() + requestTask()
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   CELO MAINNET                          │
│   MicroTaskPayment.sol · cUSD ERC-20 · Celo Explorer    │
│   TaskRequested event emitted on every payment          │
└─────────────────────────┬───────────────────────────────┘
                          │ event · tx hash
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND LAYER                         │
│   Next.js API Routes (Vercel Edge)                      │
│   TX Verifier → Task Router → Response Handler          │
│   AI never called before onchain verification           │
└─────────────────────────┬───────────────────────────────┘
                          │ authenticated API call
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 AI PROVIDER LAYER                       │
│   V1: Anthropic (text)  ·  V2: Replicate (image)        │
│   V3: LibreTranslate (translation)                      │
└─────────────────────────────────────────────────────────┘
```

See `microtask-agent-architecture.md` for the full detailed breakdown.

---

## Task Types & Pricing

| ID | Task | Price | V | AI Provider |
|----|------|-------|---|------------|
| 1 | Caption writer | 0.10 cUSD | 1 | Anthropic |
| 2 | Email drafter | 0.25 cUSD | 1 | Anthropic |
| 3 | Text summarizer | 0.25 cUSD | 1 | Anthropic |
| 4 | Concept explainer | 0.10 cUSD | 1 | Anthropic |
| 5 | Image generator | 0.50 cUSD | 2 | Replicate |
| 6 | Translator | 0.10 cUSD | 3 | LibreTranslate |

Prices are set in the contract constructor and adjustable via `updatePrice()` without redeployment.

---

## Progressive Roadmap

### V1 — Core Text Tools `[current target]`
**Deadline:** June 22, 2026  
**Goal:** Ship a working, deployed, onchain product with real utility.

- Wallet connection — MiniPay + browser
- 4 text task types (caption, email, summary, explainer)
- MicroTaskPayment.sol deployed + verified on Celo Mainnet
- cUSD payment flow end-to-end
- POST /api/task with onchain verification
- Result display with copy/share
- Session transaction history
- Mobile-optimized for MiniPay browser

**Success criteria:** 50+ onchain transactions · 20+ unique wallets · 40+ GitHub commits

---

### V2 — Image Generation `[stretch goal / Season 3]`
**Goal:** Add the most shareable feature to drive user acquisition.

- Image generation from text prompt
- Style selector (photorealistic, illustration, pixel art, abstract)
- Aspect ratio selector
- Image download (PNG)
- Replicate API integration
- `IMAGE` task type already in V1 contract

---

### V3 — Translation `[Season 3+]`
**Goal:** Serve multilingual emerging markets.

- Language pair selection
- English ↔ Yoruba, Swahili, Spanish, French, Arabic
- Text + short document translation
- Self-hosted LibreTranslate instance

---

### V4 — Agent Mode `[long-term]`
**Goal:** Multi-step autonomous AI workflows paid onchain per step.

- Task chaining ("research X then write a report")
- Per-step spending with user-set limits
- Agent activity log
- Custom agent templates

---

## Sprint Timeline

| Days | Focus | Key Deliverable |
|------|-------|----------------|
| 1–2 | Smart contract | `MicroTaskPayment.sol` on Alfajores |
| 3 | Mainnet deploy | Verified contract on Celoscan |
| 4–5 | Next.js scaffold | Project structure, design tokens, routing |
| 6–7 | Wallet integration | MiniPay detection, Wagmi config, connect flow |
| 8 | Payment integration | `approve()` + `requestTask()` + tx confirmation |
| 9–10 | AI backend | `/api/task`, TX verifier, Anthropic integration |
| 11–12 | Task UIs | All 4 input screens + result display |
| 13 | Mobile polish | MiniPay browser testing, touch targets |
| 14 | Image gen stretch | Replicate integration (V2) |
| 15 | E2E testing | Full flow on mainnet with real cUSD |
| 16 | Bug fixes | All critical issues resolved |
| 17 | README + docs | thorough README + setup guide |
| 18 | Demo video | 4-min walkthrough (intro / demo / tech / roadmap) |
| 19 | talent.app | KarmaGAP profile, milestones, GitHub + contract linked |
| 20 | Buffer | Final checks + submission |

---

## Scoring Metrics (Proof of Ship)

Rewards are calculated from:

| Metric | How to Maximize |
|--------|----------------|
| Onchain transactions | Every AI request = 1 tx; drive real usage |
| Unique active wallets | Share widely; make it easy to try |
| Fees generated | Transactions generate cUSD fees |
| GitHub commits | Daily commits; no dead days |
| MiniPay-specific code | `isMiniPay` detection + fee currency |
| NPM package downloads | Publish any reusable utilities as packages |

---

## Eligibility Checklist

- [ ] Deployed on Celo Mainnet with verified smart contract
- [ ] Open source with public GitHub repository
- [ ] Project functional with real onchain activity
- [ ] MiniPay hook implemented (`isMiniPay` detection)
- [ ] Project is NOT already listed on MiniPay (new project)
- [ ] Registered on talent.app with GitHub repo + contract address linked
- [ ] Enrolled in Proof of Ship campaign on talent.app

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Contract bug → lost funds | High | Thorough Alfajores testing before mainnet |
| cUSD approval step missed in UI | High | Test approval flow explicitly; add pre-launch checklist |
| MiniPay browser inconsistencies | Medium | Test on actual MiniPay early (Day 13) |
| Anthropic rate limits | Medium | Retry with backoff; request limit increase if needed |
| Low adoption before deadline | Medium | Share in Proof of Ship Telegram group daily |
| Vercel cold start on demo | Low | Use Edge runtime; warm up before recording |

---

## Key Addresses & Config

| Item | Value |
|-----|-------|
| Chain | Celo Mainnet |
| Chain ID | 42220 |
| RPC | https://forno.celo.org |
| Explorer | https://celoscan.io |
| cUSD (mainnet) | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |
| cUSD (testnet) | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` |
| MicroTaskPayment (mainnet) | `0x986C4960276545B9672a0621511FC9D4b7e88912` |
| MicroTaskPayment (testnet) | N/A — Alfajores forno decommissioned; skipped |
| Vercel project URL | TBD after deploy |

---

## Reference Documents

| Document | Purpose |
|---------|---------|
| `CLAUDE.md` | AI assistant context — repo structure, stack, rules |
| `tasks.md` | Sprint checklist — current status of every task |
| `microtask-agent-prd.md` | Full product requirements document |
| `microtask-agent-architecture.md` | Detailed system architecture |
