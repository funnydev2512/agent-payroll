# ⚡ Paychef Quickstart

Get up and running in 5 minutes.

---

## 🎯 What You Have Now

✅ **Complete Backend** — All API endpoints working
✅ **Session Key System** — Secure wallet with spending limits
✅ **Transaction Executor** — Auto-execute USDC payroll
✅ **Telegram Notifications** — Real-time updates
✅ **Scheduler** — Monthly auto-run capability
✅ **Full Documentation** — API reference, setup guide, spec

---

## 🚀 Start in 3 Steps

### 1. Start Server

```bash
npm start
```

You'll see:
```
🚀 Paychef Backend Server Running
📡 Port: 3001
⚠ No AGENT_PRIVATE_KEY found. Generate one with createSessionKey()
```

This is normal! We'll create the Session Key next.

---

### 2. Create & Fund Session Key

**a) Upload payroll CSV:**
```bash
curl -X POST http://localhost:3001/api/payroll/upload \
  -F "file=@payroll_sample.csv"
```

**b) Create Session Key:**
```bash
curl -X POST http://localhost:3001/api/session/create
```

**c) Copy the private key from response and add to `.env`:**
```bash
AGENT_PRIVATE_KEY=0xYourPrivateKeyHere
```

**d) Restart server:**
```bash
# Ctrl+C to stop, then:
npm start
```

Now you'll see:
```
✓ Agent wallet initialized: 0xYourSessionKeyAddress
```

**e) Fund with testnet USDC:**
- Go to [Circle Faucet](https://faucet.circle.com/)
- Select "Base Sepolia"
- Paste your Session Key address
- Request USDC

---

### 3. Run Your First Payroll

```bash
curl -X POST http://localhost:3001/api/payroll/run
```

Watch the console:
```
🚀 Starting payroll execution...
💸 Processing payment for Alice Johnson...
✓ Paid 500 USDC to Alice Johnson
  Tx: 0xabc123...
...
✅ Payroll complete: 5/5 paid
```

**Done!** 🎉

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `README.md` | Full project documentation |
| `SETUP.md` | Detailed setup instructions |
| `API_REFERENCE.md` | Complete API documentation |
| `PROJECT_STATUS.md` | Current progress & roadmap |
| `spec.md` | Original hackathon specification |
| `test-backend.sh` | Quick backend test script |
| `payroll_sample.csv` | Sample payroll data |

---

## 🧪 Test Everything

Run the test script:
```bash
./test-backend.sh
```

Or manually:
```bash
# Health check
curl http://localhost:3001/api/health

# Session status
curl http://localhost:3001/api/session/status

# Balance
curl http://localhost:3001/api/session/balance

# History
curl http://localhost:3001/api/history
```

---

## 🎬 Demo Checklist

Before your demo:

- [ ] Backend server running
- [ ] Session Key created
- [ ] Session Key funded with USDC
- [ ] Test payroll run completed
- [ ] Telegram bot configured (optional)
- [ ] Browser tab: Base Sepolia explorer
- [ ] Browser tab: Telegram (if configured)
- [ ] Fresh CSV file ready

---

## 🔥 Quick Commands

```bash
# Start server
npm start

# Upload CSV
curl -X POST http://localhost:3001/api/payroll/upload -F "file=@payroll_sample.csv"

# Create Session Key
curl -X POST http://localhost:3001/api/session/create

# Check balance
curl http://localhost:3001/api/session/balance

# Run payroll
curl -X POST http://localhost:3001/api/payroll/run

# View history
curl http://localhost:3001/api/history

# Revoke Session Key
curl -X POST http://localhost:3001/api/session/revoke
```

---

## 🆘 Troubleshooting

### Server won't start
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>
```

### "Wallet not initialized"
- Add `AGENT_PRIVATE_KEY` to `.env`
- Restart server

### "Insufficient balance"
- Fund Session Key with USDC
- Check balance: `curl http://localhost:3001/api/session/balance`

### Transaction fails
- Check you have ETH for gas
- Verify USDC balance is sufficient
- Check address is in whitelist

---

## 🎯 Next Steps

1. **Test the happy path** — Upload CSV → Run payroll → Check history
2. **Configure Telegram** (optional) — See `SETUP.md`
3. **Build frontend** (Day 3) — Next.js dashboard
4. **Prepare demo** (Day 4-5) — Rehearse script

---

## 📊 What's Working

✅ CSV upload & validation
✅ Session Key creation
✅ Whitelist enforcement
✅ Spending limit tracking
✅ USDC transfers on Base Sepolia
✅ Transaction confirmations
✅ Telegram notifications
✅ Payroll history
✅ Session Key revocation
✅ Auto-scheduler (backend)

---

## 🚧 What's Next

⏳ Frontend dashboard (Day 3)
⏳ Wallet connect integration (Day 3)
⏳ Live execution log UI (Day 3)
⏳ Schedule configuration UI (Day 4)
⏳ Error handling UI (Day 4)
⏳ Demo rehearsal (Day 5)

---

## 💡 Pro Tips

1. **Pre-fund multiple Session Keys** — Testnet faucets can be slow
2. **Keep backup RPC URLs** — In case primary is down
3. **Test with small amounts first** — Verify everything works
4. **Save all tx hashes** — For demo presentation
5. **Have backup CSV files** — In case you need to re-demo

---

## 🔗 Important Links

- **Base Sepolia Explorer:** https://sepolia.basescan.org
- **Base Sepolia Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Circle USDC Faucet:** https://faucet.circle.com/
- **USDC Contract:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

---

**Status: Backend Complete ✅**

You're ready to test the full backend flow. Next up: build the frontend dashboard!
