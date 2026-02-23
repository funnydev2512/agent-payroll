#!/bin/bash

echo "🧪 Testing Paychef Backend"
echo "=========================="
echo ""

BASE_URL="http://localhost:3001"

echo "1. Health Check"
curl -s $BASE_URL/api/health | jq '.'
echo ""

echo "2. Upload Sample CSV"
curl -s -X POST $BASE_URL/api/payroll/upload \
  -F "file=@payroll_sample.csv" | jq '.'
echo ""

echo "3. Get Current Payroll"
curl -s $BASE_URL/api/payroll/current | jq '.'
echo ""

echo "4. Session Status"
curl -s $BASE_URL/api/session/status | jq '.'
echo ""

echo "5. Session Balance"
curl -s $BASE_URL/api/session/balance | jq '.'
echo ""

echo "6. Payroll History"
curl -s $BASE_URL/api/history | jq '.'
echo ""

echo "✅ Backend tests complete"
echo ""
echo "Next steps:"
echo "1. Create Session Key: curl -X POST $BASE_URL/api/session/create"
echo "2. Add AGENT_PRIVATE_KEY to .env"
echo "3. Restart server"
echo "4. Fund Session Key with USDC"
echo "5. Run payroll: curl -X POST $BASE_URL/api/payroll/run"
