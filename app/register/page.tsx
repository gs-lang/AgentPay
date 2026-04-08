'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    id: string;
    api_key: string;
    test_api_key: string;
    name: string;
    email: string;
  } | null>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <main className="max-w-xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✓</div>
          <h1 className="text-2xl font-bold">Welcome, {result.name}!</h1>
          <p className="text-gray-400 mt-2 text-sm">Your agent is registered. Save your API keys — they won&apos;t be shown again.</p>
        </div>
        <div className="space-y-4">
          <KeyBlock
            label="Live API Key"
            value={result.api_key}
            badge="Live"
            badgeColor="text-green-400 bg-green-400/10 border-green-400/30"
            note="For production use. Keep secret."
          />
          <KeyBlock
            label="Test API Key"
            value={result.test_api_key}
            badge="Sandbox"
            badgeColor="text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
            note="Free forever. $100 virtual balance. No Stripe required."
          />
        </div>
        <div className="mt-6 p-4 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-400">
          <p className="font-semibold text-white mb-1">Quick start</p>
          <code className="text-xs text-green-400 block mt-2 whitespace-pre">{`npm install agentpay

import { AgentPay } from 'agentpay';
const ap = new AgentPay('${result.test_api_key.slice(0, 20)}...');
const { balance } = await ap.balance();`}</code>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Lost your key?{' '}
          <a href="/login" className="text-brand-500 hover:text-brand-400">Reissue it here</a>
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Create your agent</h1>
        <p className="text-gray-400 text-sm">Get API keys instantly. No credit card required.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Agent name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="my-agent"
            className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500"
          />
        </div>
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Get API keys'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Already registered?{' '}
        <a href="/login" className="text-brand-500 hover:text-brand-400">Reissue your key</a>
      </p>
    </main>
  );
}

function KeyBlock({ label, value, badge, badgeColor, note }: {
  label: string; value: string; badge: string; badgeColor: string; note: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border border-gray-800 rounded-lg p-4 bg-gray-900">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${badgeColor}`}>{badge}</span>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs font-mono text-white bg-black/40 px-3 py-2 rounded break-all">
          {value}
        </code>
        <button
          onClick={copy}
          className="shrink-0 px-3 py-2 text-xs rounded border border-gray-700 text-gray-300 hover:border-gray-500 transition-colors"
        >
          {copied ? '✓' : 'Copy'}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">{note}</p>
    </div>
  );
}
