'use client';

import { useState } from 'react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'For hobbyists and testing',
    features: [
      '100 transactions/month',
      '$50 max wallet balance',
      'Basic API access',
      'Community support',
    ],
    cta: 'Get started free',
    ctaHref: '/register',
    highlight: false,
    plan: null,
  },
  {
    name: 'Growth',
    price: '$49',
    period: '/mo',
    description: 'For production agents',
    features: [
      '10,000 transactions/month',
      'Unlimited wallet balance',
      'Full API + webhooks',
      'Priority support',
      'Transaction history export',
    ],
    cta: 'Start Growth',
    ctaHref: null,
    highlight: true,
    plan: 'growth',
  },
  {
    name: 'Scale',
    price: '$199',
    period: '/mo',
    description: 'For high-volume teams',
    features: [
      'Unlimited transactions',
      '1.5% fee per transaction',
      'SLA guarantee (99.9%)',
      'Dedicated support',
      'Custom integrations',
      'Team access',
    ],
    cta: 'Start Scale',
    ctaHref: null,
    highlight: false,
    plan: 'scale',
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(plan: string) {
    setLoading(plan);
    setError(null);

    try {
      // Get API key from localStorage (set after registration)
      const apiKey = localStorage.getItem('agentpay_api_key');
      if (!apiKey) {
        // Redirect to register first
        window.location.href = `/#quickstart`;
        return;
      }

      const res = await fetch('/api/payments/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
        <p className="text-gray-400 text-lg">
          No markup on Stripe fees. Pay only for what you use.
        </p>
      </div>

      {error && (
        <div className="mb-8 max-w-md mx-auto p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-8 flex flex-col ${
              plan.highlight
                ? 'border-brand-500 bg-brand-500/5 shadow-lg shadow-brand-500/10'
                : 'border-gray-800 bg-gray-900/50'
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-500 text-white text-xs font-semibold rounded-full">
                Most popular
              </div>
            )}

            <div className="mb-6">
              <div className="text-sm text-gray-400 mb-1">{plan.name}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">{plan.price}</span>
                <span className="text-gray-400">{plan.period}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">{plan.description}</div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-brand-500 mt-0.5 shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {plan.ctaHref ? (
              <a
                href={plan.ctaHref}
                className={`w-full py-3 rounded-lg text-center text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-brand-500 text-white hover:bg-brand-600'
                    : 'border border-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                {plan.cta}
              </a>
            ) : (
              <button
                onClick={() => plan.plan && handleSubscribe(plan.plan)}
                disabled={loading === plan.plan}
                className={`w-full py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  plan.highlight
                    ? 'bg-brand-500 text-white hover:bg-brand-600'
                    : 'border border-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                {loading === plan.plan ? 'Redirecting...' : plan.cta}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">FAQ</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Do I need a blockchain or crypto wallet?',
              a: 'No. AgentPay uses Stripe under the hood — just USD, just API keys.',
            },
            {
              q: 'How does agent-to-agent payment work?',
              a: 'Each agent has a virtual wallet funded via Stripe Checkout. Payments debit the sender and credit the recipient instantly.',
            },
            {
              q: 'Is test mode supported?',
              a: 'Yes. Every agent gets a free test_sk_ key at registration. It gives you $100 virtual balance and 1,000 test transactions/day — no Stripe setup required.',
            },
            {
              q: "What's the minimum transaction?",
              a: '$0.01 USD. We pass through Stripe\'s minimum.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="border border-gray-800 rounded-xl p-5">
              <div className="font-semibold mb-2">{q}</div>
              <div className="text-gray-400 text-sm">{a}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
