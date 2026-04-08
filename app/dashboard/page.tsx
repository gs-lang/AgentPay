'use client';

import { useEffect, useState } from 'react';

interface DashboardData {
  agents: number;
  transactions: {
    count: number;
    volume_usd: number;
  };
  stripe: {
    payment_count_30d: number;
    volume_usd_30d: number;
    mrr_usd: number;
  };
  updated_at: string;
}

function StatCard({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      {loading ? (
        <div className="h-8 w-32 bg-gray-800 rounded animate-pulse" />
      ) : (
        <div className="text-3xl font-bold text-white">{value}</div>
      )}
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function fmt(n: number, prefix = '') {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function fmtUsd(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Real-time data from Stripe + AgentPay
            {data?.updated_at && (
              <span className="ml-2 text-gray-600">
                · Updated {new Date(data.updated_at).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm rounded-lg border border-gray-700 text-gray-300 hover:border-gray-500 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
          Error loading dashboard: {error}
        </div>
      )}

      {/* Primary metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Agents"
          value={loading ? '–' : fmt(data?.agents ?? 0)}
          sub="Registered agent wallets"
          loading={loading}
        />
        <StatCard
          label="Total Payments"
          value={loading ? '–' : fmt(data?.transactions.count ?? 0)}
          sub="All-time completed transactions"
          loading={loading}
        />
        <StatCard
          label="Total Volume"
          value={loading ? '–' : fmtUsd(data?.transactions.volume_usd ?? 0)}
          sub="All-time payment volume"
          loading={loading}
        />
        <StatCard
          label="MRR"
          value={loading ? '–' : fmtUsd(data?.stripe.mrr_usd ?? 0)}
          sub="Monthly recurring revenue"
          loading={loading}
        />
      </div>

      {/* Stripe metrics */}
      <h2 className="text-lg font-semibold mb-4 text-gray-300">Stripe (last 30 days)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <StatCard
          label="Stripe Payments"
          value={loading ? '–' : fmt(data?.stripe.payment_count_30d ?? 0)}
          sub="Succeeded payment intents"
          loading={loading}
        />
        <StatCard
          label="Stripe Volume"
          value={loading ? '–' : fmtUsd(data?.stripe.volume_usd_30d ?? 0)}
          sub="Revenue from Stripe payment intents"
          loading={loading}
        />
      </div>

      {/* Quick links */}
      <div className="border border-gray-800 rounded-xl p-6 bg-gray-900/50">
        <h3 className="font-semibold mb-4">Quick actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <a
            href="/dashboard/agents"
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-800 hover:border-brand-500/50 hover:bg-brand-500/5 transition-colors"
          >
            <span className="text-brand-500">🤖</span>
            My agent
          </a>
          <a
            href="/dashboard/webhooks"
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-800 hover:border-brand-500/50 hover:bg-brand-500/5 transition-colors"
          >
            <span className="text-brand-500">⚡</span>
            Webhooks
          </a>
          <a
            href="/pricing"
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors text-gray-300"
          >
            <span>↑</span>
            Upgrade plan
          </a>
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors text-gray-300"
          >
            <span>↗</span>
            Stripe Dashboard
          </a>
          <a
            href="https://www.npmjs.com/package/agentpay"
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors text-gray-300"
          >
            <span>📦</span>
            npm SDK
          </a>
          <a
            href="/login"
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-800 hover:border-gray-600 transition-colors text-gray-300"
          >
            <span>🔑</span>
            Reissue key
          </a>
        </div>
      </div>
    </main>
  );
}
