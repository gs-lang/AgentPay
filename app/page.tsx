export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-20">
      {/* Hero */}
      <div className="text-center mb-20">
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
            href="#quickstart"
            className="px-8 py-3 rounded-lg border border-gray-700 text-gray-300 font-semibold hover:border-gray-500 transition-colors"
          >
            View docs
          </a>
        </div>
      </div>

      {/* Comparison table */}
      <div className="mb-20">
        <h2 className="text-2xl font-bold text-center mb-8">Why AgentPay?</h2>
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

      {/* Quickstart */}
      <div id="quickstart" className="mb-20">
        <h2 className="text-2xl font-bold text-center mb-8">Get started in 3 lines</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-sm font-mono">
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
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-16 border border-gray-800 rounded-2xl bg-gray-900/50">
        <h2 className="text-3xl font-bold mb-4">Ready to add agent payments?</h2>
        <p className="text-gray-400 mb-8">Free tier: 100 transactions/month. No credit card required.</p>
        <a
          href="/pricing"
          className="px-8 py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
        >
          Start for free
        </a>
      </div>
    </main>
  );
}
