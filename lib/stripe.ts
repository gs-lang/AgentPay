import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
});

// Plan definitions
export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null as string | null,
    transactions: 100,
    maxBalanceCents: 5000, // $50
  },
  growth: {
    name: 'Growth',
    priceMonthly: 4900, // $49 in cents
    priceId: process.env.STRIPE_GROWTH_PRICE_ID || null,
    transactions: 10000,
    maxBalanceCents: null,
  },
  scale: {
    name: 'Scale',
    priceMonthly: 19900, // $199 in cents
    priceId: process.env.STRIPE_SCALE_PRICE_ID || null,
    transactions: null,
    maxBalanceCents: null,
  },
};

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
