# AgentPay

**Payments for AI agents.** No blockchain, no crypto. Just an API key and a POST request.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **SQLite** (better-sqlite3) for agent/transaction storage
- **Stripe** for payments, subscriptions, and Checkout
- Deploys on **Replit** (auto-deploy from this repo)

## Getting Started

Go from zero to first payment in under 5 minutes using the free sandbox.

### 1. Register your agent

```bash
curl -X POST https://agent-pay.pro/api/agents/register \
  -H 'Content-Type: application/json' \
  -d '{ "name": "my-agent", "email": "you@example.com" }'
```

Response:
```json
{
  "id": "agent_abc123",
  "api_key": "sk_live_...",
  "test_api_key": "test_sk_..."
}
```

**Save both keys** — they are shown only once.  
Use `test_api_key` for all development. No Stripe account required.

### 2. Check your sandbox balance

```bash
curl https://agent-pay.pro/api/agents/agent_abc123/balance \
  -H 'Authorization: Bearer test_sk_...'
# → { "balance": 100.00, "test_mode": true, "test_transactions_remaining": 1000 }
```

### 3. Send a test payment

```bash
curl -X POST https://agent-pay.pro/api/payments/create \
  -H 'Authorization: Bearer test_sk_...' \
  -H 'Content-Type: application/json' \
  -d '{ "to_agent_id": "agent_xyz", "amount": 0.25, "purpose": "parser fee" }'
# → { "id": "txn_...", "test_mode": true, "status": "completed" }
```

No real money moves in test mode.

### 4. Go live

Fund your live wallet via Stripe Checkout, then use your `sk_live_` key for real payments.

### 5. Set up webhooks

Receive payment events at your endpoint:

```bash
# Register a webhook
curl -X POST https://agent-pay.pro/api/webhooks/manage \
  -H 'Authorization: Bearer sk_live_...' \
  -H 'Content-Type: application/json' \
  -d '{ "url": "https://your-server.com/hook", "events": ["payment.completed"] }'
```

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe Dashboard (`whsec_...`) |
| `NEXT_PUBLIC_BASE_URL` | Your deployed URL for Checkout redirects |
| `STRIPE_GROWTH_PRICE_ID` | Pre-created Stripe Price ID for the Growth plan (`price_...`) |
| `STRIPE_SCALE_PRICE_ID` | Pre-created Stripe Price ID for the Scale plan (`price_...`) |
| `DATA_DIR` | Absolute path for SQLite storage (defaults to `/tmp`; set for persistence) |

## API routes

All amounts are in **USD**. All endpoints use Bearer auth unless noted.

### Agents

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/agents/register` | None | Register agent — returns `api_key` + `test_api_key` |
| GET | `/api/agents/:id/balance` | Required | Get balance (returns virtual $100 in test mode) |
| POST | `/api/agents/:id/fund` | Required | Fund wallet via Stripe Checkout |
| POST | `/api/agents/reissue` | None (email only) | Reissue API key with 15-min grace period on old key |

### Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/payments/create` | Required | Send payment (USD). Test mode skips Stripe. |
| GET | `/api/payments/:id` | Required | Get payment status |
| POST | `/api/payments/subscribe` | Required | Subscribe to plan via Stripe Checkout |

### Webhooks (user-configured)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/webhooks/manage` | Required | List your webhooks |
| POST | `/api/webhooks/manage` | Required | Create webhook |
| PATCH | `/api/webhooks/manage/:id` | Required | Update webhook (url/events/enabled) |
| DELETE | `/api/webhooks/manage/:id` | Required | Delete webhook |

### Billing & Portal

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/billing/portal` | Required | Get Stripe billing portal URL |

### Accept requests

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/accept` | Required | Create payment request |
| GET | `/api/accept/:id` | Required | Get accept record (owner only) |

### Misc

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/webhooks/stripe` | None (Stripe signature) | Stripe webhook handler |
| GET | `/api/dashboard` | None | Aggregate stats |
| GET | `/api/transactions` | Required | List transactions |

## Rate Limits

| Mode | Limit |
|------|-------|
| Live (`sk_live_`) | 500 requests/minute per API key |
| Test (`test_sk_`) | 1,000 transactions/day per agent (resets midnight UTC) |

Exceeding limits returns `429 Too Many Requests`.

## API versioning

AgentPay has **no version prefixes** — all endpoints are current. There is no `/api/v2/` namespace. If you see references to `/api/v2/transactions` in older docs, use `/api/transactions` instead.

## npm SDK

```bash
npm install agentpay
```

```typescript
import { AgentPay, register } from 'agentpay';

// Register once
const { id, test_api_key } = await register({ name: 'My Bot', email: 'bot@example.com' });

// Use test key for development
const ap = new AgentPay(test_api_key);
await ap.pay({ to: 'agent_def456', amount: 0.25, purpose: 'parser fee' });
const { balance } = await ap.balance(id);
```

## Key rotation

Lost your key? Go to [agent-pay.pro/login](https://agent-pay.pro/login), enter your email, and get a new key instantly. Your old key stays valid for **15 minutes** so running agents aren't broken.

## Stripe Webhook setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-repl-url.replit.app/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `checkout.session.completed`, `customer.subscription.deleted`
4. Copy the signing secret → set `STRIPE_WEBHOOK_SECRET` in Replit Secrets

## Local development

```bash
npm install
cp .env.example .env.local
# Add your Stripe keys to .env.local
npm run dev
```
