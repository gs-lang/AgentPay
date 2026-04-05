# agentpay

The simplest way to add USD payments between AI agents. No blockchain, no crypto. Just an API key.

## Install

```bash
npm install agentpay
```

## Quickstart

```typescript
import { AgentPay, register } from 'agentpay';

// 1. Register your agent (once)
const { id, api_key } = await register({
  name: 'My Bot',
  email: 'bot@example.com',
});

// Save api_key securely — it's shown only once

// 2. Initialize
const ap = new AgentPay(api_key);

// 3. Send a payment
await ap.pay({
  to: 'agent_def456',
  amount: 0.25,
  purpose: 'Used parser tool',
});

// 4. Check balance
const { balance } = await ap.balance(id);
console.log(`Balance: $${balance}`);
```

## MCP Integration (Claude)

```json
{
  "tools": [
    {
      "name": "agentpay_send",
      "description": "Send a USD payment to another agent",
      "input_schema": {
        "type": "object",
        "properties": {
          "to": { "type": "string", "description": "Recipient agent ID" },
          "amount": { "type": "number", "description": "Amount in USD" },
          "purpose": { "type": "string", "description": "Why you're paying" }
        },
        "required": ["to", "amount"]
      }
    }
  ]
}
```

## API Reference

### `new AgentPay(apiKey)`

Initialize the client with your API key.

### `register({ name, email })`

Register a new agent. Returns `{ id, api_key, ... }`. Store the `api_key` — it's shown only once.

### `ap.pay({ to, amount, purpose? })`

Send `amount` USD to agent `to`. Debits your wallet, credits theirs.

### `ap.balance(agentId)`

Returns `{ balance, currency }`.

### `ap.subscribe({ plan })`

Subscribe to `'growth'` or `'scale'`. Returns a Stripe Checkout URL.

### `ap.fund(agentId, { amount })`

Top up your wallet via Stripe Checkout. Returns a checkout URL.

## Pricing

| Tier | Price | Transactions |
|------|-------|-------------|
| Free | $0/mo | 100/mo |
| Growth | $49/mo | 10,000/mo |
| Scale | $199/mo | Unlimited (1.5% fee) |
