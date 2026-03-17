# RiskPilot — Financial Risk Intelligence SaaS Platform

A production-ready SaaS platform for real-time transaction risk scoring, AML alerts, fraud detection, and chargeback prediction.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (Node.js) |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (jose) + bcrypt |
| Payments | Stripe Subscriptions + Webhooks |
| Email | Nodemailer (SMTP) |
| Deployment | Vercel + Supabase/Neon |

---

## 📁 Project Structure

```
riskpilot/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed admin + demo users
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login, Signup, Forgot Password
│   │   ├── dashboard/         # User dashboard (protected)
│   │   │   ├── page.tsx       # Overview + charts
│   │   │   ├── transactions/  # Transaction list
│   │   │   ├── alerts/        # Risk alerts
│   │   │   ├── api-settings/  # API key management
│   │   │   └── billing/       # Stripe billing
│   │   ├── admin/             # Admin panel (admin-only)
│   │   │   ├── page.tsx       # Platform stats
│   │   │   ├── users/         # User management + suspend
│   │   │   └── transactions/  # All transactions view
│   │   └── api/
│   │       ├── analyze-transaction/  # ⭐ Main API endpoint
│   │       ├── auth/                 # signup, login, logout, verify-email, forgot-password
│   │       ├── stripe/               # checkout, webhook, portal
│   │       ├── transactions/         # Transaction list API
│   │       ├── user/                 # stats, api-keys
│   │       └── admin/                # users, stats
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── auth.ts            # JWT sign/verify, bcrypt
│   │   ├── risk-engine.ts     # ⭐ Risk scoring algorithm
│   │   ├── stripe.ts          # Stripe helpers + plan config
│   │   ├── email.ts           # Nodemailer email templates
│   │   └── rate-limit.ts      # In-memory rate limiter + API key utils
│   └── middleware.ts          # Route protection + auth checks
├── .env.example               # Environment variables template
├── vercel.json                # Vercel deployment config
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone & install

```bash
git clone <repo-url>
cd riskpilot
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Set up database (Supabase recommended)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy the connection string (use the **pooled** connection for Vercel)
3. Add to `.env`:
```
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
```

### 4. Run migrations & seed

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

This creates:
- Admin: `admin@riskpilot.io` / `Admin@123456`
- Demo: `demo@riskpilot.io` / `Demo@123456`

### 5. Set up Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Create two products with monthly prices:
   - **Starter**: $499/month
   - **Growth**: $1,999/month
3. Copy the Price IDs to `.env`
4. Add webhook endpoint `https://yourdomain.com/api/stripe/webhook`
5. Copy the webhook signing secret to `.env`

### 6. Start the dev server

```bash
npm run dev
# Visit http://localhost:3000
```

---

## 🔑 Environment Variables

```env
# Database (Supabase/Neon/local Postgres)
DATABASE_URL="postgresql://..."

# Auth
JWT_SECRET="min-32-char-random-string"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_STARTER_PRICE_ID="price_..."
STRIPE_GROWTH_PRICE_ID="price_..."

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="noreply@riskpilot.io"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
ADMIN_EMAIL="admin@riskpilot.io"
```

---

## 🚢 Deploy to Vercel + Supabase

### Step 1: Push to GitHub

```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/your/riskpilot.git
git push
```

### Step 2: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Connect your GitHub repo
3. Add all environment variables from `.env`
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain

### Step 3: Run database migrations

```bash
# After deploy, run once:
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

### Step 4: Configure Stripe webhook

In Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://your-vercel-domain.vercel.app/api/stripe/webhook`
- Events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`

---

## 🔌 API Reference

### Analyze Transaction

```http
POST /api/analyze-transaction
X-API-Key: rp_your_api_key
Content-Type: application/json

{
  "transaction_id": "txn_unique_001",
  "amount": 9750.00,
  "currency": "USD",
  "user_location": "US-NY",
  "ip_address": "185.220.101.45",
  "device_id": "device_abc123",
  "timestamp": "2025-03-17T14:22:00Z"
}
```

**Response:**
```json
{
  "transaction_id": "txn_unique_001",
  "risk_score": 82,
  "risk_level": "HIGH",
  "reason": "IP address belongs to known high-risk network range; Possible structuring",
  "reasons": [
    "IP address belongs to known high-risk network range",
    "Possible structuring: amount just below $10,000 reporting threshold"
  ],
  "chargeback_probability": 0.71,
  "flags": {
    "ipMismatch": true,
    "unusualAmount": true,
    "rapidActivity": false,
    "suspiciousGeo": false,
    "amlAlert": true
  },
  "flagged": true,
  "aml_alert": true,
  "analyzed_at": "2025-03-17T14:22:01.234Z"
}
```

---

## 🧠 Risk Scoring Engine

The engine (`src/lib/risk-engine.ts`) analyzes:

| Factor | Weight | Triggers |
|--------|--------|---------|
| **Amount analysis** | +10–35 | >$5K, >$10K, >$50K thresholds |
| **Structuring detection** | +25 | Amount $9,000–$9,999 (just below CTR) |
| **IP reputation** | +15–20 | Known Tor/proxy/VPN ranges |
| **Geo-IP mismatch** | +18 | IP location vs stated location |
| **Sanctioned regions** | +30 | OFAC-listed countries |
| **Velocity checks** | +12–25 | 5+ or 10+ transactions/hour |
| **Device-location spread** | +20 | Single device, 3+ locations |
| **Currency flags** | +20 | Privacy coins (XMR, ZEC, DASH) |
| **Round number** | +5 | Round amounts ≥$5,000 |

**Risk Levels:**
- 🟢 **LOW** (0–29): Normal transaction
- 🟡 **MEDIUM** (30–59): Requires monitoring  
- 🔴 **HIGH** (60–100): Flag for review

---

## 📊 Database Schema

```
users          → Authentication, roles, Stripe customer ID
workspaces     → User workspaces (created on subscription)
subscriptions  → Stripe subscription + usage tracking
transactions   → Incoming transaction data
risk_scores    → Analysis results linked to transactions
api_keys       → Hashed API keys with usage tracking
audit_logs     → Security audit trail
```

---

## 🔐 Security

- **JWT** authentication (7-day expiry, HttpOnly cookies)
- **bcrypt** password hashing (12 rounds)
- **API keys** stored as SHA-256 hashes
- **Rate limiting**: 100 req/min API, 10 req/15min auth
- **Stripe webhook signature** verification
- **Route middleware** for auth + role protection
- **SQL injection prevention** via Prisma parameterized queries

---

## 🏭 Production Checklist

- [ ] Set all environment variables in Vercel
- [ ] Run `prisma migrate deploy` after first deploy
- [ ] Configure Stripe webhook with production URL
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Change default admin password after seed
- [ ] Set up Redis for rate limiting (replace in-memory store)
- [ ] Configure email provider (SendGrid/Resend for production)
- [ ] Enable Vercel Edge Config for feature flags
- [ ] Set up monitoring (Sentry, Vercel Analytics)

---

## 📝 License

Proprietary — RiskPilot © 2025
