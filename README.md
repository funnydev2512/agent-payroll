# 🍳 Paychef — Crypto Payroll Agent

**AI Agent Wallet for automated USDC payroll on Base Sepolia**

Built for the 5-day Agent Wallet hackathon with **NestJS + TypeScript**. Paychef automates crypto payroll by using a Session Key pattern — the agent executes transactions without ever holding your real private key.

---

## 🎯 What It Does

Upload a CSV of wallet addresses and salary amounts → Agent auto-executes all USDC transfers on schedule → Telegram notification with tx hashes.

**Demo flow (5 minutes):**
1. Upload `payroll.csv` (5 employees)
2. Create Session Key with spending limits
3. Click "Run Now"
4. Watch 5 transactions execute on Base Sepolia
5. Receive Telegram summary with tx links

---

## 🏗 Architecture

```
User's Master Wallet (MetaMask)
         ↓ (signs once to authorize)
    Session Key Wallet
         ↓ (bounded autonomy)
    - Only send USDC
    - Only to whitelist addresses
    - Max spending = total payroll
    - Expires in 30 days
         ↓
    Agent executes txs automatically
```

**Security:** Spending rules enforced on-chain. Even if the server is breached, funds can only go to whitelisted employees.

---

## 🏗 Tech Stack

- **Backend:** NestJS + TypeScript (strict mode)
- **Blockchain:** ethers.js v6, Base Sepolia testnet
- **Token:** USDC (testnet)
- **Scheduler:** @nestjs/schedule with @Cron decorator
- **Storage:** JSON file store
- **Notification:** Telegram Bot API

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Project

```bash
npm run build
```

### 3. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Base Sepolia RPC (use Alchemy, Infura, or public RPC)
RPC_URL=https://sepolia.base.org

# Leave empty initially - will be generated
AGENT_PRIVATE_KEY=

# USDC on Base Sepolia (testnet)
USDC_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e

# Telegram (optional for MVP)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

PORT=3001

EXPLORER_URL=https://sepolia.basescan.org
```

### 4. Start Backend

```bash
# Development mode (auto-reload)
npm run start:dev

# Or production mode
npm run start:prod
```

Server runs on `http://localhost:3001`

---

## 📋 API Usage

### Step 1: Upload Payroll CSV

```bash
curl -X POST http://localhost:3001/api/payroll/upload \
  -F "file=@payroll_sample.csv"
```

**CSV format:**
```csv
name,wallet_address,usdc_amount
Alice,0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0,500
Bob,0x5B38Da6a701c568545dCfcB03FcB875f56beddC4,750
```

### Step 2: Create Session Key

```bash
curl -X POST http://localhost:3001/api/session/create
```

Response includes:
- Session Key address
- Private key (add to `.env` as `AGENT_PRIVATE_KEY`)
- Whitelist of addresses
- Spending limit

**Important:** Fund the Session Key address with USDC on Base Sepolia before running payroll.

### Step 3: Fund Session Key

Get testnet USDC:
1. Get Base Sepolia ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Get testnet USDC from [Circle Faucet](https://faucet.circle.com/) or swap ETH for USDC on testnet DEX

Transfer USDC to the Session Key address.

### Step 4: Check Balance

```bash
curl http://localhost:3001/api/session/balance
```

### Step 5: Run Payroll

```bash
curl -X POST http://localhost:3001/api/payroll/run
```

Agent executes all transactions. Check Telegram for summary.

### Step 6: View History

```bash
curl http://localhost:3001/api/history
```

---

## 🔐 Session Key Security

The Session Key is a **separate wallet** with hard limits:

| Master Wallet | Session Key |
|---------------|-------------|
| Full access to all funds | Can only send USDC |
| Can do anything on-chain | Can only send to whitelist |
| Never shared | Cannot exceed spending limit |
| User controls | Expires in 30 days |

**Attack scenarios:**
- **Server hacked?** Attacker can only pay whitelisted employees
- **Prompt injection?** Same constraint — blockchain enforces rules
- **Session Key leaked?** Worst case: correct salaries paid to correct people
- **Agent goes rogue?** Hard spending cap enforced on-chain

**Revoke anytime:**
```bash
curl -X POST http://localhost:3001/api/session/revoke
```

---

## 📅 Scheduler

Set monthly auto-run:

```bash
curl -X POST http://localhost:3001/api/schedule \
  -H "Content-Type: application/json" \
  -d '{"dayOfMonth": 1, "hour": 9, "minute": 0}'
```

Runs on the 1st of every month at 9:00 AM.

---

## 🤖 Telegram Setup (Optional)

1. Create bot with [@BotFather](https://t.me/botfather)
2. Get bot token
3. Start chat with your bot
4. Get your chat ID: `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Add to `.env`:

```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=123456789
```

---

## 📁 Project Structure

```
paychef/
├── src/
│   ├── agent/
│   │   ├── agent.module.ts       # Agent module
│   │   ├── wallet.service.ts     # Session Key wallet (ethers.js)
│   │   └── executor.service.ts   # Transaction execution
│   ├── payroll/
│   │   ├── payroll.module.ts
│   │   ├── payroll.controller.ts # CSV upload & run endpoints
│   │   ├── payroll.service.ts
│   │   └── dto/
│   │       └── upload-payroll.dto.ts
│   ├── session/
│   │   ├── session.module.ts
│   │   ├── session.controller.ts # Session Key management
│   │   └── session.service.ts
│   ├── history/
│   │   ├── history.module.ts
│   │   ├── history.controller.ts # Payroll history
│   │   └── history.service.ts
│   ├── scheduler/
│   │   ├── scheduler.module.ts
│   │   └── payroll.scheduler.ts  # @Cron() scheduler
│   ├── notification/
│   │   ├── notification.module.ts
│   │   └── telegram.service.ts   # Telegram bot
│   ├── storage/
│   │   ├── storage.module.ts
│   │   └── json-store.service.ts # JSON file operations
│   ├── common/
│   │   └── interfaces.ts         # TypeScript interfaces
│   ├── app.module.ts             # Root module
│   ├── app.controller.ts         # Health check
│   └── main.ts                   # Bootstrap
├── data/                         # JSON file store
│   ├── payroll.json              # Current payroll
│   ├── rules.json                # Session Key config
│   └── history.json              # Past runs
├── frontend/                     # Next.js app (coming next)
├── spec.md                       # Full specification
├── payroll_sample.csv            # Sample CSV
├── tsconfig.json                 # TypeScript config
└── package.json
```

---

## 🧪 Testing on Base Sepolia

1. **Get testnet ETH:** [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. **Get testnet USDC:** [Circle Faucet](https://faucet.circle.com/)
3. **USDC Contract:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
4. **Explorer:** [Base Sepolia Scan](https://sepolia.basescan.org)

---

## 🎬 Demo Script

**Total time: ~5 minutes**

1. Show dashboard with Agent Wallet address + balance
2. Upload `payroll_sample.csv` (5 employees)
3. Review parsed preview table
4. Click "Run Now"
5. Watch live execution log
6. Open Telegram → see "✅ 5/5 paid, 2,600 USDC"
7. Click tx hash → view on Base Sepolia explorer
8. Show history table with per-employee details

---

## 🛣 Roadmap

- **Phase 1 (MVP):** USDC on Base Sepolia, single-user, manual + scheduled runs ✅
- **Phase 2:** Multi-chain (Base mainnet, Polygon), multi-token (ETH, stablecoins)
- **Phase 3:** MPC wallet for stronger security
- **Phase 4:** Tax reporting CSV export
- **Phase 5:** DAO treasury integration with governance votes
- **Phase 6:** HR tool integrations (Notion, Airtable, Google Sheets)

---

## 🐛 Troubleshooting

### "Wallet not initialized"
- Make sure `AGENT_PRIVATE_KEY` is set in `.env`
- Restart server after adding the key

### "Insufficient balance"
- Fund the Session Key address with USDC
- Check balance: `curl http://localhost:3001/api/session/balance`

### "Address not in whitelist"
- Session Key can only send to addresses in the uploaded CSV
- Upload a new CSV or create a new Session Key

### "Spending limit exceeded"
- Session Key has a hard cap = total CSV amount
- Create a new Session Key for additional payrolls

---

## 📝 License

MIT

---

**Built with:** NestJS · TypeScript · ethers.js · Base Sepolia · USDC

**Hackathon:** Agent Wallet Theme · 5-day sprint

**Architecture:** Modular NestJS with dependency injection, decorators, and strict TypeScript

**Demo:** Upload CSV → Run Now → 5 txs on Base Sepolia → Telegram notification ✅
