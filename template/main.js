/**
 * AgentPay Demo — AI Agent with Payments
 *
 * This demo shows two AI agents transacting with each other:
 *   Agent A (orchestrator) → delegates work → Agent B (worker)
 *   Agent B completes the task → Agent A pays Agent B via AgentPay
 *
 * Fork this template and add your API keys to .env to get started.
 * Get API keys at: https://agent-pay.pro/register
 */

import 'dotenv/config';
import { register } from 'agent-pay';
import * as agentB from './agent_b.js';
import { delegateAndPay } from './agent_a.js';

const BASE_URL = 'https://agent-pay.pro';

const TEXT_TO_SUMMARIZE = `
Artificial intelligence agents are increasingly being used to automate complex workflows
that previously required human judgment. These agents can browse the web, write code,
send emails, and now — with systems like AgentPay — transact money between themselves.
This creates a new class of autonomous economic actors that operate entirely without
human intervention in the payment loop. The implications for software architecture,
compliance, and product design are significant and still being understood by the industry.
`.trim();

async function getOrRegister(nameEnv, idEnv, keyEnv, label) {
  const existingKey = process.env[keyEnv];
  const existingId = process.env[idEnv];

  if (existingKey && existingId) {
    console.log(`  ✓ ${label}: using existing registration (id: ${existingId.slice(0, 12)}...)`);
    return { id: existingId, api_key: existingKey };
  }

  console.log(`  → Registering ${label} with AgentPay...`);
  const suffix = Math.random().toString(36).slice(2, 8);
  const agent = await register(
    { name: `${label}-${suffix}`, email: `${label.toLowerCase()}-${suffix}@demo.agentpay` },
    { baseUrl: BASE_URL }
  );
  console.log(`  ✓ ${label} registered: id=${agent.id.slice(0, 12)}...`);
  console.log(`    Save to .env to reuse: ${keyEnv}=${agent.api_key}  ${idEnv}=${agent.id}`);
  return agent;
}

async function getBalance(agentId, apiKey) {
  const res = await fetch(`${BASE_URL}/api/agents/${agentId}/balance`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.balance ?? 0;
}

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  AgentPay Demo — AI Agent with Payments');
  console.log('═══════════════════════════════════════════\n');

  // Step 1: Register (or load) both agents
  console.log('Step 1: Setting up agents');
  const agentAInfo = await getOrRegister('AGENT_A_NAME', 'AGENT_A_ID', 'AGENT_A_API_KEY', 'Agent-A');
  const agentBInfo = await getOrRegister('AGENT_B_NAME', 'AGENT_B_ID', 'AGENT_B_API_KEY', 'Agent-B');
  console.log();

  // Step 2: Check balances before
  console.log('Step 2: Checking balances before transaction');
  const balanceABefore = await getBalance(agentAInfo.id, agentAInfo.api_key);
  const balanceBBefore = await getBalance(agentBInfo.id, agentBInfo.api_key);
  console.log(`  Agent A balance: $${balanceABefore?.toFixed(2) ?? 'N/A'}`);
  console.log(`  Agent B balance: $${balanceBBefore?.toFixed(2) ?? 'N/A'}`);
  console.log();

  // Step 3: Agent A delegates and pays Agent B
  console.log('Step 3: Agent A delegates work to Agent B and pays on completion');
  try {
    const { summary, paymentId } = await delegateAndPay({
      apiKey: agentAInfo.api_key,
      agentBId: agentBInfo.id,
      text: TEXT_TO_SUMMARIZE,
      agentB,
    });
    console.log();

    // Step 4: Check balances after
    console.log('Step 4: Checking balances after transaction');
    const balanceAAfter = await getBalance(agentAInfo.id, agentAInfo.api_key);
    const balanceBAfter = await getBalance(agentBInfo.id, agentBInfo.api_key);
    console.log(`  Agent A balance: $${balanceAAfter?.toFixed(2) ?? 'N/A'}`);
    console.log(`  Agent B balance: $${balanceBAfter?.toFixed(2) ?? 'N/A'}`);
    console.log();

    console.log('═══════════════════════════════════════════');
    console.log('  Done!');
    console.log(`  Summary: "${summary}"`);
    console.log(`  Payment ID: ${paymentId}`);
    console.log('');
    console.log('  Next steps:');
    console.log('  1. Visit https://agent-pay.pro/dashboard to see your transaction');
    console.log('  2. Fund Agent A\'s wallet to run real payments');
    console.log('  3. Fork this template and add your own agents');
    console.log('═══════════════════════════════════════════\n');
  } catch (err) {
    console.error();
    if (err.status === 402 || (err.message && err.message.includes('insufficient'))) {
      console.log('  ⚠  Payment failed: Agent A has insufficient balance.');
      console.log('     Fund Agent A\'s wallet at: https://agent-pay.pro/dashboard');
      console.log('     Then run the demo again.');
    } else {
      console.error('  ✗ Error:', err.message ?? err);
    }
    console.log('═══════════════════════════════════════════\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
