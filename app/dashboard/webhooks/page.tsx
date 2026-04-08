'use client';

import { useEffect, useState } from 'react';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  created_at: string;
}

const ALL_EVENTS = ['payment.completed', 'payment.received', 'wallet.funded', 'subscription.created', 'subscription.cancelled'];

export default function WebhooksPage() {
  const [apiKey, setApiKey] = useState('');
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>(['payment.completed']);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const key = localStorage.getItem('agentpay_api_key') || '';
    setApiKey(key);
    if (key) loadWebhooks(key);
  }, []);

  async function loadWebhooks(key: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/webhooks/manage', {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) throw new Error('Unauthorized — check your API key below');
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function deleteWebhook(id: string) {
    if (!confirm('Delete this webhook?')) return;
    await fetch(`/api/webhooks/manage/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    setWebhooks(prev => prev.filter(w => w.id !== id));
  }

  async function toggleWebhook(id: string, enabled: boolean) {
    await fetch(`/api/webhooks/manage/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    setWebhooks(prev => prev.map(w => w.id === id ? { ...w, enabled } : w));
  }

  async function addWebhook(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch('/api/webhooks/manage', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, events: newEvents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWebhooks(prev => [data, ...prev]);
      setNewUrl('');
      setNewEvents(['payment.completed']);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setAdding(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <a href="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm">← Dashboard</a>
        <span className="text-gray-700">/</span>
        <h1 className="text-2xl font-bold">Webhooks</h1>
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
            onClick={() => { localStorage.setItem('agentpay_api_key', apiKey); loadWebhooks(apiKey); }}
            className="px-4 py-2 text-sm rounded bg-brand-500 text-white hover:bg-brand-600"
          >
            Load
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Add webhook form */}
      <div className="mb-6 border border-gray-800 rounded-xl p-5 bg-gray-900/50">
        <h2 className="font-semibold mb-4 text-sm text-gray-300">Add webhook</h2>
        <form onSubmit={addWebhook} className="space-y-3">
          <input
            type="url"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            required
            placeholder="https://your-server.com/webhook"
            className="w-full px-3 py-2 text-sm rounded bg-black/40 border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
          />
          <div>
            <p className="text-xs text-gray-500 mb-2">Events</p>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map(ev => (
                <label key={ev} className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEvents.includes(ev)}
                    onChange={e => setNewEvents(prev =>
                      e.target.checked ? [...prev, ev] : prev.filter(x => x !== ev)
                    )}
                  />
                  {ev}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={adding || !apiKey}
            className="px-4 py-2 text-sm rounded bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add webhook'}
          </button>
        </form>
      </div>

      {/* Webhook list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-16 bg-gray-900 rounded-xl animate-pulse" />)}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-12 text-gray-600 text-sm">
          No webhooks registered yet.
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(wh => (
            <div key={wh.id} className="border border-gray-800 rounded-xl p-4 bg-gray-900/50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-mono text-sm text-white truncate">{wh.url}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {wh.events.map(ev => (
                      <span key={ev} className="px-2 py-0.5 text-xs rounded-full bg-gray-800 text-gray-400">{ev}</span>
                    ))}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{wh.id}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleWebhook(wh.id, !wh.enabled)}
                    className={`px-2 py-1 text-xs rounded border ${
                      wh.enabled
                        ? 'border-green-800 text-green-400 hover:bg-green-900/20'
                        : 'border-gray-700 text-gray-500 hover:bg-gray-800'
                    }`}
                  >
                    {wh.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => deleteWebhook(wh.id)}
                    className="px-2 py-1 text-xs rounded border border-red-900 text-red-400 hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
