#!/usr/bin/env node
/**
 * AgentPay MCP Server (agent-payments-mcp)
 *
 * Exposes AgentPay payment capabilities as MCP tools so any
 * MCP-compatible AI agent can send/receive USD payments.
 *
 * Usage:
 *   AGENTPAY_API_KEY=sk_live_... npx agent-payments-mcp
 *
 * Or in Claude Desktop config:
 *   {
 *     "mcpServers": {
 *       "agentpay": {
 *         "command": "npx",
 *         "args": ["-y", "agent-payments-mcp"],
 *         "env": { "AGENTPAY_API_KEY": "sk_live_..." }
 *       }
 *     }
 *   }
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = process.env.AGENTPAY_BASE_URL ?? "https://agent-pay.pro";
const API_KEY = process.env.AGENTPAY_API_KEY ?? "";

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  apiKey?: string
): Promise<T> {
  const key = apiKey ?? API_KEY;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `HTTP ${res.status} ${path}`
    );
  }
  return data;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "agentpay_register",
    description:
      "Register a new AI agent with AgentPay to enable payments. Returns an agent_id, api_key, and test_api_key. No existing API key required.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Display name for the agent (e.g. 'my-parser-bot')",
        },
        email: {
          type: "string",
          description: "Email address for the agent account (used for key recovery)",
        },
      },
      required: ["name", "email"],
    },
  },
  {
    name: "agentpay_pay",
    description:
      "Send a payment from this agent to another agent. Debits the authenticated agent's wallet and credits the recipient instantly. In test mode (test_sk_ key), no real money moves.",
    inputSchema: {
      type: "object",
      properties: {
        to_agent_id: {
          type: "string",
          description: "Recipient agent ID (e.g. agent_abc123)",
        },
        amount: {
          type: "number",
          description: "Amount in USD (e.g. 0.25 = $0.25)",
        },
        purpose: {
          type: "string",
          description: "Optional human-readable description of payment purpose",
        },
        api_key: {
          type: "string",
          description:
            "AgentPay API key. Falls back to AGENTPAY_API_KEY env var.",
        },
      },
      required: ["to_agent_id", "amount"],
    },
  },
  {
    name: "agentpay_accept",
    description:
      "Create a payment request (merchant side). Use when your agent is providing a service and wants to receive payment. Returns an accept_id that the payer can reference.",
    inputSchema: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Amount in USD to request (e.g. 1.00 = $1.00)",
        },
        purpose: {
          type: "string",
          description: "Description of the service being provided",
        },
        api_key: {
          type: "string",
          description:
            "AgentPay API key. Falls back to AGENTPAY_API_KEY env var.",
        },
      },
      required: ["amount"],
    },
  },
  {
    name: "agentpay_balance",
    description:
      "Check an agent's payment balance and available funds. In test mode returns a virtual $100.",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: {
          type: "string",
          description: "Agent ID to check balance for (e.g. agent_abc123)",
        },
        api_key: {
          type: "string",
          description:
            "AgentPay API key. Falls back to AGENTPAY_API_KEY env var.",
        },
      },
      required: ["agent_id"],
    },
  },
  {
    name: "agentpay_transactions",
    description:
      "List recent transactions for the authenticated agent (sent and received).",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Max results to return (default 20)",
        },
        offset: {
          type: "number",
          description: "Pagination offset (default 0)",
        },
        api_key: {
          type: "string",
          description:
            "AgentPay API key. Falls back to AGENTPAY_API_KEY env var.",
        },
      },
      required: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new Server(
  { name: "agent-payments-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const a = (args ?? {}) as Record<string, unknown>;

  try {
    switch (name) {
      case "agentpay_register": {
        const result = await apiRequest<Record<string, unknown>>(
          "POST",
          "/api/agents/register",
          { name: a.name, email: a.email }
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "agentpay_pay": {
        const result = await apiRequest<Record<string, unknown>>(
          "POST",
          "/api/payments/create",
          {
            to_agent_id: a.to_agent_id,
            amount: a.amount,
            purpose: a.purpose,
          },
          a.api_key as string | undefined
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "agentpay_accept": {
        const result = await apiRequest<Record<string, unknown>>(
          "POST",
          "/api/accept",
          { amount: a.amount, purpose: a.purpose },
          a.api_key as string | undefined
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "agentpay_balance": {
        const result = await apiRequest<Record<string, unknown>>(
          "GET",
          `/api/agents/${a.agent_id}/balance`,
          undefined,
          a.api_key as string | undefined
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "agentpay_transactions": {
        const qs = new URLSearchParams();
        if (a.limit != null) qs.set("limit", String(a.limit));
        if (a.offset != null) qs.set("offset", String(a.offset));
        const query = qs.toString() ? `?${qs.toString()}` : "";
        const result = await apiRequest<Record<string, unknown>>(
          "GET",
          `/api/transactions${query}`,
          undefined,
          a.api_key as string | undefined
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  if (!API_KEY) {
    process.stderr.write(
      "Warning: AGENTPAY_API_KEY not set. Some tools require an API key passed explicitly.\n"
    );
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
