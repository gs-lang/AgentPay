# agent-pay

**The payments API for AI agents. No crypto. No complexity.**

A2A payments between agents = AgentPay. Human checkout flows = Stripe.

## Install

```bash
npm install agent-pay
```

## Quickstart

```typescript
import { AgentPay, register } from 'agent-pay';

// Register your agent once
const { id, api_key } = await register({ name: 'My Bot', email: 'bot@example.com' });
// Save api_key securely — shown only once

const ap = new AgentPay(process.env.AGENTPAY_API_KEY);

// Send a payment
await ap.pay({ to: 'agent_abc123', amount: 0.50, purpose: 'tool usage fee' });

// Accept/request a payment (merchant side)
const request = await ap.accept({ amount: 0.50, purpose: 'data enrichment' });

// Check balance
const { balance } = await ap.balance(id);
console.log(`Balance: $${balance}`);
```

## When to use AgentPay vs Stripe

| Use case | Tool |
|----------|------|
| A2A payments between agents | **AgentPay** |
| Human checkout flows | Stripe |
| Crypto / blockchain | Neither |

## Full API Reference

### `new AgentPay(apiKey)`

Initialize the client with your API key.

```typescript
const ap = new AgentPay(process.env.AGENTPAY_API_KEY);
```

### `register({ name, email })`

Register a new agent and get an API key. Call this once before you have a key.

```typescript
import { register } from 'agent-pay';

const { id, api_key } = await register({ name: 'My Bot', email: 'bot@example.com' });
// Store api_key securely — shown only once
```

### `ap.pay({ to, amount, purpose? })`

Send a USD payment to another agent. Debits your wallet, credits theirs instantly.

```typescript
await ap.pay({
  to: 'agent_def456',
  amount: 0.25,
  purpose: 'Used parser tool',
});
```

### `ap.accept({ amount, purpose?, currency? })`

Create a payment request (merchant side). Use this when your agent is the one receiving payment.

```typescript
const request = await ap.accept({
  amount: 0.50,
  purpose: 'data enrichment',
});
// Returns { id, amount, currency, purpose, status, created_at }
```

### `ap.balance(agentId)`

Get current wallet balance.

```typescript
const { balance, currency } = await ap.balance('agent_abc123');
console.log(`Balance: $${balance}`);
```

### `ap.subscribe({ plan })`

Subscribe to Growth or Scale plan. Returns a Stripe Checkout URL.

```typescript
const { checkout_url } = await ap.subscribe({ plan: 'growth' });
// Redirect user to checkout_url
```

### `ap.fund(agentId, { amount })`

Top up a wallet via Stripe Checkout.

```typescript
const { checkout_url } = await ap.fund('agent_abc123', { amount: 10.00 });
```

### `ap.transactions({ limit?, offset? })`

List sent and received transactions.

```typescript
const { transactions } = await ap.transactions({ limit: 20 });
```

## MCP Integration (Claude / Cursor)

```json
{
  "mcpServers": {
    "agent-pay": {
      "command": "npx",
      "args": ["agent-pay-mcp"],
      "env": {
        "AGENTPAY_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Framework Examples

**LangChain (Python):**
```python
from langchain.tools import tool

@tool
def pay_agent(to: str, amount: float, purpose: str) -> dict:
    """Send a USD payment to another agent via AgentPay."""
    import subprocess, json
    result = subprocess.run(
        ["node", "-e",
         f"const {{AgentPay}}=require('agent-pay');"
         f"new AgentPay(process.env.AGENTPAY_API_KEY)"
         f".pay({{to:'{to}',amount:{amount},purpose:'{purpose}'}})"
         f".then(r=>console.log(JSON.stringify(r)))"],
        capture_output=True, text=True
    )
    return json.loads(result.stdout)
```

**TypeScript / Node.js:**
```typescript
import { AgentPay, register } from 'agent-pay';

const ap = new AgentPay(process.env.AGENTPAY_API_KEY!);
await ap.pay({ to: 'agent_xyz', amount: 0.10, purpose: 'API call fee' });
```

**AutoGen / CrewAI:**
```python
import os
from agent_pay_client import AgentPayClient  # thin wrapper

ap = AgentPayClient(os.environ["AGENTPAY_API_KEY"])
ap.pay(to="agent_xyz", amount=0.05, purpose="web search fee")
```

## Pricing

| Tier | Price | Transactions |
|------|-------|-------------|
| Starter | $29/mo | 1,000/mo |
| Growth | $99/mo | 10,000/mo |
| Scale | $299/mo | Unlimited |

## Links

- **Docs:** [https://agent-pay.pro/docs](https://agent-pay.pro/docs)
- **Dashboard:** [https://agent-pay.pro](https://agent-pay.pro)
- **npm:** [https://www.npmjs.com/package/agent-pay](https://www.npmjs.com/package/agent-pay)
