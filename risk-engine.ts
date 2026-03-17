// src/lib/risk-engine.ts

export interface TransactionInput {
  transaction_id: string
  amount: number
  currency: string
  user_location?: string
  ip_address?: string
  device_id?: string
  timestamp?: string
}

export interface RiskAnalysis {
  score: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  reasons: string[]
  flags: {
    ipMismatch: boolean
    unusualAmount: boolean
    rapidActivity: boolean
    suspiciousGeo: boolean
    amlAlert: boolean
  }
  chargebackProb: number
}

// High-risk countries/regions for geo checks
const HIGH_RISK_COUNTRIES = ['KP', 'IR', 'SY', 'CU', 'SD', 'MM', 'RU', 'BY']
const SUSPICIOUS_IP_RANGES = ['185.220.', '195.206.', '176.10.', '5.188.']

// VPN/Proxy/Tor indicators
const VPN_INDICATORS = ['vpn', 'proxy', 'tor', 'anonymous']

export function analyzeTransaction(
  input: TransactionInput,
  recentTransactions?: TransactionInput[]
): RiskAnalysis {
  let score = 0
  const reasons: string[] = []
  const flags = {
    ipMismatch: false,
    unusualAmount: false,
    rapidActivity: false,
    suspiciousGeo: false,
    amlAlert: false,
  }

  // ── 1. Amount Analysis ────────────────────────────────────────────────
  const amount = input.amount

  if (amount > 50000) {
    score += 35
    reasons.push('Transaction exceeds $50,000 threshold — high-value alert')
    flags.unusualAmount = true
    flags.amlAlert = true
  } else if (amount > 10000) {
    score += 20
    reasons.push('Transaction exceeds $10,000 reporting threshold')
    flags.unusualAmount = true
  } else if (amount > 5000) {
    score += 10
    reasons.push('Above-average transaction amount detected')
    flags.unusualAmount = true
  }

  // Just-below-threshold structuring detection (common money laundering)
  if (amount >= 9000 && amount < 10000) {
    score += 25
    reasons.push('Possible structuring: amount just below $10,000 reporting threshold')
    flags.amlAlert = true
  }
  if (amount >= 4500 && amount < 5000) {
    score += 10
    reasons.push('Amount near secondary monitoring threshold ($5,000)')
  }

  // Round number suspicion
  if (amount % 1000 === 0 && amount >= 5000) {
    score += 5
    reasons.push('Suspiciously round transaction amount')
  }

  // ── 2. IP Address Analysis ────────────────────────────────────────────
  const ip = input.ip_address || ''

  if (ip) {
    const isSuspiciousRange = SUSPICIOUS_IP_RANGES.some(r => ip.startsWith(r))
    if (isSuspiciousRange) {
      score += 20
      reasons.push('IP address belongs to known high-risk network range')
      flags.ipMismatch = true
    }

    const isVPN = VPN_INDICATORS.some(v => ip.toLowerCase().includes(v))
    if (isVPN) {
      score += 15
      reasons.push('VPN or proxy service detected')
      flags.ipMismatch = true
    }

    // IP vs location mismatch simulation
    const location = input.user_location || ''
    if (location && ip) {
      // Simple heuristic: check if IP region matches stated location
      const locationUpper = location.toUpperCase()
      const ipFirstOctet = parseInt(ip.split('.')[0])

      // Simulated geo-mismatch logic
      if (
        (locationUpper.includes('US') && (ipFirstOctet >= 185 && ipFirstOctet <= 195)) ||
        (locationUpper.includes('EU') && ipFirstOctet >= 100 && ipFirstOctet <= 110)
      ) {
        score += 18
        reasons.push(`IP geolocation mismatch with stated location (${location})`)
        flags.ipMismatch = true
      }
    }
  }

  // ── 3. Geographic Analysis ────────────────────────────────────────────
  const location = input.user_location || ''
  if (location) {
    const isHighRisk = HIGH_RISK_COUNTRIES.some(c =>
      location.toUpperCase().includes(c)
    )
    if (isHighRisk) {
      score += 30
      reasons.push(`Transaction originates from OFAC-sanctioned or high-risk region: ${location}`)
      flags.suspiciousGeo = true
      flags.amlAlert = true
    }

    // Check for mixed signals in location string
    if (location.includes(',') && location.split(',').length > 2) {
      score += 5
      reasons.push('Ambiguous or inconsistent location data')
    }
  }

  // ── 4. Rapid Transaction Detection ───────────────────────────────────
  if (recentTransactions && recentTransactions.length > 0) {
    const now = new Date(input.timestamp || Date.now())
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const recentHour = recentTransactions.filter(t => {
      const tTime = new Date(t.timestamp || 0)
      return tTime >= oneHourAgo
    })

    if (recentHour.length >= 10) {
      score += 25
      reasons.push(`Rapid activity: ${recentHour.length} transactions in the last hour`)
      flags.rapidActivity = true
    } else if (recentHour.length >= 5) {
      score += 12
      reasons.push(`Elevated frequency: ${recentHour.length} transactions in the last hour`)
      flags.rapidActivity = true
    }

    // Same device, different locations
    const sameDevice = recentTransactions.filter(t => t.device_id === input.device_id)
    const uniqueLocations = new Set(sameDevice.map(t => t.user_location)).size
    if (uniqueLocations > 3) {
      score += 20
      reasons.push(`Single device used across ${uniqueLocations} different locations`)
      flags.suspiciousGeo = true
    }
  }

  // ── 5. Currency Analysis ──────────────────────────────────────────────
  const HIGH_RISK_CURRENCIES = ['XMR', 'ZEC', 'DASH']
  if (HIGH_RISK_CURRENCIES.includes(input.currency.toUpperCase())) {
    score += 20
    reasons.push(`High-anonymity currency detected: ${input.currency}`)
    flags.amlAlert = true
  }

  // ── 6. Score Normalization & Risk Level ───────────────────────────────
  score = Math.min(100, Math.max(0, score))

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  if (score >= 60) {
    riskLevel = 'HIGH'
  } else if (score >= 30) {
    riskLevel = 'MEDIUM'
  } else {
    riskLevel = 'LOW'
  }

  // ── 7. Chargeback Probability ─────────────────────────────────────────
  let chargebackProb = score / 200 // Base: 0-0.5
  if (flags.ipMismatch) chargebackProb += 0.15
  if (flags.unusualAmount) chargebackProb += 0.10
  chargebackProb = Math.min(0.95, chargebackProb)

  // Default reason if everything looks clean
  if (reasons.length === 0) {
    reasons.push('Transaction patterns within normal parameters')
  }

  return {
    score,
    riskLevel,
    reasons,
    flags,
    chargebackProb: Math.round(chargebackProb * 100) / 100,
  }
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'HIGH': return '#ef4444'
    case 'MEDIUM': return '#f59e0b'
    case 'LOW': return '#10b981'
    default: return '#6b7280'
  }
}

export function getRiskBadgeClass(level: string): string {
  switch (level) {
    case 'HIGH': return 'bg-red-500/10 text-red-400 border border-red-500/20'
    case 'MEDIUM': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    case 'LOW': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    default: return 'bg-gray-500/10 text-gray-400'
  }
}
