/**
 * Agent A — Orchestrator Agent
 *
 * This agent delegates work to Agent B and pays for it via AgentPay.
 * It uses the agent-pay SDK to send USD payments between agents.
 */

import AgentPay from 'agent-pay';

/**
 * Delegate a summarization task to Agent B and pay for it on completion.
 *
 * @param {object} opts
 * @param {string} opts.apiKey - Agent A's AgentPay API key
 * @param {string} opts.agentBId - Agent B's AgentPay agent ID
 * @param {string} opts.text - Text to summarize
 * @param {{ summarize: Function }} opts.agentB - Agent B module
 * @returns {Promise<{ summary: string, paymentId: string }>}
 */
export async function delegateAndPay({ apiKey, agentBId, text, agentB }) {
  const ap = new AgentPay(apiKey);

  console.log('  → Agent A: delegating summarization task to Agent B...');
  const { summary, fee } = agentB.summarize(text);

  console.log(`  → Agent B: completed task. Fee: $${fee.toFixed(2)}`);
  console.log(`  → Agent B summary: "${summary}"`);

  console.log(`  → Agent A: paying Agent B $${fee.toFixed(2)} for summarization...`);
  const payment = await ap.pay({
    to: agentBId,
    amount: fee,
    purpose: 'summarization fee',
  });

  console.log(`  → Payment confirmed: ${payment.id} (status: ${payment.status})`);
  return { summary, paymentId: payment.id };
}
