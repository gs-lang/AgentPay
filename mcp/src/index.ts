#!/usr/bin/env node
/**
 * agent-pay-mcp
 * MCP server for AgentPay — payment infrastructure for AI agents.
 * Exposes 4 tools: agentpay_register, agentpay_pay, agentpay_accept, agentpay_balance
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = process.env.AGENTPAY_BASE_URL ?? "https://agent-pay.pro";
const API_KEY = process.env.AGENTPAY_API_KEY ?? "";

async function request<T>(
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

const server = new Server(
  { name: "agent-pay", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "agentpay_register",
      description:
        "Register a new AI agent with AgentPay to enable payments. Returns an agent_id and api_key. No existing API key required.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Display name for the agent",
          },
          email: {
            type: "string",
            description: "Email address for the agent account",
          },
        },
        required: ["name", "email"],
      },
    },
    {
      name: "agentpay_pay",
      description:
        "Send a payment from this agent to another agent. Debits the authenticated agent's wallet and credits the recipient instantly. Requires AGENTPAY_API_KEY env var or api_key parameter.",
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
        "Create a payment request (merchant side). Use when your agent is providing a service and wants to receive payment. Returns an accept_id that the payer can reference. Requires AGENTPAY_API_KEY env var or api_key parameter.",
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
        "Check an agent's payment balance and available funds.",
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
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const a = (args ?? {}) as Record<string, unknown>;

  try {
    switch (name) {
      case "agentpay_register": {
        const result = await request("POST", "/api/agents/register", {
          name: a.name,
          email: a.email,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "agentpay_pay": {
        const key = (a.api_key as string) || API_KEY;
        const result = await request(
          "POST",
          "/api/payments/create",
          {
            to_agent_id: a.to_agent_id,
            amount: a.amount,
            purpose: a.purpose,
          },
          key
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "agentpay_accept": {
        const key = (a.api_key as string) || API_KEY;
        const result = await request(
          "POST",
          "/api/accept",
          {
            amount: a.amount,
            purpose: a.purpose,
          },
          key
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "agentpay_balance": {
        const key = (a.api_key as string) || API_KEY;
        const result = await request(
          "GET",
          `/api/agents/${a.agent_id}/balance`,
          undefined,
          key
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("agent-pay MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
