'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) {
      setError('Please confirm you understand the old key will be replaced (with a 15-min grace period).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agents/reissue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.api_key) setNewKey(data.api_key);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (done) {
    return (
      <main className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="text-4xl mb-4">🔑</div>
        <h1 className="text-2xl font-bold mb-2">Key reissued</h1>
        {newKey ? (
          <>
            <p className="text-gray-400 text-sm mb-6">
              Save your new key now — it won&apos;t be shown again.<br />
              Your old key remains valid for <strong className="text-white">15 minutes</strong> to allow safe rotation.
            </p>
            <div className="text-left border border-gray-800 rounded-lg p-4 bg-gray-900 mb-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-white bg-black/40 px-3 py-2 rounded break-all">
                  {newKey}
                </code>
                <button
                  onClick={copy}
                  className="shrink-0 px-3 py-2 text-xs rounded border border-gray-700 text-gray-300 hover:border-gray-500"
                >
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg text-sm text-yellow-300 text-left">
              ⚠ Update your deployments within 15 minutes before the old key expires.
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-sm">
            If that email is registered, a new API key has been issued.<br />
            Check your records — the key is shown only at issuance time.
          </p>
        )}
        <p className="mt-8 text-sm text-gray-500">
          Need a new account?{' '}
          <a href="/register" className="text-brand-500 hover:text-brand-400">Register here</a>
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Reissue API key</h1>
        <p className="text-gray-400 text-sm">
          Enter your email to get a new API key.<br />
          Your old key stays valid for <strong className="text-white">15 minutes</strong> — enough time to update running agents.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-sm text-gray-400">
            I understand my current API key will be replaced. Running agents using the old key will have a 15-minute grace period before it stops working.
          </span>
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Reissuing...' : 'Reissue key'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Don&apos;t have an account?{' '}
        <a href="/register" className="text-brand-500 hover:text-brand-400">Register here</a>
      </p>
    </main>
  );
}
