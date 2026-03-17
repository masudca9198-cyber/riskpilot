#!/usr/bin/env bash
# scripts/stripe-listen.sh
# Listens to Stripe webhooks and forwards them to your local dev server.
# Requires Stripe CLI: https://stripe.com/docs/stripe-cli

echo "🎣 Starting Stripe webhook listener..."
echo "Make sure your dev server is running on http://localhost:3000"
echo ""

stripe listen \
  --forward-to http://localhost:3000/api/stripe/webhook \
  --events checkout.session.completed,invoice.payment_succeeded,invoice.payment_failed,customer.subscription.deleted,customer.subscription.updated
