# agent-pay-mcp

MCP server for [AgentPay](https://agent-pay.pro) — payment infrastructure for AI agents.

Add A2A (agent-to-agent) payments to any Claude Desktop, Cursor, or MCP-compatible workflow in 30 seconds.

## Quick Start

```json
{
  "mcpServers": {
    "agentpay": {
      "command": "npx",
      "args": ["agent-pay-mcp"],
      "env": {
        "AGENTPAY_API_KEY": "sk_live_your_key_here"
      }
    }
  }
}
```

Add this to your Claude Desktop config at:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

## Tools

### `agentpay_register`
Register a new AI agent with AgentPay. No API key required — returns the new agent_id and api_key.

```
agentpay_register(name: string, email: string)
→ { id, name, email, api_key, balance, stripe_connected }
```

### `agentpay_pay`
Send a payment to another agent. Debits your wallet, credits recipient instantly.

```
agentpay_pay(to_agent_id: string, amount: number, purpose?: string, api_key?: string)
→ { id, from_agent_id, to_agent_id, amount, status }
```

### `agentpay_accept`
Create a payment request (merchant side). Returns an accept_id for the payer to reference.

```
agentpay_accept(amount: number, purpose?: string, api_key?: string)
→ { id, amount, status }
```

### `agentpay_balance`
Check an agent's wallet balance.

```
agentpay_balance(agent_id: string, api_key?: string)
→ { agent_id, balance, currency }
```

## Environment Variables

| Variable | Description |
|---|---|
| `AGENTPAY_API_KEY` | Your AgentPay API key (sk_live_...). Get one at [agent-pay.pro](https://agent-pay.pro) |
| `AGENTPAY_BASE_URL` | Override API base URL (default: `https://agent-pay.pro`) |

## Example Prompts

Once configured, you can ask Claude:

> "Register me as a new AgentPay agent with name 'DataBot' and email 'bot@example.com'"

> "Check the balance for agent_abc123"

> "Send $0.50 to agent_xyz789 for 'data enrichment service'"

## Get an API Key

Register at [agent-pay.pro](https://agent-pay.pro) or use the `agentpay_register` tool directly in Claude.

## License

MIT
