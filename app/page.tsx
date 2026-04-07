const GOLD_DIVIDER = '1px solid rgba(245, 200, 66, 0.15)';

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-block mb-4 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-500 text-sm font-medium">
            Now in beta
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Payments for<br />
            <span className="text-brand-500">AI Agents</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            The simplest way to add USD payments between AI agents.
            No blockchain, no crypto, no wallets. Just an API key and a POST request.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/pricing"
              className="px-8 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
            >
              Get started free
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-3 rounded-lg border border-gray-700 text-gray-300 font-semibold hover:border-gray-500 transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ background: '#0d0d0d', borderTop: GOLD_DIVIDER }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Register your agent',
                desc: 'Call /api/agents/register with a name and email. Get an API key instantly — no credit card required.',
              },
              {
                step: '02',
                title: 'Fund your wallet',
                desc: 'Use Stripe Checkout to add USD to your agent wallet. Funds are available immediately.',
              },
              {
                step: '03',
                title: 'Send & receive payments',
                desc: 'One POST request to /api/payments/create. Payments settle in real-time between agent wallets.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative pl-8 border-l border-brand-500/30">
                <div className="text-brand-500/40 text-4xl font-bold mb-2">{step}</div>
                <div className="font-semibold text-lg mb-2">{title}</div>
                <div className="text-gray-400 text-sm leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ background: '#000', borderTop: GOLD_DIVIDER }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-4">Why AgentPay?</h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Built for the agentic web — where AI agents need to transact with each other, not just humans.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              { icon: '⚡', title: 'Under 5 min setup', desc: 'Register, fund, and send your first payment in minutes.' },
              { icon: '🔑', title: 'API key only', desc: 'No wallets, no crypto, no KYC. Just Bearer auth.' },
              { icon: '🤖', title: 'MCP support', desc: 'Native MCP tool support for LLM agents using Claude or similar.' },
              { icon: '💵', title: 'Real USD', desc: 'Stripe-backed USD balances. No token volatility.' },
              { icon: '📡', title: 'Webhooks', desc: 'Get notified on payment events for automated agent workflows.' },
              { icon: '📊', title: 'Transaction history', desc: 'Full audit trail via GET /api/transactions.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="border border-gray-800 rounded-xl p-6 bg-gray-900/30">
                <div className="text-2xl mb-3">{icon}</div>
                <div className="font-semibold mb-2">{title}</div>
                <div className="text-gray-400 text-sm">{desc}</div>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-800 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-900">
                  <th className="text-left p-4 text-gray-400"></th>
                  <th className="p-4 text-brand-500 font-semibold">AgentPay</th>
                  <th className="p-4 text-gray-400">Stripe x402</th>
                  <th className="p-4 text-gray-400">Payman AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[
                  ['Setup time', '< 5 min', '~30 min', '~15 min'],
                  ['Requires crypto', '✗ No', '✓ USDC', '✗ No'],
                  ['Min transaction', '$0.01', '~$0.01', '~$0.10'],
                  ['MCP support', '✓ Yes', '✗', '✗'],
                  ['Pricing', '1.5% per txn', '1.5% + gas', '~2.9%'],
                ].map(([feature, ...vals]) => (
                  <tr key={feature} className="bg-gray-900/50">
                    <td className="p-4 text-gray-300 font-medium">{feature}</td>
                    <td className="p-4 text-center text-white font-semibold">{vals[0]}</td>
                    <td className="p-4 text-center text-gray-400">{vals[1]}</td>
                    <td className="p-4 text-center text-gray-400">{vals[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Code */}
      <section id="code" style={{ background: '#111', borderTop: GOLD_DIVIDER }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-bold text-center mb-4">Get started in 3 lines</h2>
          <p className="text-gray-400 text-center mb-10">Drop-in SDK or raw HTTP — your choice.</p>
          <div className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-xl p-6 text-sm font-mono">
            <div className="mb-4 text-gray-500">
              <span className="text-gray-600"># Install</span>
            </div>
            <div className="mb-6 text-green-400">npm install agentpay</div>

            <div className="mb-2 text-gray-500">
              <span className="text-gray-600">// Send a payment between agents</span>
            </div>
            <div className="space-y-1">
              <div><span className="text-purple-400">import</span> {'{'} <span className="text-blue-400">AgentPay</span> {'}'} <span className="text-purple-400">from</span> <span className="text-green-400">&apos;agentpay&apos;</span>;</div>
              <div className="mt-3">
                <span className="text-purple-400">const</span> ap = <span className="text-purple-400">new</span> <span className="text-blue-400">AgentPay</span>(<span className="text-green-400">&apos;sk_live_...&apos;</span>);
              </div>
              <div className="mt-3">
                <span className="text-gray-500">// Pay another agent</span>
              </div>
              <div>
                <span className="text-purple-400">await</span> ap.<span className="text-yellow-400">pay</span>({'{'} to: <span className="text-green-400">&apos;agent_def456&apos;</span>, amount: <span className="text-orange-400">0.25</span>, purpose: <span className="text-green-400">&apos;parser fee&apos;</span> {'}'});
              </div>
              <div className="mt-3">
                <span className="text-gray-500">// Check balance</span>
              </div>
              <div>
                <span className="text-purple-400">const</span> {'{'} balance {'}'} = <span className="text-purple-400">await</span> ap.<span className="text-yellow-400">balance</span>();
              </div>
              <div className="mt-3">
                <span className="text-gray-500">// List transactions</span>
              </div>
              <div>
                <span className="text-purple-400">const</span> {'{'} transactions {'}'} = <span className="text-purple-400">await</span> ap.<span className="text-yellow-400">transactions</span>();
              </div>
            </div>
          </div>
          <div className="text-center mt-6">
            <a
              href="https://www.npmjs.com/package/agentpay"
              target="_blank"
              rel="noopener"
              className="text-brand-500 hover:text-brand-400 text-sm transition-colors"
            >
              View full API docs on npm →
            </a>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ background: '#0d0d0d', borderTop: GOLD_DIVIDER }}>
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Simple pricing</h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">
            Start free. Scale when you need to. No hidden fees, no markup on Stripe.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10">
            {[
              { name: 'Free', price: '$0/mo', detail: '100 txns/month', highlight: false },
              { name: 'Growth', price: '$49/mo', detail: '10,000 txns/month', highlight: true },
              { name: 'Scale', price: '$199/mo', detail: 'Unlimited + 1.5% fee', highlight: false },
            ].map(({ name, price, detail, highlight }) => (
              <div
                key={name}
                className={`rounded-xl border p-6 ${
                  highlight
                    ? 'border-brand-500 bg-brand-500/5'
                    : 'border-gray-800 bg-gray-900/30'
                }`}
              >
                <div className="font-semibold text-lg mb-1">{name}</div>
                <div className="text-2xl font-bold text-white mb-1">{price}</div>
                <div className="text-gray-400 text-sm">{detail}</div>
              </div>
            ))}
          </div>
          <a
            href="/pricing"
            className="inline-block px-8 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
          >
            See full pricing
          </a>
        </div>
      </section>

      {/* Accept section */}
      <section id="accept-section" style={{ background: '#000', borderTop: GOLD_DIVIDER }}>
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to add agent payments?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Free tier: 100 transactions/month. No credit card required to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/pricing"
              className="px-8 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
            >
              Start for free
            </a>
            <a
              href="https://www.npmjs.com/package/agentpay"
              target="_blank"
              rel="noopener"
              className="px-8 py-3 rounded-lg border border-gray-700 text-gray-300 font-semibold hover:border-gray-500 transition-colors"
            >
              View on npm
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
