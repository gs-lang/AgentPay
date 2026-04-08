'use client';

import { useEffect, useState } from 'react';

interface AgentInfo {
  id: string;
  name: string;
  email: string;
  api_key_prefix: string;
  test_api_key_prefix: string | null;
  balance: number;
  plan: string;
  transaction_count: number;
  stripe_connected: boolean;
  test_mode: boolean;
  created_at: string;
}

export default function AgentsPage() {
  const [apiKey, setApiKey] = useState('');
  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const key = localStorage.getItem('agentpay_api_key') || '';
    setApiKey(key);
    if (key) loadAgent(key);
  }, []);

  async function loadAgent(key: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/agents/me', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) throw new Error('Unauthorized — check your API key below');
      const data = await res.json();
      setAgent(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  const planBadge = (plan: string) => {
    const map: Record<string, string> = {
      free: 'text-gray-400 bg-gray-800 border-gray-700',
      growth: 'text-yellow-400 bg-yellow-900/20 border-yellow-800/50',
      scale: 'text-purple-400 bg-purple-900/20 border-purple-800/50',
    };
    return map[plan] || map.free;
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <a href="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm">← Dashboard</a>
        <span className="text-gray-700">/</span>
        <h1 className="text-2xl font-bold">Agent</h1>
      </div>

      {/* API key input */}
      <div className="mb-6 p-4 bg-gray-900 border border-gray-800 rounded-lg">
        <label className="block text-sm text-gray-400 mb-2">API key</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk_live_... or test_sk_..."
            className="flex-1 px-3 py-2 text-sm rounded bg-black/40 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
          />
          <button
            onClick={() => { localStorage.setItem('agentpay_api_key', apiKey); loadAgent(apiKey); }}
            className="px-4 py-2 text-sm rounded bg-brand-500 text-white hover:bg-brand-600"
          >
            Load
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-900 rounded-xl animate-pulse" />)}
        </div>
      ) : agent ? (
        <div className="space-y-4">
          {/* Agent card */}
          <div className="border border-gray-800 rounded-xl p-6 bg-gray-900/50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-semibold text-lg">{agent.name}</div>
                <div className="text-gray-400 text-sm">{agent.email}</div>
              </div>
              <span className={`px-2 py-1 text-xs rounded border capitalize ${planBadge(agent.plan)}`}>
                {agent.plan}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <Stat label="Balance" value={`$${agent.balance.toFixed(2)}`} />
              <Stat label="Live transactions" value={agent.transaction_count.toString()} />
              <Stat label="Stripe" value={agent.stripe_connected ? 'Connected' : 'Not connected'} />
              <Stat label="Joined" value={new Date(agent.created_at).toLocaleDateString()} />
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-800">
              <KeyRow label="Agent ID" value={agent.id} />
              <KeyRow label="Live key prefix" value={`${agent.api_key_prefix}...`} />
              {agent.test_api_key_prefix && (
                <KeyRow label="Test key prefix" value={`${agent.test_api_key_prefix}...`} badge="Sandbox" />
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <a href="/dashboard/webhooks"
              className="flex items-center gap-2 p-3 rounded-lg border border-gray-800 hover:border-brand-500/50 hover:bg-brand-500/5 transition-colors">
              <span className="text-brand-500">⚡</span> Manage webhooks
            </a>
            <a href="/pricing"
              className="flex items-center gap-2 p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors text-gray-300">
              <span>↑</span> Upgrade plan
            </a>
            <a href="/login"
              className="flex items-center gap-2 p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors text-gray-300">
              <span>🔑</span> Reissue key
            </a>
          </div>

          {agent.test_mode && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg text-sm text-yellow-300">
              TEST MODE — showing sandbox data. Switch to your live key for production.
            </div>
          )}
        </div>
      ) : !loading && (
        <div className="text-center py-12 text-gray-600 text-sm">
          Enter your API key above to view agent details.
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function KeyRow({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-900/20 border border-yellow-800/50 text-yellow-400">{badge}</span>
        )}
        <code className="text-gray-300 font-mono text-xs">{value}</code>
      </div>
    </div>
  );
}
