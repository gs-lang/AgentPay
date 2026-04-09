# AI Agent with Payments — AgentPay Demo

> Fork this template to add payments to your AI agents in 5 minutes.

This template shows two AI agents transacting with each other using [AgentPay](https://agent-pay.pro):

- **Agent A** (orchestrator) — delegates a task and pays for it on completion
- **Agent B** (worker) — performs the task (text summarization) and receives payment

No crypto. No wallets. Just an API key and a POST request.

## What happens when you run it

```
Step 1: Setting up agents
  ✓ Agent-A registered (or loaded from .env)
  ✓ Agent-B registered (or loaded from .env)

Step 2: Checking balances before transaction
  Agent A balance: $5.00
  Agent B balance: $0.00

Step 3: Agent A delegates work to Agent B and pays on completion
  → Agent A: delegating summarization task to Agent B...
  → Agent B: completed task. Fee: $0.05
  → Agent B summary: "Artificial intelligence agents are increasingly..."
  → Agent A: paying Agent B $0.05 for summarization...
  → Payment confirmed: pay_abc123 (status: succeeded)

Step 4: Checking balances after transaction
  Agent A balance: $4.95
  Agent B balance: $0.05
```

## Quick start

### 1. Get an API key

Create a free account at [agent-pay.pro](https://agent-pay.pro/register). You get 100 transactions/month free.

### 2. Add your key to `.env`

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then add your keys. On the first run without keys, new agents are auto-registered and their IDs are printed — copy those into `.env` to reuse them.

### 3. Fund Agent A's wallet

Visit your [AgentPay dashboard](https://agent-pay.pro/dashboard) and add a small amount ($1–$5) to test with. Agent A needs balance to pay Agent B.

### 4. Run the demo

```bash
npm install
node main.js
```

## Project structure

```
.env.example      # Environment variable template
package.json      # Dependencies (agent-payments, dotenv)
agent_a.js        # Orchestrator: delegates work, pays on completion
agent_b.js        # Worker: summarizes text, charges $0.05/request
main.js           # Runs the full demo end to end
```

## Adapting this template

**Replace the summarization logic** in `agent_b.js` with your own tool — API call, LLM prompt, data transformation, anything.

**Add real LLM agents** by installing `@anthropic-ai/sdk` or `openai` and replacing the stub with actual model calls.

**Run agents as services** — in production, Agent A and Agent B would be separate servers calling each other over HTTP. Use the same `agent-payments` SDK in both.

## Pricing

| Tier   | Price     | Transactions |
|--------|-----------|--------------|
| Free   | $0/mo     | 100/month    |
| Growth | $49/mo    | 10,000/month |
| Scale  | $199/mo   | Unlimited    |

Transaction fee: 1.5% per payment.

## Links

- [agent-pay.pro](https://agent-pay.pro) — Product homepage
- [Dashboard](https://agent-pay.pro/dashboard) — Manage agents and wallets
- [npm: agent-payments](https://www.npmjs.com/package/agent-payments) — SDK on npm
- [GitHub](https://github.com/gs-lang/AgentPay) — Source code
