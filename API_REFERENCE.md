# 🔌 Paychef API Reference

Complete API documentation for all backend endpoints.

**Base URL:** `http://localhost:3001`

---

## 📋 Payroll Endpoints

### Upload Payroll CSV

Upload and validate a payroll CSV file.

```bash
POST /api/payroll/upload
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: CSV file with columns: `name`, `wallet_address`, `usdc_amount`

**Example:**
```bash
curl -X POST http://localhost:3001/api/payroll/upload \
  -F "file=@payroll_sample.csv"
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Payroll CSV uploaded successfully",
  "data": {
    "employeeCount": 5,
    "totalAmount": 2600,
    "employees": [
      {
        "name": "Alice Johnson",
        "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "usdc_amount": 500
      }
    ]
  }
}
```

**Response (Validation Error):**
```json
{
  "error": "Validation failed",
  "errors": [
    {
      "row": 3,
      "name": "Bob",
      "error": "Invalid wallet address: 0xinvalid"
    }
  ]
}
```

---

### Get Current Payroll

Retrieve the currently uploaded payroll data.

```bash
GET /api/payroll/current
```

**Example:**
```bash
curl http://localhost:3001/api/payroll/current
```

**Response:**
```json
{
  "employees": [...],
  "totalAmount": 2600,
  "uploadedAt": "2024-02-23T10:30:00.000Z",
  "status": "pending"
}
```

---

### Run Payroll

Execute all transactions in the current payroll.

```bash
POST /api/payroll/run
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/payroll/run
```

**Response:**
```json
{
  "success": true,
  "message": "Payroll execution completed",
  "results": {
    "runId": "1708686000000",
    "timestamp": "2024-02-23T10:40:00.000Z",
    "totalEmployees": 5,
    "successful": [
      {
        "name": "Alice Johnson",
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        "amount": 500,
        "txHash": "0xabc123...",
        "status": "success"
      }
    ],
    "failed": [],
    "totalAmount": 2600,
    "successAmount": 2600
  }
}
```

---

## 🔐 Session Key Endpoints

### Create Session Key

Generate a new Session Key wallet with whitelist and spending limits.

```bash
POST /api/session/create
```

**Prerequisites:**
- Payroll CSV must be uploaded first

**Example:**
```bash
curl -X POST http://localhost:3001/api/session/create
```

**Response:**
```json
{
  "success": true,
  "message": "Session key created successfully",
  "sessionKey": {
    "address": "0x1234567890abcdef...",
    "expiresAt": "2024-03-24T10:30:00.000Z",
    "whitelist": ["0x742d35Cc...", "0x5B38Da6a..."],
    "spendingLimit": 2600
  },
  "instructions": {
    "step1": "Copy the private key and add it to your .env file as AGENT_PRIVATE_KEY",
    "step2": "Fund this address with USDC on Base Sepolia",
    "step3": "Restart the server to load the new session key",
    "privateKey": "0xprivatekey123..."
  }
}
```

**Important:** Save the `privateKey` to your `.env` file immediately!

---

### Get Session Key Status

Check the status of the current Session Key.

```bash
GET /api/session/status
```

**Example:**
```bash
curl http://localhost:3001/api/session/status
```

**Response:**
```json
{
  "exists": true,
  "address": "0x1234567890abcdef...",
  "status": "active",
  "isExpired": false,
  "createdAt": "2024-02-23T10:30:00.000Z",
  "expiresAt": "2024-03-24T10:30:00.000Z",
  "spendingLimit": 2600,
  "totalSpent": 500,
  "remaining": 2100,
  "whitelistCount": 5
}
```

**Possible Status Values:**
- `active` — Session Key is valid and can be used
- `revoked` — Session Key has been manually revoked
- `expired` — Session Key has passed its expiry date

---

### Get Agent Wallet Balance

Check the USDC balance of the agent wallet.

```bash
GET /api/session/balance
```

**Example:**
```bash
curl http://localhost:3001/api/session/balance
```

**Response:**
```json
{
  "address": "0x1234567890abcdef...",
  "balance": "2600.0",
  "token": "USDC",
  "network": "Base Sepolia"
}
```

---

### Revoke Session Key

Revoke the current Session Key (cannot be undone).

```bash
POST /api/session/revoke
```

**Example:**
```bash
curl -X POST http://localhost:3001/api/session/revoke
```

**Response:**
```json
{
  "success": true,
  "message": "Session key revoked successfully"
}
```

After revocation, you'll need to create a new Session Key to run payroll again.

---

## 📊 History Endpoints

### Get Payroll History

Retrieve all past payroll runs.

```bash
GET /api/history
```

**Example:**
```bash
curl http://localhost:3001/api/history
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "history": [
    {
      "runId": "1708686000000",
      "timestamp": "2024-02-23T10:40:00.000Z",
      "totalEmployees": 5,
      "successful": [...],
      "failed": [],
      "totalAmount": 2600,
      "successAmount": 2600
    }
  ]
}
```

---

### Get Specific Run

Retrieve details of a specific payroll run.

```bash
GET /api/history/:runId
```

**Example:**
```bash
curl http://localhost:3001/api/history/1708686000000
```

**Response:**
```json
{
  "runId": "1708686000000",
  "timestamp": "2024-02-23T10:40:00.000Z",
  "totalEmployees": 5,
  "successful": [
    {
      "name": "Alice Johnson",
      "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
      "amount": 500,
      "txHash": "0xabc123...",
      "status": "success"
    }
  ],
  "failed": [],
  "totalAmount": 2600,
  "successAmount": 2600
}
```

---

## 🏥 Health Check

### Server Health

Check if the server is running and get basic info.

```bash
GET /api/health
```

**Example:**
```bash
curl http://localhost:3001/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-02-23T10:30:00.000Z",
  "wallet": "0x1234567890abcdef..."
}
```

---

## 🔄 Complete Workflow

### First-Time Setup

```bash
# 1. Upload CSV
curl -X POST http://localhost:3001/api/payroll/upload \
  -F "file=@payroll_sample.csv"

# 2. Create Session Key
curl -X POST http://localhost:3001/api/session/create

# 3. Add AGENT_PRIVATE_KEY to .env and restart server

# 4. Fund Session Key with USDC (manual step)

# 5. Check balance
curl http://localhost:3001/api/session/balance

# 6. Run payroll
curl -X POST http://localhost:3001/api/payroll/run

# 7. View history
curl http://localhost:3001/api/history
```

---

### Subsequent Payroll Runs

```bash
# 1. Upload new CSV (optional if using same employees)
curl -X POST http://localhost:3001/api/payroll/upload \
  -F "file=@payroll_march.csv"

# 2. Check balance
curl http://localhost:3001/api/session/balance

# 3. Run payroll
curl -X POST http://localhost:3001/api/payroll/run
```

---

## ⚠️ Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200` — Success
- `400` — Bad request (validation error, missing data)
- `404` — Not found (no payroll data, no session key)
- `500` — Server error (blockchain error, file system error)

---

## 🧪 Testing with curl

### Quick Test Suite

```bash
# Health check
curl http://localhost:3001/api/health

# Upload CSV
curl -X POST http://localhost:3001/api/payroll/upload \
  -F "file=@payroll_sample.csv"

# Get current payroll
curl http://localhost:3001/api/payroll/current

# Session status
curl http://localhost:3001/api/session/status

# Balance
curl http://localhost:3001/api/session/balance

# History
curl http://localhost:3001/api/history
```

---

## 🔗 Useful Links

- **Base Sepolia Explorer:** https://sepolia.basescan.org
- **USDC Contract:** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- **Base Sepolia Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Circle USDC Faucet:** https://faucet.circle.com/

---

## 📝 Notes

- All amounts are in USDC (6 decimals on-chain, but API accepts/returns regular numbers)
- Wallet addresses are automatically checksummed
- Transaction confirmations wait for 1 block
- History is limited to last 100 runs
- Session Keys expire after 30 days
- Whitelist is immutable once Session Key is created
- Spending limit is enforced on-chain

---

**Need Help?** Check `SETUP.md` for detailed setup instructions.
