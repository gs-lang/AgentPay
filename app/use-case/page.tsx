'use client';

import { useState } from 'react';

type QuestionNode = {
  kind: 'question';
  id: string;
  text: string;
  yes: string;
  no: string;
};

type OutcomeNode = {
  kind: 'outcome';
  id: string;
  headline: string;
  description: string;
  links: { label: string; url: string }[];
  isAgentPay?: boolean;
  isNoFit?: boolean;
};

type Node = QuestionNode | OutcomeNode;

const NODES: Record<string, Node> = {
  q1: {
    kind: 'question',
    id: 'q1',
    text: 'Is an AI agent involved in making the payment?',
    yes: 'q2',
    no: 'stripe',
  },
  q2: {
    kind: 'question',
    id: 'q2',
    text: 'Is a human initiating the payment (the agent just executes it)?',
    yes: 'stripe_toolkit',
    no: 'q3',
  },
  q3: {
    kind: 'question',
    id: 'q3',
    text: 'Do you need crypto or stablecoin settlement (USDC, x402)?',
    yes: 'x402',
    no: 'q4',
  },
  q4: {
    kind: 'question',
    id: 'q4',
    text: 'Are you building a paid MCP server where users pay per tool call?',
    yes: 'agentpay_me',
    no: 'q5',
  },
  q5: {
    kind: 'question',
    id: 'q5',
    text: 'Does your agent need to purchase at real merchants — e-commerce, SaaS subscriptions?',
    yes: 'agentpay_insure',
    no: 'q6',
  },
  q6: {
    kind: 'question',
    id: 'q6',
    text: 'Do you need enterprise-scale bank or card network infrastructure?',
    yes: 'mastercard',
    no: 'q7',
  },
  q7: {
    kind: 'question',
    id: 'q7',
    text: 'Do you need sub-cent micropayments at very high volume?',
    yes: 'nevermined',
    no: 'q8',
  },
  q8: {
    kind: 'question',
    id: 'q8',
    text: 'Do you need complex human-in-the-loop approval before every payment?',
    yes: 'clawpay',
    no: 'q9',
  },
  q9: {
    kind: 'question',
    id: 'q9',
    text: 'Is Agent A (yours) paying Agent B from a different organization?',
    yes: 'q10',
    no: 'internal_ledger',
  },
  q10: {
    kind: 'question',
    id: 'q10',
    text: 'Fiat only (USD), Stripe-backed, self-serve, no crypto?',
    yes: 'agentpay',
    no: 'no_fit',
  },
  // Outcomes
  stripe: {
    kind: 'outcome',
    id: 'stripe',
    headline: 'Use Stripe',
    description:
      'No AI agent is involved in the payment decision — Stripe is exactly the right tool. It handles human-initiated payments better than anything else on the market.',
    links: [{ label: 'stripe.com', url: 'https://stripe.com' }],
  },
  stripe_toolkit: {
    kind: 'outcome',
    id: 'stripe_toolkit',
    headline: 'Use Stripe Agent Toolkit',
    description:
      'A human is initiating the payment — the agent is just the executor. Stripe Agent Toolkit is purpose-built for this pattern. Mastercard Agent Pay is also worth evaluating for card-network-level controls.',
    links: [
      { label: 'Stripe Agent Toolkit', url: 'https://github.com/stripe/agent-toolkit' },
      { label: 'Mastercard Agent Pay', url: 'https://developer.mastercard.com/product/agent-pay/' },
    ],
  },
  x402: {
    kind: 'outcome',
    id: 'x402',
    headline: 'Use x402 or AsterPay',
    description:
      'You need on-chain settlement or stablecoin (USDC) payouts. x402 by Coinbase is the cleanest protocol for this. AsterPay is a solid alternative with similar capabilities.',
    links: [
      { label: 'x402 (Coinbase)', url: 'https://x402.org' },
      { label: 'AsterPay', url: 'https://asterpay.io' },
    ],
  },
  agentpay_me: {
    kind: 'outcome',
    id: 'agentpay_me',
    headline: 'Use agentpay.me or Nevermined',
    description:
      'You are monetizing an MCP server — charging callers per tool invocation. agentpay.me and Nevermined are both built for exactly this model with native MCP support.',
    links: [
      { label: 'agentpay.me', url: 'https://agentpay.me' },
      { label: 'Nevermined', url: 'https://nevermined.io' },
    ],
  },
  agentpay_insure: {
    kind: 'outcome',
    id: 'agentpay_insure',
    headline: 'Use agentpay.insure or useagentpay.com',
    description:
      'Your agent needs to transact at real merchants — buying SaaS subscriptions, e-commerce goods, or physical services. agentpay.insure and useagentpay.com are designed for real-merchant agent purchasing.',
    links: [
      { label: 'agentpay.insure', url: 'https://agentpay.insure' },
      { label: 'useagentpay.com', url: 'https://useagentpay.com' },
    ],
  },
  mastercard: {
    kind: 'outcome',
    id: 'mastercard',
    headline: 'Use Mastercard Agent Pay or Google AP2',
    description:
      'You need bank-grade infrastructure with card network integration at scale. Mastercard Agent Pay and Google AP2 are built for enterprise deployments where compliance and network reach matter.',
    links: [
      { label: 'Mastercard Agent Pay', url: 'https://developer.mastercard.com/product/agent-pay/' },
      { label: 'Google AP2', url: 'https://developers.google.com/pay' },
    ],
  },
  nevermined: {
    kind: 'outcome',
    id: 'nevermined',
    headline: 'Use Nevermined',
    description:
      'Sub-cent micropayments at high volume require a protocol optimized for that — not a Stripe-backed system. Nevermined is purpose-built for this scale and granularity.',
    links: [{ label: 'nevermined.io', url: 'https://nevermined.io' }],
  },
  clawpay: {
    kind: 'outcome',
    id: 'clawpay',
    headline: 'Use clawpay-mcp or useagentpay.com',
    description:
      'You need a human to approve every payment before it goes out — a compliance or trust requirement. clawpay-mcp and useagentpay.com have human-in-the-loop approval built into the flow.',
    links: [
      { label: 'clawpay-mcp', url: 'https://github.com/clawpay/clawpay-mcp' },
      { label: 'useagentpay.com', url: 'https://useagentpay.com' },
    ],
  },
  internal_ledger: {
    kind: 'outcome',
    id: 'internal_ledger',
    headline: 'An internal ledger may be sufficient',
    description:
      "Both agents are inside your own system — you may not need an external payment rail at all. A simple database ledger can track balances between your own agents without fees or third-party dependencies. AgentPay can still add value as an audit layer, but it isn't required.",
    links: [
      { label: 'AgentPay (optional)', url: 'https://agent-pay.pro/register' },
    ],
  },
  agentpay: {
    kind: 'outcome',
    id: 'agentpay',
    headline: 'AgentPay is the right fit.',
    description:
      "You need fiat USD payments between agents — no crypto, no complexity, self-serve. That's exactly what AgentPay is built for. Get started in under 5 minutes.",
    links: [{ label: 'Create your account →', url: '/register' }],
    isAgentPay: true,
  },
  no_fit: {
    kind: 'outcome',
    id: 'no_fit',
    headline: "AgentPay isn't the right fit.",
    description:
      "AgentPay is Stripe-backed, USD-only, and self-serve. If you need crypto, multi-currency, or custom settlement rails, one of the alternatives above will serve you better. We'd rather send you to the right tool.",
    links: [
      { label: 'x402 (Coinbase)', url: 'https://x402.org' },
      { label: 'Nevermined', url: 'https://nevermined.io' },
      { label: 'Mastercard Agent Pay', url: 'https://developer.mastercard.com/product/agent-pay/' },
    ],
    isNoFit: true,
  },
};

const QUESTION_IDS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'];

function getQuestionNumber(id: string): number {
  return QUESTION_IDS.indexOf(id) + 1;
}

export default function UseCasePage() {
  const [history, setHistory] = useState<{ nodeId: string; answer: 'yes' | 'no' }[]>([]);
  const [currentId, setCurrentId] = useState<string>('q1');

  const current = NODES[currentId];

  function answer(choice: 'yes' | 'no') {
    if (current.kind !== 'question') return;
    setHistory((h) => [...h, { nodeId: currentId, answer: choice }]);
    setCurrentId(choice === 'yes' ? current.yes : current.no);
  }

  function goBack() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCurrentId(prev.nodeId);
  }

  function restart() {
    setHistory([]);
    setCurrentId('q1');
  }

  const GOLD_DIVIDER = '1px solid rgba(245, 200, 66, 0.15)';

  return (
    <main>
      {/* Header */}
      <section style={{ borderBottom: GOLD_DIVIDER, background: '#000' }}>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Do you need AgentPay?
          </h1>
          <p className="text-xl text-gray-400">
            Answer honestly. We&apos;ll tell you the right tool — even if it isn&apos;t us.
          </p>
        </div>
      </section>

      {/* Decision tree */}
      <section style={{ background: '#0d0d0d', minHeight: '60vh' }}>
        <div className="max-w-2xl mx-auto px-6 py-16">
          {/* Breadcrumb */}
          {history.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2 text-xs text-gray-500">
              {history.map((h, i) => {
                const node = NODES[h.nodeId];
                const qNum = node.kind === 'question' ? getQuestionNumber(h.nodeId) : null;
                return (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-gray-700">→</span>}
                    <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                      {qNum ? `Q${qNum}` : h.nodeId}: {h.answer === 'yes' ? 'Yes' : 'No'}
                    </span>
                  </span>
                );
              })}
            </div>
          )}

          {current.kind === 'question' && (
            <div>
              <div className="text-brand-500 text-sm font-medium mb-3 tracking-wide uppercase">
                Question {getQuestionNumber(currentId)} of {QUESTION_IDS.length}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-10 leading-snug">
                {current.text}
              </h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => answer('yes')}
                  className="flex-1 px-8 py-4 rounded-xl border-2 border-brand-500 text-brand-500 font-semibold text-lg hover:bg-brand-500 hover:text-white transition-all"
                >
                  Yes
                </button>
                <button
                  onClick={() => answer('no')}
                  className="flex-1 px-8 py-4 rounded-xl border-2 border-gray-700 text-gray-300 font-semibold text-lg hover:border-gray-400 hover:text-white transition-all"
                >
                  No
                </button>
              </div>
              {history.length > 0 && (
                <div className="mt-8 flex gap-4 text-sm">
                  <button onClick={goBack} className="text-gray-500 hover:text-gray-300 transition-colors">
                    ← Back
                  </button>
                  <button onClick={restart} className="text-gray-500 hover:text-gray-300 transition-colors">
                    Start over
                  </button>
                </div>
              )}
            </div>
          )}

          {current.kind === 'outcome' && (
            <div>
              <div
                className={`rounded-2xl border p-8 ${
                  current.isAgentPay
                    ? 'border-brand-500 bg-brand-500/5'
                    : current.isNoFit
                    ? 'border-gray-700 bg-gray-900/30'
                    : 'border-gray-700 bg-gray-900/30'
                }`}
              >
                {current.isAgentPay && (
                  <div className="inline-block mb-4 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-500 text-sm font-medium">
                    This is for you
                  </div>
                )}
                {current.isNoFit && (
                  <div className="inline-block mb-4 px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-sm font-medium">
                    Better fit elsewhere
                  </div>
                )}
                {!current.isAgentPay && !current.isNoFit && (
                  <div className="inline-block mb-4 px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-400 text-sm font-medium">
                    Better fit
                  </div>
                )}
                <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-snug">
                  {current.headline}
                </h2>
                <p className="text-gray-400 leading-relaxed mb-6">{current.description}</p>
                <div className="flex flex-wrap gap-3">
                  {current.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target={link.url.startsWith('http') ? '_blank' : undefined}
                      rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                        current.isAgentPay
                          ? 'bg-brand-500 text-white hover:bg-brand-600'
                          : 'border border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
              <div className="mt-8 flex gap-4 text-sm">
                <button onClick={goBack} className="text-gray-500 hover:text-gray-300 transition-colors">
                  ← Back
                </button>
                <button onClick={restart} className="text-gray-500 hover:text-gray-300 transition-colors">
                  Start over
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Context footer */}
      <section style={{ background: '#000', borderTop: GOLD_DIVIDER }}>
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <p className="text-gray-500 text-sm leading-relaxed">
            This decision tree reflects our honest read of the agent payments landscape.
            We compete with some of these tools and recommend others for free —
            because the right tool for the job is always the right answer.
          </p>
        </div>
      </section>
    </main>
  );
}
