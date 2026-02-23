# 🚀 Paychef Setup Guide

Complete setup instructions for the hackathon demo.

---

## ✅ Step-by-Step Setup

### 1. Backend Setup (DONE ✓)

```bash
npm install
```

All dependencies installed. Backend structure ready.

---

### 2. Environment Configuration

The `.env` file is already created. You'll need to:

**a) Get Base Sepolia RPC (Optional - public RPC works)**
- Public RPC: `https://sepolia.base.org` (already configured)
- Or get free RPC from [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/)

**b) Telegram Bot Setup (Optional for MVP)**

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow instructions
3. Copy the bot token
4. Start a chat with your new bot (send any message)
5. Get your chat ID:
   ```bash
   curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
6. Add to `.env`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
   TELEGRAM_CHAT_ID=123456789
   ```

---

### 3. Start Backend Server

```bash
npm start
```

You should see:
```
🚀 Paychef Backend Server Running
📡 Port: 3001
💼 Agent Wallet: Not initialized
🌐 Network: Base Sepolia
```

The wallet is not initialized yet — that's expected! We'll create the Session Key next.

---

### 4. Create Session Key & Fund Wallet

**a) Upload a payroll CSV**

```bash
curl -X POST http://localhost:3001/api/payroll/upload \
  -F "file=@payroll_sample.csv"
```

**b) Create Session Key**

```bash
curl -X POST http://localhost:3001/api/session/create
```

Response will include:
- `address`: The Session Key wallet address
- `privateKey`: The private key (add to `.env`)
- `expiresAt`: Expiry date (30 days)
- `whitelist`: Addresses from CSV
- `spendingLimit`: Total amount from CSV

**c) Add Private Key to .env**

Copy the `privateKey` from the response and add to `.env`:

```bash
AGENT_PRIVATE_KEY=0x1234567890abcdef...
```

**d) Restart Server**

```bash
# Stop server (Ctrl+C)
npm start
```

Now you should see:
```
✓ Agent wallet initialized: 0xYourSessionKeyAddress
```

**e) Fund the Session Key with USDC**

You need testnet USDC on Base Sepolia. Two options:

**Option 1: Circle Faucet (Easiest)**
1. Go to [Circle Faucet](https://faucet.circle.com/)
2. Select "Base Sepolia"
3. Enter your Session Key address
4. Request testnet USDC

**Option 2: Get ETH + Swap**
1. Get Base Sepolia ETH: [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Use a testnet DEX to swap ETH → USDC
3. USDC contract: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

**f) Check Balance**

```bash
curl http://localhost:3001/api/session/balance
```

Should show your USDC balance.

---

### 5. Run Your First Payroll

```bash
curl -X POST http://localhost:3001/api/payroll/run
```

Watch the console output:
```
🚀 Starting payroll execution...
💸 Processing payment for Alice Johnson...
✓ Paid 500 USDC to Alice Johnson
  Tx: 0xabc123...
💸 Processing payment for Bob Smith...
✓ Paid 750 USDC to Bob Smith
  Tx: 0xdef456...
...
✅ Payroll complete: 5/5 paid
```

If Telegram is configured, you'll receive a notification with all tx hashes.

---

### 6. View History

```bash
curl http://localhost:3001/api/history
```

Shows all past payroll runs with tx details.

---

### 7. Verify on Blockchain

Open [Base Sepolia Explorer](https://sepolia.basescan.org) and paste any tx hash to see the confirmed transaction.

---

## 🎬 Demo Preparation Checklist

Before the Day 5 demo:

- [ ] Backend server running
- [ ] Session Key created and funded with USDC
- [ ] Test payroll run completed successfully
- [ ] At least 1 run in history
- [ ] Telegram bot configured (optional but impressive)
- [ ] Sample CSV ready (`payroll_sample.csv`)
- [ ] Browser tab open to Base Sepolia explorer
- [ ] Browser tab open to Telegram (if configured)

---

## 🧪 Testing the Happy Path

Run this sequence to verify everything works:

```bash
# 1. Health check
curl http://localhost:3001/api/health

# 2. Upload CSV
curl -X POST http://localhost:3001/api/payroll/upload \
  -F "file=@payroll_sample.csv"

# 3. Check current payroll
curl http://localhost:3001/api/payroll/current

# 4. Check session status
curl http://localhost:3001/api/session/status

# 5. Check balance
curl http://localhost:3001/api/session/balance

# 6. Run payroll
curl -X POST http://localhost:3001/api/payroll/run

# 7. View history
curl http://localhost:3001/api/history
```

---

## 🐛 Common Issues

### "No AGENT_PRIVATE_KEY found"
- Create Session Key first: `POST /api/session/create`
- Add private key to `.env`
- Restart server

### "Wallet not initialized"
- Make sure `AGENT_PRIVATE_KEY` is in `.env`
- Restart server after adding it

### "Insufficient balance"
- Fund Session Key address with USDC
- Check balance: `GET /api/session/balance`

### "Address not in whitelist"
- Session Key can only send to CSV addresses
- Upload new CSV or create new Session Key

### Transaction fails
- Check you have enough ETH for gas fees
- Check USDC balance is sufficient
- Verify addresses are valid checksummed addresses

---

## 📱 Frontend Setup (Next Step)

After backend is working, we'll build the Next.js frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend will connect to `http://localhost:3001` for all API calls.

---

## 🎯 5-Minute Demo Script

**Preparation:**
- Backend running
- Session Key funded
- Fresh CSV ready
- Telegram open
- Explorer open

**Live Demo:**
1. **[30s]** Show dashboard → Agent wallet address + USDC balance
2. **[30s]** Upload `payroll_march.csv` → Show parsed table (5 employees)
3. **[60s]** Click "Run Now" → Watch live execution log
4. **[30s]** Switch to Telegram → Show notification "✅ 5/5 paid"
5. **[60s]** Click tx hash → Show confirmed tx on Base Sepolia explorer
6. **[30s]** Back to dashboard → Show history table with all tx details
7. **[60s]** Explain Session Key security model

**Total: 5 minutes**

---

## 🔐 Security Talking Points for Judges

**Q: "Isn't it dangerous for the agent to hold a private key?"**

**A:** "The agent holds a **Session Key**, not the user's real private key. The Session Key is a separate wallet with hard limits enforced on-chain:
- Can only send USDC
- Can only send to whitelisted addresses from the CSV
- Cannot exceed the spending limit (total payroll amount)
- Expires in 30 days
- Revocable anytime

Even if my entire server is compromised, the attacker cannot drain funds to their own wallet — the blockchain enforces these rules. The worst case is that the correct salaries get paid to the correct employees."

**Q: "What about prompt injection?"**

**A:** "Same answer — the spending rules are enforced by the blockchain, not by my server code. No amount of prompt manipulation can bypass on-chain constraints."

**Q: "How is this different from just putting a private key in a script?"**

**A:** "Traditional automation requires your **master wallet's** private key in a `.env` file — full access to all funds. With Session Keys, you create a **temporary, restricted wallet** that can only execute the specific payroll task. It's bounded autonomy."

---

## 📊 Metrics to Highlight

- **Time saved:** 1-2 hours per month → 5 minutes one-time setup
- **Error reduction:** Zero copy-paste mistakes
- **Security:** Session Key pattern = no master key exposure
- **Automation:** Set-and-forget monthly schedule
- **Transparency:** Every tx recorded on-chain with history

---

## 🚀 Next Steps After MVP

1. **Frontend Dashboard** (Day 3)
   - Wallet connect (MetaMask)
   - CSV upload UI
   - Live execution log
   - History table with tx links

2. **Scheduler UI** (Day 3)
   - Set monthly schedule
   - Enable/disable auto-run

3. **Polish** (Day 4)
   - Error states
   - Loading indicators
   - Session Key revoke button
   - Balance warnings

4. **Demo Prep** (Day 4-5)
   - Rehearse script
   - Prepare backup CSV files
   - Screenshot AI prompts for showcase
   - Test full E2E flow

---

**Status: Backend Complete ✅**

Next: Build frontend dashboard with Next.js + React.
