#!/usr/bin/env node
// scripts/test-api.mjs
// Quick smoke test for the analyze-transaction endpoint.
// Usage: API_KEY=rp_yourkey node scripts/test-api.mjs

const BASE_URL = process.env.APP_URL || 'http://localhost:3000'
const API_KEY  = process.env.API_KEY  || 'YOUR_API_KEY_HERE'

const testCases = [
  {
    label: '✅ Normal transaction (expect LOW risk)',
    body: {
      transaction_id: `txn_low_${Date.now()}`,
      amount: 45.99,
      currency: 'USD',
      user_location: 'US-CA',
      ip_address: '66.249.66.1',
      device_id: 'device_normal_01',
    },
  },
  {
    label: '⚠️  Medium risk - large amount',
    body: {
      transaction_id: `txn_med_${Date.now()}`,
      amount: 7500,
      currency: 'USD',
      user_location: 'US-NY',
      ip_address: '8.8.8.8',
      device_id: 'device_med_01',
    },
  },
  {
    label: '🚨 High risk - structuring + suspicious IP',
    body: {
      transaction_id: `txn_high_${Date.now()}`,
      amount: 9750,
      currency: 'USD',
      user_location: 'US-NY',
      ip_address: '185.220.101.45',
      device_id: 'device_high_01',
    },
  },
  {
    label: '🚨 High risk - sanctioned region + large amount',
    body: {
      transaction_id: `txn_aml_${Date.now()}`,
      amount: 55000,
      currency: 'USD',
      user_location: 'IR-Tehran',
      ip_address: '82.99.17.1',
      device_id: 'device_aml_01',
    },
  },
]

async function runTests() {
  console.log(`\n🔬 RiskPilot API Test Suite`)
  console.log(`📡 Endpoint: ${BASE_URL}/api/analyze-transaction`)
  console.log(`🔑 API Key:  ${API_KEY.substring(0, 12)}...\n`)
  console.log('─'.repeat(60))

  for (const tc of testCases) {
    console.log(`\n${tc.label}`)
    try {
      const res = await fetch(`${BASE_URL}/api/analyze-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY,
        },
        body: JSON.stringify(tc.body),
      })

      const data = await res.json()

      if (!res.ok) {
        console.log(`  ❌ HTTP ${res.status}: ${data.error}`)
        continue
      }

      const scoreColor =
        data.risk_score >= 60 ? '\x1b[31m' :  // red
        data.risk_score >= 30 ? '\x1b[33m' :  // yellow
        '\x1b[32m'                             // green
      const reset = '\x1b[0m'

      console.log(`  Score:     ${scoreColor}${data.risk_score}${reset} (${data.risk_level})`)
      console.log(`  AML Alert: ${data.aml_alert ? '🚨 YES' : '✅ No'}`)
      console.log(`  Flagged:   ${data.flagged ? '🚩 YES' : '✅ No'}`)
      console.log(`  Chargeback Risk: ${(data.chargeback_probability * 100).toFixed(0)}%`)
      console.log(`  Reason:    ${data.reason?.substring(0, 80)}`)
    } catch (err) {
      console.log(`  ❌ Network error: ${err.message}`)
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log('✨ Test suite complete\n')
}

runTests()
