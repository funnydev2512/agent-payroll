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
6. If one fails (gas spike, wrong nonce) → debug manually

**Time cost:** 1–2 hours per month
**Risk:** Wrong address paste = lost funds forever. Missed payment = unhappy contributor.

### Why current tools don't solve it

| Tool | Why it fails |
|------|-------------|
| Spreadsheet + manual | Slow, error-prone, zero automation |
| Gnosis Safe (multi-sig) | Requires multiple signers online simultaneously, still manual |
| Deel / traditional payroll | Fiat-first, not built for crypto-native teams |
| Raw bot scripts | User must put private key in `.env` → massive security risk |

### Why Agent Wallet is the right answer
Agent Wallet gives the agent **bounded autonomy** — it acts without asking the user every time, but only within strict rules defined upfront. This is exactly what payroll needs: predictable, recurring, rule-based transactions.

---

## 3. Core Flow (Happy Path)

> This is the **only flow** that needs to work perfectly for the demo.

```
[User]
  → Connect wallet (MetaMask)
  → Dashboard shows: Agent Wallet address + USDC balance
  → Upload payroll.csv (columns: name, wallet_address, usdc_amount)
  → Review & confirm whitelist
  → Set schedule: "Run on 1st of every month at 9AM"
    (or click "Run Now" for demo)

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
**As a** team lead,
**I want to** upload a CSV file with my team's wallet addresses and salary amounts,
**So that** I don't have to manually enter each person's info.

**Acceptance Criteria:**
- [ ] System accepts `.csv` with columns: `name`, `wallet_address`, `usdc_amount`
- [ ] System validates each wallet address format (0x... checksum)
- [ ] System shows parsed preview table before confirmation
- [ ] System rejects invalid addresses and shows which rows failed
- [ ] System calculates and displays total USDC required

### US-2: Session Key Setup
**As a** team lead,
**I want to** authorize the agent with limited permissions,
**So that** the agent can run payroll without me being online and without holding my real private key.

**Acceptance Criteria:**
- [ ] User signs one authorization transaction from their main wallet
- [ ] Session Key is created with: whitelist = CSV addresses, spending limit = CSV total, expiry = 30 days
- [ ] Dashboard shows Session Key status: active / expired / revoked
- [ ] User can revoke Session Key at any time with one click

### US-3: Schedule & Execute Payroll
**As a** team lead,
**I want to** set a recurring payroll schedule,
**So that** the agent runs automatically every month without me doing anything.

**Acceptance Criteria:**
- [ ] User can set day of month and time for auto-run
- [ ] Agent executes all transactions in the CSV when triggered
- [ ] Each transaction is confirmed on-chain before moving to the next
- [ ] If a transaction fails, agent logs the error and continues with remaining txs
- [ ] Manual "Run Now" trigger available for demo / one-off runs

### US-4: Telegram Notification
**As a** team lead,
**I want to** receive a Telegram message after payroll runs,
**So that** I know the result without checking the dashboard.

**Acceptance Criteria:**
- [ ] Telegram bot sends summary after each run
- [ ] Message includes: success count, fail count, total USDC sent, tx hash links
- [ ] Failed transactions are listed with reason
- [ ] Message sent within 60 seconds of last tx confirming

### US-5: Payroll History Dashboard
**As a** team lead,
**I want to** see a history of all past payroll runs,
**So that** I can audit and verify payments.

**Acceptance Criteria:**
- [ ] Dashboard shows list of runs with: date, status, total amount
- [ ] Each run expands to show per-employee tx detail
- [ ] Tx hashes are clickable links to testnet explorer
- [ ] Agent wallet USDC balance shown live

---

## 5. Trust & Security Model

> **Core concern from judges:** Agent needs to sign transactions — but holding the private key = risk of PK exposure via prompt injection or server breach.

### Solution: Session Key Pattern

The user's **master wallet** never touches the agent. User signs once to create a **Session Key** — a separate, restricted signing key with hard limits.

```
Master Wallet (user holds)        Session Key (agent holds)
──────────────────────────        ─────────────────────────
Full access to all funds          Can only send USDC
Can do anything on-chain          Can only send to whitelist addresses
Never shared with anyone          Cannot exceed spending limit
                                  Expires after 30 days
                                  Revocable anytime by user
```

### Security enforced on-chain — not just server-side

Spending rules are enforced by a **smart contract wallet** (ERC-4337 Account Abstraction). Even if the server is breached, the attacker cannot bypass these rules — the blockchain validates them.

| Attack Vector | Protection |
|---------------|------------|
| Server gets hacked | Session Key can only pay whitelist addresses — attacker cannot drain to their own wallet |
| Prompt injection tricks agent | Same constraint — the signing key is physically restricted by smart contract |
| Session Key is leaked | Attacker can at most pay the correct salary to the correct employees |
| Agent runs amok | Spending limit = total payroll amount, hard cap enforced on-chain |
| User wants to stop | One-click revoke from dashboard — instant, on-chain |

### How to defend this to judges
> *"The spending limits are not enforced by my server code — they are enforced by a smart contract on the blockchain. Even if my entire backend is compromised, the attacker cannot move funds outside the whitelist or exceed the spending cap. The rules are immutable once the Session Key is issued."*

---

## 6. MVP Features

| Feature | In MVP? | Notes |
|---------|---------|-------|
| CSV upload & parse | ✅ | Core feature |
| Wallet address validation | ✅ | Checksum validation |
| Session Key creation | ✅ | Via Coinbase AgentKit or ethers.js |
| Whitelist enforcement | ✅ | On-chain via smart contract wallet |
| Spending limit | ✅ | Set = total of CSV |
| Manual "Run Now" trigger | ✅ | For demo |
| Auto scheduler (monthly) | ✅ | node-cron |
| Telegram notification | ✅ | Success + fail summary with tx hashes |
| Payroll history dashboard | ✅ | Simple table, clickable tx hash links |
| Session Key revoke | ✅ | One-click from dashboard |
| Multi-chain | ❌ | Roadmap Phase 2 |
| Multi-token (ETH, SOL) | ❌ | Roadmap Phase 2 |
| Multi-sig approval | ❌ | Roadmap Phase 3 |
| Tax report export | ❌ | Roadmap Phase 4 |

---

## 7. Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Agent Wallet | Coinbase AgentKit + ethers.js | Session Key creation, signing, tx execution |
| Blockchain | Base Sepolia testnet | Fast, cheap, EVM-compatible, good faucet |
| Token | USDC (testnet) | Stablecoin, most common payroll token, easy to demo |
| Backend | Node.js + Express | BE home turf, fast to build |
| Scheduler | node-cron | Simple cron job, zero infra overhead |
| CSV parser | csv-parse (npm) | Lightweight, reliable |
| Frontend | Next.js + React | AI-generated via v0.dev for speed |
| Notification | Telegram Bot API | Free, instant, trivial to set up |
| Storage | JSON file store | Sufficient for MVP — no DB setup needed |

### Proposed file structure
```
paychef/
├── src/
│   ├── agent/
│   │   ├── wallet.js        # Session Key creation & management
│   │   ├── executor.js      # Transaction execution loop
│   │   └── scheduler.js     # node-cron payroll scheduler
│   ├── api/
│   │   ├── payroll.js       # POST /api/payroll/upload, /run
│   │   ├── session.js       # POST /api/session/create, /revoke
│   │   └── history.js       # GET /api/history
│   ├── bot/
│   │   └── telegram.js      # Notification sender
│   └── data/
│       ├── payroll.json     # Current payroll CSV data
│       ├── rules.json       # Session Key config & whitelist
│       └── history.json     # Past payroll run logs
├── frontend/                # Next.js app (v0.dev generated)
├── spec.md
├── README.md
└── .env.example
```

---

## 8. Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| CSV has invalid wallet address | Reject upload, highlight which rows failed |
| Agent wallet has insufficient USDC | Block execution, show "top up required" in dashboard |
| One tx fails mid-run (gas spike, network) | Log failure, continue with remaining, report in Telegram |
| Session Key expires during run | Abort, notify user to renew Session Key |
| Duplicate CSV upload same month | Warn user, require explicit confirmation to override |
| Telegram bot not connected | Log locally, show result in dashboard instead |
| User tries to run with no CSV uploaded | Block with clear error message |

---

## 9. Implementation Timeline

### Day 2 — Core Backend
- [ ] Init Node.js project, install all dependencies
- [ ] Setup Coinbase AgentKit — create agent wallet on Base Sepolia
- [ ] Implement Session Key creation with whitelist + spending limit
- [ ] CSV parser API: `POST /api/payroll/upload`
- [ ] Transaction executor: iterate payroll list, send USDC per row
- [ ] Confirm successful USDC transfer on Base Sepolia explorer
- [ ] JSON file store for rules + history

### Day 3 — Frontend + Notifications
- [ ] Generate dashboard UI with v0.dev (wallet connect, CSV upload, history table)
- [ ] Wire frontend to all backend APIs
- [ ] Telegram bot: send payroll summary after each run
- [ ] Manual "Run Now" button working end-to-end
- [ ] node-cron scheduler wired up and tested
- [ ] Full E2E: upload CSV → run → see tx on explorer → Telegram message arrives

### Day 4 — Polish + Demo Prep
- [ ] Session Key revoke button working on dashboard
- [ ] Error states: insufficient balance warning, invalid CSV feedback
- [ ] Rehearse demo script (full happy path, 5 minutes)
- [ ] Capture AI prompt screenshots for AI Showcase
- [ ] Final E2E re-test with fresh data

---

## 10. Demo Script (Day 5 Presentation)

**Total time: ~5 minutes**

| Step | Action | Shows |
|------|--------|-------|
| 1 | Open dashboard | Agent wallet address + USDC balance on Base Sepolia |
| 2 | Show Session Key panel | Active, whitelist of 5 addresses, spending limit = 1,500 USDC |
| 3 | Upload `payroll_march.csv` | Parsed preview table with 5 employees |
| 4 | Click "Run Now" | Live execution log appearing in real-time |
| 5 | Open Telegram | Notification: "✅ 5/5 paid, 1,500 USDC" |
| 6 | Open Base Sepolia explorer | Paste tx hash → confirmed on-chain transaction |
| 7 | Dashboard history | Per-employee rows with clickable tx hashes |

---

## 11. Business Model

| Tier | Price | Limits | Target |
|------|-------|--------|--------|
| Free | $0 | 5 addresses/month, manual trigger only | Try before buy |
| Pro | $29/month | Unlimited addresses, auto-schedule, 90-day history, multi-token | Small teams (5–50 people) |
| Enterprise | Custom | On-premise, multi-chain, tax CSV export, SLA | DAOs, larger orgs |

**Revenue logic:** If a team lead saves 2 hours of manual work per month → worth it at any reasonable hourly rate. Payroll is inherently sticky (runs every month automatically).

---

## 12. Scope Cuts & Reasoning

| Cut | Reason |
|-----|--------|
| Multi-chain | 1 testnet proves the concept. Adding chains is a config change, not an architecture change |
| Multi-token | USDC is the most common payroll token. Adding ETH/SOL is a UI dropdown |
| Multi-sig | Doubles complexity (quorum logic, multiple signers online). Not needed for solo operator |
| Polished UI | v0.dev output is sufficient for demo. Design improves post-MVP |
| Production security | Testnet only. Real key management (HSM, TEE) is Phase 3 |
| Mobile app | Payroll is set-and-forget, done on desktop once a month |

---

## 13. Roadmap Post-MVP

| Phase | Feature |
|-------|---------|
| Phase 2 | Multi-chain (Base mainnet, Polygon), multi-token (ETH, stablecoins) |
| Phase 3 | MPC wallet — private key split across parties, stronger than Session Key |
| Phase 4 | Tax reporting — auto-generate CSV for accountants, on-chain payment proof |
| Phase 5 | DAO treasury tier — on-chain governance vote required before payroll executes |
| Phase 6 | HR integrations — sync from Notion, Airtable, Google Sheets for headcount |

---

*Spec generated with Claude · Repo: `paychef` · Submit to Lucas for Day 1 review by 4PM*
