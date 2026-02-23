# SPEC — CRYPTO PAYROLL AGENT (paychef)
**Agent Wallet · Cook Your MVP · Day 1 Submission**

---

## 1. MVP Overview

| Field | Details |
|-------|---------|
| **Theme** | Agent Wallet |
| **MVP Name** | Crypto Payroll Agent (`paychef`) |
| **User** | Web3 startups, DAOs, remote teams paying salaries in crypto monthly |
| **Problem** | Crypto payroll is fully manual: copy-paste wallet addresses, sign multiple transactions one by one, takes 1–2 hours per month. High risk of wrong address, missed payment, or private key exposure when using automation tools |
| **Core Flow** | Upload CSV → Confirm whitelist → Set schedule → Agent auto-executes all txs → Telegram notification |
| **Scope Cut** | USDC only, 1 testnet, single-user, no multi-sig, no fancy UI |
| **Agent Wallet pattern** | Session Key — agent never holds user's real private key |

---

## 2. Problem Deep Dive

### Who is the user?
A **team lead / founder / ops person** at a small Web3 team (3–20 people). They pay contributors in USDC monthly. Technical enough to use crypto, but doesn't want to spend hours on repetitive payroll tasks.

### Current pain (without paychef)
Every month, the user manually:
1. Opens a spreadsheet of wallet addresses and salary amounts
2. Opens their wallet (MetaMask, etc.)
3. Sends transactions **one by one** — copy address → paste → enter amount → confirm gas → sign
4. Repeats this 5–20 times
5. Checks each tx hash manually to confirm success

**Time cost:** 1–2 hours per month
**Risk:** Wrong address paste = lost funds forever. Missed payment = unhappy contributor.

### Why current tools don't solve it

| Tool | Why it fails |
|------|-------------|
| Spreadsheet + manual | Slow, error-prone, zero automation |
| Gnosis Safe (multi-sig) | Requires multiple signers online simultaneously, still manual |
| Deel / traditional payroll | Fiat-first, not built for crypto-native teams |
| Raw bot scripts | User must put private key in `.env` → massive security risk |

---

## 3. Core Flow (Happy Path)

> This is the **only flow** that needs to work perfectly for the demo.

```
[User]
  → Connect wallet (MetaMask)
  → Dashboard shows: Agent Wallet address + USDC balance
  → Upload payroll.csv (columns: name, wallet_address, usdc_amount)
  → Review & confirm whitelist
  → Set schedule or click "Run Now"

[Agent]
  → Parse & validate CSV
  → Check: all addresses in whitelist ✓
  → Check: total amount ≤ spending limit ✓
  → Check: agent wallet has enough USDC ✓
  → Execute transactions one by one via Session Key
  → Wait for each tx confirmation, log tx hash

[Notification]
  → Telegram bot sends:
    "✅ Payroll complete — 5/5 paid
     Total: 1,500 USDC | Failed: 0
     Tx hashes: [links to explorer]"

[Dashboard]
  → Updates payroll history table
  → Shows per-employee: status, amount, tx hash, timestamp
```

---

## 4. User Stories & Acceptance Criteria

### US-1: Upload Payroll CSV
**Acceptance Criteria:**
- [ ] Accepts `.csv` with columns: `name`, `wallet_address`, `usdc_amount`
- [ ] Validates each wallet address (checksum)
- [ ] Shows parsed preview table before confirmation
- [ ] Rejects invalid rows with clear error message
- [ ] Calculates and displays total USDC required

### US-2: Session Key Setup
**Acceptance Criteria:**
- [ ] Backend generates Session Key wallet (agent-owned, not user's PK)
- [ ] Session Key created with: whitelist = CSV addresses, spending limit = CSV total, expiry = 30 days
- [ ] Dashboard shows Session Key status: active / expired / revoked
- [ ] User can revoke Session Key anytime with one click

### US-3: Execute Payroll
**Acceptance Criteria:**
- [ ] Manual "Run Now" trigger available
- [ ] Auto scheduler runs on configured date/time (node-cron)
- [ ] Each transaction confirmed on-chain before moving to next
- [ ] Failed tx logged, execution continues for remaining
- [ ] History saved to JSON store after each run

### US-4: Telegram Notification
**Acceptance Criteria:**
- [ ] Bot sends summary after each run: success count, fail count, total USDC, tx hash links
- [ ] Message sent within 60 seconds of last tx confirming

### US-5: Payroll History Dashboard
**Acceptance Criteria:**
- [ ] List of past runs with date, status, total amount
- [ ] Each run expands to per-employee tx detail
- [ ] Tx hashes are clickable links to Base Sepolia explorer
- [ ] Agent wallet USDC balance shown live

---

## 5. Trust & Security Model

### Solution: Session Key Pattern

```
Master Wallet (user holds)        Session Key (agent holds)
──────────────────────────        ─────────────────────────
Full access to all funds          Can only send USDC
Can do anything on-chain          Can only send to whitelist addresses
Never shared with anyone          Cannot exceed spending limit
                                  Expires after 30 days
                                  Revocable anytime by user
```

| Risk | Solution |
|------|----------|
| Private key exposure | Session Key used — agent never holds user's real PK |
| Wrong recipient | Whitelist from CSV, confirmed by user before execution |
| Overspending | Spending limit = total monthly salary, hard cap |
| User loses control | One-click revoke from dashboard |

> **Answer for judges:** *"The spending limits are enforced by the smart contract on-chain, not just server code. Even if the backend is compromised, the attacker cannot move funds outside the whitelist or exceed the spending cap."*

---

## 6. Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Backend framework | **NestJS + TypeScript** | Structured, modular, professional — modules/controllers/services pattern |
| Blockchain | ethers.js v6 + Coinbase AgentKit | Session Key wallet, tx signing, USDC transfer |
| Network | Base Sepolia testnet | Fast, cheap, EVM-compatible, good faucet |
| Token | USDC (testnet) | Most common payroll token |
| Scheduler | @nestjs/schedule (cron) | Native NestJS cron support |
| CSV parser | csv-parse | Lightweight, reliable |
| Frontend | Next.js 14 + React + TailwindCSS | Fast to build, AI-generated via v0.dev |
| Notification | Telegram Bot API (node-telegram-bot-api) | Free, instant |
| Storage | JSON file store | Sufficient for MVP — no DB setup needed |
| Language | **TypeScript** (strict mode) | Type-safe, cleaner code, more professional |

---

## 7. Project Structure

```
paychef/
├── apps/
│   ├── api/                         # NestJS backend
│   │   ├── src/
│   │   │   ├── agent/
│   │   │   │   ├── agent.module.ts
│   │   │   │   ├── wallet.service.ts      # Session Key creation & signing
│   │   │   │   └── executor.service.ts    # Transaction execution loop
│   │   │   ├── payroll/
│   │   │   │   ├── payroll.module.ts
│   │   │   │   ├── payroll.controller.ts  # POST /payroll/upload, /run
│   │   │   │   ├── payroll.service.ts
│   │   │   │   └── dto/
│   │   │   │       └── upload-payroll.dto.ts
│   │   │   ├── session/
│   │   │   │   ├── session.module.ts
│   │   │   │   ├── session.controller.ts  # POST /session/create, /revoke
│   │   │   │   └── session.service.ts
│   │   │   ├── history/
│   │   │   │   ├── history.module.ts
│   │   │   │   ├── history.controller.ts  # GET /history
│   │   │   │   └── history.service.ts
│   │   │   ├── scheduler/
│   │   │   │   └── payroll.scheduler.ts   # @Cron() monthly trigger
│   │   │   ├── notification/
│   │   │   │   └── telegram.service.ts    # Telegram bot sender
│   │   │   ├── storage/
│   │   │   │   └── json-store.service.ts  # Read/write JSON files
│   │   │   └── app.module.ts
│   │   ├── data/
│   │   │   ├── payroll.json
│   │   │   ├── rules.json
│   │   │   └── history.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── web/                         # Next.js frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx               # Dashboard
│       │   │   └── layout.tsx
│       │   └── components/
│       │       ├── WalletConnect.tsx
│       │       ├── CsvUpload.tsx
│       │       ├── PayrollHistory.tsx
│       │       └── SessionKeyStatus.tsx
│       └── package.json
├── spec.md
├── README.md
└── .env.example
```

---

## 8. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/payroll/upload` | Upload & validate CSV, returns preview |
| `POST` | `/payroll/run` | Execute payroll immediately |
| `GET` | `/payroll/status` | Current payroll config + agent balance |
| `POST` | `/session/create` | Generate Session Key with whitelist + limit |
| `POST` | `/session/revoke` | Revoke active Session Key |
| `GET` | `/session/status` | Session Key info (active/expired/revoked) |
| `GET` | `/history` | List all past payroll runs |
| `GET` | `/history/:id` | Detail of a specific run |

---

## 9. Environment Variables

```env
# Blockchain
RPC_URL=https://sepolia.base.org
AGENT_PRIVATE_KEY=              # Session Key PK (generated, NOT user's key)
USDC_ADDRESS=                   # USDC contract on Base Sepolia

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# App
PORT=3001
NODE_ENV=development
```

---

## 10. Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| CSV has invalid wallet address | Reject upload, show which rows failed |
| Agent wallet has insufficient USDC | Block execution, show "top up required" |
| One tx fails mid-run | Log failure, continue with remaining txs |
| Session Key expired during run | Abort, notify user to renew |
| Duplicate CSV upload same month | Warn user, require confirmation to override |
| Telegram bot not connected | Log locally, show in dashboard instead |

---

## 11. Implementation Timeline

### Day 2 — Core Backend (NestJS)
- [ ] `nest new api` — init project with TypeScript strict
- [ ] `agent/wallet.service.ts` — generate Session Key wallet, send USDC via ethers.js
- [ ] Confirm testnet USDC transfer works on Base Sepolia explorer
- [ ] `payroll/` module — CSV upload, parse, validate
- [ ] `session/` module — create/revoke Session Key
- [ ] JSON file store service
- [ ] Basic scheduler wired up

### Day 3 — Frontend + Notifications
- [ ] Generate Next.js dashboard with v0.dev
- [ ] Wire all API calls from frontend
- [ ] `notification/telegram.service.ts` — send payroll summary
- [ ] Manual "Run Now" end-to-end working
- [ ] Full E2E: upload CSV → run → tx on explorer → Telegram message

### Day 4 — Polish + Demo Prep
- [ ] Error states: insufficient balance, invalid CSV feedback
- [ ] Session Key revoke button
- [ ] Demo script rehearsal
- [ ] Screenshot AI prompts for AI Showcase
- [ ] Final E2E re-test with clean data

---

## 12. Demo Script (Day 5)

| Step | Action | Shows |
|------|--------|-------|
| 1 | Open dashboard | Agent wallet address + USDC balance |
| 2 | Show Session Key panel | Active, whitelist 5 addresses, spending limit 1,500 USDC |
| 3 | Upload `payroll_march.csv` | Parsed preview table |
| 4 | Click "Run Now" | Live execution log |
| 5 | Open Telegram | "✅ 5/5 paid, 1,500 USDC" |
| 6 | Open Base Sepolia explorer | Confirmed on-chain tx |
| 7 | Dashboard history | Per-employee rows with tx hash links |

---

## 13. Business Model

| Tier | Price | Limits |
|------|-------|--------|
| Free | $0 | 5 addresses/month, manual trigger |
| Pro | $29/month | Unlimited, auto-schedule, 90-day history |
| Enterprise | Custom | On-premise, multi-chain, tax export, SLA |

---

## 14. Scope Cuts

| Cut | Reason |
|-----|--------|
| Multi-chain | 1 testnet proves concept, adding chains is config |
| Multi-token | USDC sufficient, adding tokens is a dropdown |
| Multi-sig | Doubles complexity, not needed for solo operator |
| Real DB | JSON store sufficient for MVP demo |
| Production security | Testnet only, HSM/TEE is Phase 3 |

---

## 15. Roadmap Post-MVP

| Phase | Feature |
|-------|---------|
| Phase 2 | Multi-chain (Base mainnet, Polygon), multi-token |
| Phase 3 | MPC wallet — stronger than Session Key |
| Phase 4 | Tax reporting — auto CSV export for accountants |
| Phase 5 | DAO treasury — on-chain vote before payroll executes |

---

*Spec generated with Claude · Repo: `paychef` · Submit to Lucas for Day 1 review by 4PM