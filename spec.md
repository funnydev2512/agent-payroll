# SPEC — CRYPTO PAYROLL AGENT
**Agent Wallet · Cook Your MVP · Day 1 Submission**

---

## 1. MVP Overview

| Field | Details |
|-------|---------|
| **Theme** | Agent Wallet |
| **MVP Name** | Crypto Payroll Agent |
| **User** | Web3 startups, DAOs, remote teams paying salaries in crypto monthly |
| **Problem** | Crypto payroll is fully manual: copy-paste wallet addresses, sign multiple transactions one by one, takes 1–2 hours per month. High risk of wrong address, missed payment, or private key exposure when using automation tools |
| **Core Flow** | Upload CSV of employees → Set payroll date & time → Agent auto-executes all transactions → Telegram notification with results |
| **Scope Cut** | MVP supports USDC on 1 testnet only. No multi-chain, no multi-sig, no fancy UI |

---

## 2. Core Flow (Happy Path)

This is the only flow that needs to work perfectly for the demo:

1. User connects wallet → Dashboard shows Session Key wallet address
2. User uploads CSV file with employee list (name, wallet address, USDC amount)
3. User confirms whitelist and sets payroll date (or manually triggers for demo)
4. Agent auto-executes all transactions within Session Key spending limit
5. Telegram bot sends: "✅ Paid 5 employees, total 1,500 USDC — view tx hashes"
6. Dashboard updates payroll history, shows tx hash per employee

---

## 3. MVP Features

| Feature | Description |
|---------|-------------|
| CSV Payroll Upload | Name, wallet address, USDC amount — Agent parses and validates before execution |
| Session Key (no real PK) | User signs once to grant limited permission: USDC only, whitelist addresses only, max = total monthly salary |
| Auto Scheduler | Set payroll date → Agent executes automatically, no need to be online |
| Telegram Notification | Reports result after each run: success / failure / tx hashes |
| Simple Dashboard | View agent wallet balance, payroll history, per-transaction status |

---

## 4. Trust & Security Model

> **Core concern:** Agent needs to sign transactions, but holding the private key = risk of PK exposure and prompt injection.

**Solution: Session Key Pattern**

| Risk | Solution |
|------|----------|
| Private key exposure | Session Key used — agent never holds the user's real private key |
| Wrong recipient | Whitelist addresses from CSV confirmed by user before execution |
| Overspending | Spending limit = total monthly salary, cannot be exceeded |
| User loses control | User can revoke Session Key anytime from dashboard |

> → The agent never has access beyond the user-confirmed whitelist. A compromised Session Key can only pay the right salary to the right people — nothing else.

---

## 5. Tech Stack

| Layer | Technology |
|-------|------------|
| Agent Wallet | Coinbase AgentKit / ethers.js — Session Key wallet creation |
| Blockchain | Testnet (Base Sepolia or Ethereum Sepolia), USDC |
| Backend | Node.js + node-cron scheduler + CSV parser |
| Frontend | Next.js / React (AI-generated via v0.dev) |
| Notification | Telegram Bot API |
| Storage (MVP) | JSON file store (rules.json, payroll.json, history.json) |

---

## 6. Implementation Timeline (Day 2–4)

| Day | Tasks |
|-----|-------|
| Day 2 | Setup Coinbase AgentKit + Session Key wallet · CSV parser API · Scheduler with tx execution · Successful testnet USDC transfer |
| Day 3 | Dashboard UI (v0.dev) · CSV upload flow · Transaction history · Telegram bot notification · E2E test on testnet |
| Day 4 | Polish happy path · Prepare demo script · Screenshot AI prompts · Full end-to-end re-test |

---

## 7. Business Model

| Tier | Details |
|------|---------|
| Free | Up to 5 addresses/month, manual trigger only |
| Pro ($29/month) | Unlimited addresses, auto-schedule, 90-day history, multi-token |
| Enterprise | On-premise, multi-chain, tax reporting, SLA |

---

## 8. Scope Cuts & Reasoning

- **Multi-chain:** 1 testnet is enough to demo; adding chains is roadmap
- **Multi-token (ETH, SOL...):** USDC is sufficient to prove the concept, stablecoin is easiest for demo
- **Multi-sig approval flow:** adds complexity not needed for MVP
- **Polished UI:** generated with v0.dev, good enough for demo
- **Production security:** testnet only, no mainnet deployment within 5 days

---

## 9. Roadmap Post-MVP

- **Phase 2:** Multi-chain (Base mainnet, Polygon), multi-token support
- **Phase 3:** MPC wallet — no single party holds a full PK, stronger than Session Key
- **Phase 4:** Automated tax reporting (CSV export for accountants)
- **Phase 5:** DAO treasury tier — on-chain vote before payroll execution

---

*Spec generated with Claude · Submit to Lucas for Day 1 review by 4PM*
