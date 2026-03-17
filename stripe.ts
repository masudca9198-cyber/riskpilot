// src/lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
})

export const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 499,
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    transactions: 10_000,
    features: [
      '10,000 transactions/month',
      'Real-time risk scoring',
      'AML alerts',
      'API access',
      'Email support',
    ],
  },
  GROWTH: {
    name: 'Growth',
    price: 1999,
    priceId: process.env.STRIPE_GROWTH_PRICE_ID!,
    transactions: 100_000,
    features: [
      '100,000 transactions/month',
      'Advanced risk models',
      'Priority AML alerts',
      'Webhook integrations',
      'Dedicated support',
      'Custom risk rules',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: null,
    priceId: null,
    transactions: -1, // unlimited
    features: [
      'Unlimited transactions',
      'Custom AI models',
      'SLA guarantee',
      'On-premise option',
      'Dedicated account manager',
      'Custom integrations',
    ],
  },
} as const

export async function createStripeCustomer(email: string, name: string): Promise<string> {
  const customer = await stripe.customers.create({ email, name })
  return customer.id
}

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  })
  return session.url!
}

export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
}
