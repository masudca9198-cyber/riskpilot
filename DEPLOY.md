# RiskPilot — Deploy to Vercel in 15 Minutes

## Step 1 — Push to GitHub

```bash
cd riskpilot
git init
git add .
git commit -m "Initial commit: RiskPilot SaaS platform"
# Create a new repo on github.com then:
git remote add origin https://github.com/YOUR_USERNAME/riskpilot.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Set up Supabase (free database)

1. Go to **supabase.com** → Sign up → New project
2. Wait ~2 min for it to provision
3. Go to **Settings → Database → Connection string**
4. Select **"Transaction"** mode, copy the URL
5. It looks like: `postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres`

---

## Step 3 — Set up Stripe

1. Go to **dashboard.stripe.com** → Sign up (use Test Mode)
2. **Create Products:**
   - Products → Add Product → Name: "Starter" → Recurring → $499/month → Save → copy **Price ID**
   - Add Product → Name: "Growth" → Recurring → $1,999/month → Save → copy **Price ID**
3. **API Keys:** Developers → API Keys → copy Secret key and Publishable key
4. **Webhook** (set up AFTER Vercel deploy):
   - Developers → Webhooks → Add endpoint
   - URL: `https://YOUR-APP.vercel.app/api/stripe/webhook`
   - Events to select: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`
   - Copy the **Signing secret**

---

## Step 4 — Deploy on Vercel

1. Go to **vercel.com** → New Project → Import your GitHub repo
2. Framework: **Next.js** (auto-detected)
3. Click **Environment Variables** and add all of these:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase connection string |
| `JWT_SECRET` | Random 32+ char string ([generate one](https://generate-secret.vercel.app/32)) |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from Step 3) |
| `STRIPE_STARTER_PRICE_ID` | `price_...` |
| `STRIPE_GROWTH_PRICE_ID` | `price_...` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Your Gmail App Password |
| `EMAIL_FROM` | `noreply@yourdomain.com` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `ADMIN_EMAIL` | `admin@yourdomain.com` |

4. Click **Deploy** → wait ~2 min

---

## Step 5 — Initialize the database

After deploy succeeds, run this once in your local terminal:

```bash
# Make sure your .env has DATABASE_URL set to Supabase
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

This creates the tables and seeds:
- **Admin:** `admin@yourdomain.com` / `Admin@123456`  
- **Demo:** `demo@riskpilot.io` / `Demo@123456`

**Change these passwords immediately after first login!**

---

## Step 6 — Verify it works

1. Visit `https://your-app.vercel.app` — landing page loads ✅
2. Visit `/login` → login with demo credentials ✅
3. Visit `/api/health` → should return `{"status":"ok"}` ✅
4. Go to **Billing** → Subscribe to Starter plan (use Stripe test card `4242 4242 4242 4242`) ✅
5. Go to **API Settings** → Generate an API key ✅
6. Test the API:

```bash
curl -X POST https://your-app.vercel.app/api/analyze-transaction \
  -H "X-API-Key: rp_your_generated_key" \
  -H "Content-Type: application/json" \
  -d '{"transaction_id":"txn_test_001","amount":9750,"currency":"USD","ip_address":"185.220.101.45","user_location":"US-NY"}'
```

Expected response:
```json
{
  "risk_score": 82,
  "risk_level": "HIGH",
  "aml_alert": true,
  "flagged": true
}
```

---

## Troubleshooting

**Build fails with "prisma: command not found"**  
→ The `postinstall` script handles this. Check Vercel build logs — it should run `prisma generate` automatically.

**Database connection error**  
→ Make sure you're using the **Transaction pooler** URL from Supabase (port 5432), not the direct connection. Add `?pgbouncer=true` at the end.

**Stripe webhook 400 error**  
→ Double-check `STRIPE_WEBHOOK_SECRET` matches the signing secret from your Vercel-deployed webhook endpoint (not a local one).

**Email not sending**  
→ For Gmail, you must use an App Password (not your regular password). Enable 2FA first at myaccount.google.com, then generate at myaccount.google.com/apppasswords.
