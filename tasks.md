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

### Day 2 — Contract testing (local) + prep for mainnet

> NOTE: Alfajores forno RPC (alfajores-forno.celo-testnet.org) is NXDOMAIN — decommissioned by Celo.
> No public Alfajores RPC found. Replaced testnet deploy with thorough local Hardhat tests.

- [x] Write `test/MicroTaskPayment.test.js` — 16 tests covering all contract functions
- [x] All 16 tests passing locally (npm test)
  - [x] cUSD `approve()` + `requestTask()` flow verified
  - [x] `TaskRequested` event fields verified (user, taskType, amount, requestId, timestamp)
  - [x] cUSD balance transfer verified
  - [x] `withdraw()` owner flow verified
  - [x] `withdraw()` non-owner revert verified
  - [x] `updatePrice()` owner + non-owner verified
  - [x] Unique requestId per call verified
- [x] `tsconfig.json` added (module: commonjs, ignoreDeprecations: 6.0)
- [x] `contracts/test/MockERC20.sol` added for local test fixture
- [ ] Add `PRIVATE_KEY` and `CELOSCAN_API_KEY` to `.env.local` before mainnet deploy

### Day 3 — Mainnet deploy & verify

- [x] Review contract one final time before mainnet
- [x] Deploy to Celo Mainnet: `npm run deploy:mainnet`
- [x] Contract deployed: `0x986C4960276545B9672a0621511FC9D4b7e88912`
- [x] Record mainnet contract address in:
  - [x] `planning.md`
  - [x] `CLAUDE.md`
  - [x] `.env.local` as `NEXT_PUBLIC_CONTRACT_ADDRESS`
- [x] Verify on Celoscan — source verified ✓
- [x] Confirm contract publicly visible: https://celoscan.io/address/0x986C4960276545B9672a0621511FC9D4b7e88912#code

---

## Phase 2 — Frontend Scaffold (Days 4–5)

### Day 4 — Project setup

- [x] Install Next.js 14 + all frontend deps (next, react, wagmi v2, viem, rainbowkit, react-query, framer-motion, lucide-react)
- [x] Install Tailwind CSS v4 + postcss + autoprefixer + @tailwindcss/postcss
- [x] `styles/globals.css` — all 10 CSS variables + Tailwind v4 @theme tokens + skeleton shimmer
- [x] `lib/constants.ts` — task types, prices, labels, descriptions, chain config
- [x] `lib/wagmi.ts` — wagmiConfig with Celo chain + forno RPC
- [x] `app/providers.tsx` — WagmiProvider + RainbowKitProvider + QueryClientProvider
- [x] `app/layout.tsx` — Space Mono + DM Sans fonts, metadata, providers wired
- [x] `app/page.tsx` — scaffold shell (full UI Day 11)
- [x] `next.config.js` + `postcss.config.js` created
- [x] `tsconfig.json` updated for Next.js; `tsconfig.hardhat.json` split out for Hardhat
- [x] `package.json` — dev/build/start/type-check scripts added
- [x] Dev server boots clean on localhost:3000 ✓

### Day 5 — Routing & page shells

- [x] `app/page.tsx` — home with staggered TaskCard grid (4 V1 tasks + coming-soon strip)
- [x] `app/task/[type]/page.tsx` — dynamic route, validates task ID, shows skeleton input + disabled pay button
- [x] `app/not-found.tsx` — 404 page for invalid routes
- [x] `components/TaskCard.tsx` — price badge, hover glow, Framer Motion stagger entrance
- [x] `components/ResultCard.tsx` — result display, copy button, Celoscan tx link, reset CTA
- [x] All routes verified: / → 200, /task/1 → 200, /task/99 → 404 ✓
- [x] Fixed: WalletConnect projectId fallback, viewport metadata, webpack missing-module warnings

---

## Phase 3 — Wallet Integration (Days 6–7)

### Day 6 — MiniPay detection + connect

- [x] `hooks/useMiniPay.ts` — detects `window.ethereum.isMiniPay`, auto-connects with `injected()`, exposes `{ isMiniPay, address, isConnected }`
- [x] `hooks/useCUSDBalance.ts` — reads cUSD balance via wagmi `useReadContract`, returns formatted string
- [x] `lib/viemClient.ts` — Viem public client on forno.celo.org
- [x] `components/WalletConnect.tsx` — 4 states: MiniPay pill, browser connected pill, wrong network amber button, RainbowKit connect button
- [x] `WalletConnect` wired into home page header and task page header
- [x] WalletConnect project ID set in `.env.local`
- [x] Both routes compile 200 with wallet component ✓

### Day 7 — cUSD balance + network enforcement

- [x] `hooks/useCUSDBalance.ts` — `refetchInterval: 5000` keeps balance live (≈ 1 Celo block)
- [x] cUSD balance shown in WalletConnect pill on all pages
- [x] `components/NetworkGuard.tsx` — full-screen wrong-network blocker with Switch to Celo button
- [x] `NetworkGuard` wired into `providers.tsx` — covers every route automatically
- [x] Celo Mainnet in wagmi config; RainbowKit inherits it

---

## Phase 4 — Payment Integration (Day 8)

### Day 8 — approve() + requestTask() flow

- [x] `lib/contract.ts` — inline ABI fragments for requestTask, TaskRequested event, ERC20 approve/allowance
- [x] `hooks/useTaskPayment.ts` — approve → waitForReceipt → requestTask → waitForReceipt state machine; returns `{ status, txHash, isPending, isConfirmed, error, startPayment, reset }`
- [x] `components/PaymentModal.tsx` — bottom-sheet modal, 6-state UI (idle/approving/approved/paying/confirmed/error), step progress bar, Celoscan tx link, try-again on error
- [x] Pay button in task page wired to modal; disabled when wallet not connected
- [x] Build passes clean (`npm run build` — all 4 routes generated)

---

## Phase 5 — AI Backend (Days 9–10)

### Day 9 — TX verifier + API route skeleton

- [x] `lib/verifyPayment.ts` — getTransactionReceipt → status check → contract address check → decodeEventLog TaskRequested → user match → taskType match; throws `PaymentVerificationError` with typed `code`
- [x] `app/api/task/route.ts` — POST handler: rate limit (10/min per IP) → body validation → verifyPayment → 403 on failure → 200 stub result
- [x] Error codes: `INVALID_TX`, `WRONG_CONTRACT`, `EVENT_NOT_FOUND`, `USER_MISMATCH`, `INVALID_TASK`, `RATE_LIMITED`
- [x] Smoke-tested: invalid taskType → `INVALID_TASK` 400; fake txHash → `INVALID_TX` 403 (hits Celo RPC)

### Day 10 — Anthropic integration + task router

- [x] Installed `@anthropic-ai/sdk`
- [x] `lib/taskRouter.ts` — `buildPrompt()` for all 4 task types (CAPTION, EMAIL, SUMMARY, EXPLAIN) with tailored system prompts; `runTask()` calls `claude-haiku-4-5`, per-task token limits, 1 retry on 5xx, output char truncation
- [x] Input sanitized: strip HTML, cap at 2000 chars
- [x] Output truncated to per-task MAX_CHARS with `…` suffix
- [x] `/api/task` wired: verify → runTask → return `{ success, result, taskType, chars, txHash }`

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
| 2 | Jun 5 | `feat: 16-test local suite covering all contract functions` | [x] |
| 3 | Jun 6 | `feat: deploy and verify MicroTaskPayment on Celo Mainnet` | [x] |
| 4 | Jun 6 | `feat: scaffold Next.js with design tokens` | [x] |
| 5 | Jun 6 | `feat: routing and page shells` | [x] |
| 6 | Jun 6 | `feat: MiniPay detection and wallet connect` | [x] |
| 7 | Jun 7 | `feat: cUSD balance and network enforcement` | [x] |
| 8 | Jun 8 | `feat: approve + requestTask payment flow` | [x] |
| 9 | Jun 9 | `feat: TX verifier and API route skeleton` | [x] |
| 10 | Jun 10 | `feat: Anthropic integration and task router` | [x] |
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
