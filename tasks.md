# tasks.md — MicroTask Agent Sprint Checklist

**Sprint window:** June 1–22, 2026  
**Submission deadline:** June 22 at 23:59 GMT  
**Daily target:** 4–6 hrs · commit every day · no dead days on GitHub

Update status as you go: `[ ]` → `[x]`  
Mark blockers with `⚠` and notes inline.

---

## Legend

```
[ ]  Not started
[x]  Done
[~]  In progress
[!]  Blocked
```

---

## Phase 1 — Smart Contract (Days 1–3)

### Day 1 — Write & test contract locally

- [x] Create `contracts/` directory and initialize Hardhat project
- [x] Install dependencies: `hardhat`, `@nomicfoundation/hardhat-toolbox`
- [x] Write `MicroTaskPayment.sol`
  - [x] Define task type constants (CAPTION=1, EMAIL=2, SUMMARY=3, EXPLAIN=4, IMAGE=5, TRANSLATE=6)
  - [x] Set up `taskPrices` mapping with initial values
  - [x] Implement `requestTask(uint8 taskType)` — transferFrom + event emit
  - [x] Implement `withdraw()` with `onlyOwner`
  - [x] Implement `updatePrice()` with `onlyOwner`
  - [x] Implement `getPrice()` public view
  - [x] Define `TaskRequested` event with all indexed fields
- [x] Write `contracts/scripts/deploy.ts`
- [x] Configure `hardhat.config.js` for Alfajores + Celo Mainnet
- [x] Run `npx hardhat compile` — zero errors

### Day 2 — Testnet deploy & verify

- [ ] Get Alfajores testnet CELO from faucet: https://faucet.celo.org
- [ ] Get testnet cUSD from faucet
- [ ] Deploy to Alfajores: `npx hardhat run scripts/deploy.ts --network alfajores`
- [ ] Record deployed contract address in `planning.md`
- [ ] Manually test `requestTask()` on Alfajores via Hardhat console
  - [ ] Confirm cUSD `approve()` works before `requestTask()`
  - [ ] Confirm `TaskRequested` event is emitted
  - [ ] Confirm cUSD balance of contract increases
  - [ ] Confirm `withdraw()` works for owner
  - [ ] Confirm non-owner `withdraw()` reverts
- [ ] Verify contract on Alfajores explorer

### Day 3 — Mainnet deploy & verify

- [ ] Review contract one final time before mainnet
- [ ] Deploy to Celo Mainnet: `npx hardhat run scripts/deploy.ts --network celo`
- [ ] Record mainnet contract address in:
  - [ ] `planning.md`
  - [ ] `CLAUDE.md`
  - [ ] `.env.local` as `NEXT_PUBLIC_CONTRACT_ADDRESS`
- [ ] Verify on Celoscan: `npx hardhat verify --network celo <ADDRESS> <CUSD_ADDRESS>`
- [ ] Confirm contract is publicly visible on https://celoscan.io
- [ ] Commit: `feat: deploy MicroTaskPayment to Celo Mainnet`

---

## Phase 2 — Frontend Scaffold (Days 4–5)

### Day 4 — Project setup

- [ ] Initialize Next.js 14 project with App Router: `npx create-next-app@latest`
- [ ] Install core dependencies:
  - [ ] `tailwindcss`, `postcss`, `autoprefixer`
  - [ ] `framer-motion`
  - [ ] `lucide-react`
  - [ ] `wagmi`, `viem`, `@rainbow-me/rainbowkit`
  - [ ] `@tanstack/react-query`
- [ ] Configure Tailwind with custom design tokens
- [ ] Add CSS variables to `styles/globals.css`:
  - [ ] `--bg-primary: #0A0A0F`
  - [ ] `--bg-secondary: #111118`
  - [ ] `--bg-card: #16161E`
  - [ ] `--border: #2A2A38`
  - [ ] `--accent: #7B61FF`
  - [ ] `--accent-green: #00D395`
  - [ ] `--accent-amber: #F5A623`
  - [ ] `--text-primary: #F0F0FF`
  - [ ] `--text-secondary: #8888AA`
  - [ ] `--text-muted: #4A4A66`
- [ ] Add Google Fonts: Space Mono + DM Sans
- [ ] Create `lib/constants.ts` with all task types, prices, chain config
- [ ] Create `.env.example` and `.env.local`
- [ ] Set up `app/layout.tsx` with providers (Wagmi, RainbowKit, QueryClient)

### Day 5 — Routing & page shells

- [ ] Create `app/page.tsx` — home (task picker grid) shell
- [ ] Create `app/task/[type]/page.tsx` — per-task input shell
- [ ] Create basic `components/TaskCard.tsx` with price badge
- [ ] Create `components/ResultCard.tsx` shell
- [ ] Confirm routing works: home → task → result
- [ ] Commit: `feat: scaffold Next.js project with routing and design tokens`

---

## Phase 3 — Wallet Integration (Days 6–7)

### Day 6 — MiniPay detection + connect

- [ ] Create `hooks/useMiniPay.ts`
  - [ ] Detect `window.ethereum?.isMiniPay`
  - [ ] Auto-connect if MiniPay detected
  - [ ] Expose `{ isMiniPay, address, isConnected }`
- [ ] Configure Wagmi with Celo Mainnet chain
- [ ] Set up Viem public client pointing to `https://forno.celo.org`
- [ ] Create `components/WalletConnect.tsx`
  - [ ] MiniPay: show connected address, no modal
  - [ ] Browser: RainbowKit connect button
  - [ ] Wrong network: "Switch to Celo" button
  - [ ] No wallet: install prompt
- [ ] Test MiniPay detection in Chrome DevTools (mock `window.ethereum.isMiniPay = true`)

### Day 7 — cUSD balance + network enforcement

- [ ] Create `hooks/useCUSDBalance.ts`
  - [ ] Read cUSD balance of connected address
  - [ ] Return formatted balance (e.g. "1.25 cUSD")
  - [ ] Refresh on block
- [ ] Display cUSD balance in header
- [ ] Implement network enforcement — redirect to wrong network screen if not on Celo Mainnet
- [ ] Add Celo Mainnet to RainbowKit chain list
- [ ] Commit: `feat: wallet connection with MiniPay detection and cUSD balance`

---

## Phase 4 — Payment Integration (Day 8)

### Day 8 — approve() + requestTask() flow

- [ ] Create `lib/contract.ts`
  - [ ] Import ABI from compiled artifact
  - [ ] Export contract address + cUSD address constants
  - [ ] Export Viem public + wallet client factory
- [ ] Create `hooks/useTaskPayment.ts`
  - [ ] Step 1: call `approve(contractAddress, price)` on cUSD contract
  - [ ] Wait for approve tx confirmation
  - [ ] Step 2: call `requestTask(taskType)` on MicroTaskPayment
  - [ ] Wait for requestTask tx confirmation
  - [ ] Return `{ txHash, isPending, isConfirmed, error }`
- [ ] Create `components/PaymentModal.tsx`
  - [ ] Show: task name, price, wallet address, cUSD balance
  - [ ] States: idle → approving → approved → paying → confirmed → error
  - [ ] Show tx hash with Celoscan link immediately after broadcast
- [ ] Set `feeCurrency: CUSD_ADDRESS` on all txs for gas fee abstraction
- [ ] Test full payment flow on Alfajores testnet
- [ ] Commit: `feat: cUSD payment flow with approve and requestTask`

---

## Phase 5 — AI Backend (Days 9–10)

### Day 9 — TX verifier + API route skeleton

- [ ] Create `lib/verifyPayment.ts`
  - [ ] `getTransactionReceipt(txHash)` from Celo RPC
  - [ ] Check `receipt.status === 'success'`
  - [ ] Check `receipt.to === CONTRACT_ADDRESS`
  - [ ] Decode event logs — find `TaskRequested`
  - [ ] Verify `event.args.user === userAddress`
  - [ ] Verify `event.args.taskType === taskType`
  - [ ] Return `true` or throw with specific error code
- [ ] Create `app/api/task/route.ts` skeleton
  - [ ] Parse and validate request body
  - [ ] Call `verifyPayment()` — return 403 on failure
  - [ ] Return 200 stub result for now
- [ ] Add rate limiting middleware (simple IP-based, 10 req/min)
- [ ] Test with a real Alfajores tx hash

### Day 10 — Anthropic integration + task router

- [ ] Install `@anthropic-ai/sdk`
- [ ] Create `lib/taskRouter.ts`
  - [ ] System prompts for all 4 task types
  - [ ] `buildPrompt(taskType, input)` function
  - [ ] `callAnthropic(prompt)` wrapper
  - [ ] Token limits per task type
  - [ ] Retry logic (1 retry on 5xx)
- [ ] Wire task router into `/api/task` route
- [ ] Test all 4 task types end-to-end (mocked tx verification for now)
- [ ] Add input sanitization — strip HTML, cap at 2000 chars
- [ ] Add output truncation — `MAX_CHARS` per task type
- [ ] Commit: `feat: POST /api/task with onchain verification and Anthropic integration`

---

## Phase 6 — Task UIs (Days 11–12)

### Day 11 — Home + task input screens

- [ ] Build `app/page.tsx` — task picker grid
  - [ ] 4 task cards with name, description, price badge
  - [ ] Hover effects (glow border)
  - [ ] Framer Motion entrance animation (stagger)
  - [ ] Wallet connect state in header
- [ ] Build `app/task/[type]/page.tsx` — input screens
  - [ ] Caption: textarea + tone selector (professional / casual / funny / viral)
  - [ ] Email: intent textarea + recipient selector
  - [ ] Summary: paste area + length selector (short / medium / detailed)
  - [ ] Explainer: topic input + audience selector (beginner / intermediate / expert)
  - [ ] Character count indicator
  - [ ] Sticky "Pay & Generate" CTA at bottom
  - [ ] Disabled state when input is empty

### Day 12 — Payment modal + result screen

- [ ] Wire `PaymentModal` into task input screens
- [ ] Build `components/ResultCard.tsx`
  - [ ] Display AI result text
  - [ ] Copy-to-clipboard button (with "Copied!" feedback)
  - [ ] Share button (copies shareable text)
  - [ ] "Try another" CTA
  - [ ] Tx hash with Celoscan link
- [ ] Build `components/TxHistory.tsx`
  - [ ] Read from localStorage
  - [ ] Show last 10 session transactions
  - [ ] Each entry: task type, timestamp, tx hash link, result preview
- [ ] Full end-to-end flow test: connect → pick task → input → pay → result
- [ ] Commit: `feat: complete task UI with payment flow and result display`

---

## Phase 7 — Polish & Mobile (Day 13)

- [ ] Test entire app in actual MiniPay browser on Android
- [ ] Fix any MiniPay-specific layout issues
- [ ] Verify all touch targets are ≥ 44px
- [ ] Convert modals to bottom sheets on mobile
- [ ] Test on multiple screen sizes (360px, 390px, 414px, 768px)
- [ ] Fix any text overflow or truncation issues
- [ ] Optimize images and fonts for mobile load time
- [ ] Add `<meta name="viewport">` and PWA manifest
- [ ] Confirm `feeCurrency` gas abstraction works in MiniPay
- [ ] Commit: `fix: mobile polish and MiniPay browser compatibility`

---

## Phase 8 — Image Generation Stretch (Day 14)

> Only start if Days 1–13 are fully complete and stable.

- [ ] Install Replicate client: `npm install replicate`
- [ ] Add `REPLICATE_API_TOKEN` to Vercel env + `.env.local`
- [ ] Extend `lib/taskRouter.ts` to handle `taskType === 5`
- [ ] Wire Replicate SDXL / Flux call for image generation
- [ ] Build image input UI:
  - [ ] Prompt textarea
  - [ ] Style selector (photorealistic / illustration / pixel art / abstract)
  - [ ] Aspect ratio selector (square / portrait / landscape)
- [ ] Build image result UI:
  - [ ] Display generated image
  - [ ] Download button (PNG)
  - [ ] "Regenerate" CTA (costs another 0.50 cUSD)
- [ ] Test on Alfajores + mainnet
- [ ] Commit: `feat: V2 image generation with Replicate`

---

## Phase 9 — Testing (Day 15)

- [ ] Full E2E test on Celo Mainnet with real cUSD
  - [ ] Caption writer — complete flow
  - [ ] Email drafter — complete flow
  - [ ] Text summarizer — complete flow
  - [ ] Concept explainer — complete flow
- [ ] Test all error states:
  - [ ] User rejects approval tx
  - [ ] User rejects requestTask tx
  - [ ] Insufficient cUSD balance
  - [ ] Wrong network (not Celo)
  - [ ] Invalid tx hash in POST body
  - [ ] AI provider error
- [ ] Test on MiniPay Android (real device)
- [ ] Test on Chrome desktop (MetaMask)
- [ ] Test on mobile browser (no wallet installed)
- [ ] Confirm transaction history persists within session
- [ ] Confirm localStorage clears after 24 hours

---

## Phase 10 — Bug Fixes (Day 16)

- [ ] Address all critical issues found in Day 15 testing
- [ ] Fix any console errors or warnings
- [ ] Fix any TypeScript errors (`npm run type-check`)
- [ ] Fix any Tailwind layout issues at edge breakpoints
- [ ] Re-test after fixes
- [ ] Commit: `fix: Day 16 bug fixes from E2E testing`

---

## Phase 11 — Docs & Demo (Days 17–18)

### Day 17 — README

- [ ] Write `README.md` for GitHub repo
  - [ ] Project headline + one-liner
  - [ ] Screenshot / GIF of the app
  - [ ] How it works (3–5 bullet points)
  - [ ] Tech stack table
  - [ ] Local setup instructions
  - [ ] Contract addresses (testnet + mainnet)
  - [ ] Environment variables guide
  - [ ] How to run locally
  - [ ] How to deploy
  - [ ] Architecture diagram (ASCII or link to doc)
  - [ ] Roadmap (V1 → V2 → V3)
  - [ ] License (MIT)
- [ ] Update `CLAUDE.md` with final contract addresses
- [ ] Update `planning.md` with final addresses + any changed decisions
- [ ] Push all pending commits to GitHub main branch

### Day 18 — Demo video (4 min max)

- [ ] Structure:
  - [ ] 0:00–1:00 — Problem + product intro (screen + voiceover)
  - [ ] 1:00–3:00 — Live demo walkthrough (MiniPay + browser)
  - [ ] 3:00–3:30 — Tech stack + architecture
  - [ ] 3:30–4:00 — Roadmap + what's next
- [ ] Record in MiniPay on real Android device
- [ ] Record browser demo on desktop
- [ ] Edit into one 4-min video
- [ ] Upload to YouTube (unlisted or public)
- [ ] Save video URL for submission

---

## Phase 12 — Submission (Days 19–20)

### Day 19 — talent.app setup

- [ ] Create / update builder profile on https://talent.app
- [ ] Create project page on talent.app
- [ ] Add project details:
  - [ ] Name, description, logo
  - [ ] Website URL (Vercel)
  - [ ] GitHub repository URL
  - [ ] Celo Mainnet contract address (verified)
- [ ] Enroll project in the active Proof of Ship campaign
- [ ] Add milestones matching the sprint phases
- [ ] Mark completed milestones as done
- [ ] Confirm project appears on the Proof of Ship leaderboard

### Day 20 — Final checks + submission

- [ ] Run final smoke test on mainnet
- [ ] Confirm contract is verified on Celoscan
- [ ] Confirm GitHub repo is public
- [ ] Confirm README is thorough
- [ ] Confirm demo video is uploaded and link works
- [ ] Confirm talent.app project is complete and enrolled
- [ ] Share in Proof of Ship Telegram group
- [ ] Post on Twitter/X tagging @CeloDevs
- [ ] Submit before June 22 at 23:59 GMT ✅

---

## Daily Commit Log

Keep this updated — one entry per day. Helps with the GitHub activity score.

| Day | Date | Commit message | Status |
|-----|------|---------------|--------|
| 1 | Jun 1 | `feat: write MicroTaskPayment.sol and Hardhat setup` | [x] |
| 2 | Jun 2 | `feat: deploy and test on Alfajores testnet` | [ ] |
| 3 | Jun 3 | `feat: deploy and verify on Celo Mainnet` | [ ] |
| 4 | Jun 4 | `feat: scaffold Next.js with design tokens` | [ ] |
| 5 | Jun 5 | `feat: routing and page shells` | [ ] |
| 6 | Jun 6 | `feat: MiniPay detection and wallet connect` | [ ] |
| 7 | Jun 7 | `feat: cUSD balance and network enforcement` | [ ] |
| 8 | Jun 8 | `feat: approve + requestTask payment flow` | [ ] |
| 9 | Jun 9 | `feat: TX verifier and API route skeleton` | [ ] |
| 10 | Jun 10 | `feat: Anthropic integration and task router` | [ ] |
| 11 | Jun 11 | `feat: home grid and task input screens` | [ ] |
| 12 | Jun 12 | `feat: payment modal and result card` | [ ] |
| 13 | Jun 13 | `fix: MiniPay mobile polish` | [ ] |
| 14 | Jun 14 | `feat: V2 image generation (stretch)` | [ ] |
| 15 | Jun 15 | `test: E2E mainnet testing` | [ ] |
| 16 | Jun 16 | `fix: bug fixes from E2E testing` | [ ] |
| 17 | Jun 17 | `docs: README and documentation` | [ ] |
| 18 | Jun 18 | `docs: demo video and assets` | [ ] |
| 19 | Jun 19 | `chore: talent.app setup and milestones` | [ ] |
| 20 | Jun 20–22 | `chore: final checks and submission` | [ ] |

---

## Pre-Launch Checklist (Must Pass Before Submission)

- [ ] Contract deployed on Celo Mainnet
- [ ] Contract source verified on Celoscan
- [ ] All 4 text task types working end-to-end on mainnet
- [ ] MiniPay `isMiniPay` detection implemented
- [ ] `feeCurrency: CUSD_ADDRESS` set on all transactions
- [ ] cUSD `approve()` step before `requestTask()` — tested
- [ ] All AI API keys in Vercel env vars (not in client code)
- [ ] Rate limiting on `/api/task` active
- [ ] Error states handled for all failure modes
- [ ] README complete and pushed to GitHub
- [ ] GitHub repo is public
- [ ] Demo video uploaded (4 min max)
- [ ] talent.app project enrolled in Proof of Ship campaign
- [ ] Project appears on Proof of Ship leaderboard
