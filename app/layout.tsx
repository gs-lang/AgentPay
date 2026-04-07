import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentPay — Payments for AI Agents',
  description: 'The simplest way to add payments between AI agents. No blockchain, no crypto. Just an API key.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 antialiased">
        <nav className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-white">
              Agent<span className="text-brand-500">Pay</span>
            </a>
            <div className="flex items-center gap-6 text-sm">
              <a href="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
              <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a>
              <a
                href="https://www.npmjs.com/package/agentpay"
                target="_blank"
                rel="noopener"
                className="text-gray-400 hover:text-white transition-colors"
              >
                npm
              </a>
            </div>
          </div>
        </nav>
        {children}
        <footer className="border-t border-gray-800 px-6 py-6 mt-0">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div>© 2026 AgentPay. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <a href="/pricing" className="hover:text-gray-300 transition-colors">Pricing</a>
              <a href="https://www.npmjs.com/package/agentpay" target="_blank" rel="noopener" className="hover:text-gray-300 transition-colors">npm</a>
              <a href="https://github.com/gs-lang/AgentPay" target="_blank" rel="noopener" className="hover:text-gray-300 transition-colors">GitHub</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
