/**
 * agent-pay SDK
 * Payment infrastructure for AI agents. A2A payments with one API call.
 *
 * @example
 * ```typescript
 * import { AgentPay } from 'agent-pay';
 *
 * const ap = new AgentPay(process.env.AGENTPAY_API_KEY);
 *
 * // Send a payment
 * await ap.pay({ to: 'agent_abc123', amount: 0.50, purpose: 'tool usage fee' });
 *
 * // Accept a payment (merchant side)
 * await ap.accept({ amount: 0.50, purpose: 'data enrichment' });
 *
 * // Check balance
 * const { balance } = await ap.balance('your_agent_id');
 * ```
 */

export interface AgentPayConfig {
  /** Your AgentPay API key (sk_live_...) */
  apiKey: string;
  /** Base URL of the AgentPay API. Defaults to https://agent-pay.pro */
  baseUrl?: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  balance: number;
  currency: string;
  stripe_connected: boolean;
  created_at: string;
}

export interface RegisterParams {
  name: string;
  email: string;
}

export interface RegisterResult extends Agent {
  /** API key — returned only on registration. Store it securely. */
  api_key: string;
}

export interface PayParams {
  /** Recipient agent ID */
  to: string;
  /** Amount in USD (e.g. 0.25 = $0.25) */
  amount: number;
  /** Optional human-readable purpose */
  purpose?: string;
  /** Currency code. Defaults to 'usd' */
  currency?: string;
}

export interface PayResult {
  id: string;
  from_agent_id: string;
  to_agent_id: string;
  amount: number;
  currency: string;
  purpose: string | null;
  status: string;
  stripe_payment_intent_id: string;
  client_secret: string;
  created_at: string;
}

export interface SubscribeParams {
  /** Plan to subscribe to: 'growth' | 'scale' */
  plan: 'growth' | 'scale';
}

export interface SubscribeResult {
  checkout_url: string;
  session_id: string;
}

export interface BalanceResult {
  agent_id: string;
  balance: number;
  currency: string;
}

export interface FundParams {
  /** Amount in USD to add to wallet */
  amount: number;
}

export interface FundResult {
  checkout_url: string;
}

export interface AcceptParams {
  /** Amount in USD to request */
  amount: number;
  /** Optional human-readable purpose */
  purpose?: string;
  /** Currency code. Defaults to 'usd' */
  currency?: string;
}

export interface AcceptResult {
  id: string;
  amount: number;
  currency: string;
  purpose: string | null;
  status: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  from_agent_id: string | null;
  to_agent_id: string | null;
  amount: number;
  currency: string;
  purpose: string | null;
  status: string;
  stripe_status?: string;
  created_at: string;
}

export class AgentPayError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'AgentPayError';
    this.status = status;
  }
}

export class AgentPay {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: string | AgentPayConfig) {
    if (typeof config === 'string') {
      this.apiKey = config;
      this.baseUrl = 'https://agent-pay.pro';
    } else {
      this.apiKey = config.apiKey;
      this.baseUrl = config.baseUrl ?? 'https://agent-pay.pro';
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body != null ? JSON.stringify(body) : undefined,
    });

    const data = await res.json() as T & { error?: string };
    if (!res.ok) {
      throw new AgentPayError(
        (data as { error?: string }).error ?? `HTTP ${res.status}`,
        res.status
      );
    }
    return data;
  }

  /**
   * Send a payment to another agent.
   * Debits your wallet and credits the recipient instantly.
   */
  async pay(params: PayParams): Promise<PayResult> {
    return this.request<PayResult>('POST', '/api/payments/create', {
      to_agent_id: params.to,
      amount: params.amount,
      currency: params.currency ?? 'usd',
      purpose: params.purpose,
    });
  }

  /**
   * Create a payment request (merchant side).
   * Use this when your agent is receiving payment for a service.
   */
  async accept(params: AcceptParams): Promise<AcceptResult> {
    return this.request<AcceptResult>('POST', '/api/accept', {
      amount: params.amount,
      currency: params.currency ?? 'usd',
      purpose: params.purpose,
    });
  }

  /**
   * Subscribe to a Growth or Scale plan via Stripe Checkout.
   * Returns a checkout_url — redirect the user there to complete payment.
   */
  async subscribe(params: SubscribeParams): Promise<SubscribeResult> {
    return this.request<SubscribeResult>('POST', '/api/payments/subscribe', params);
  }

  /**
   * Get the current balance for an agent.
   */
  async balance(agentId: string): Promise<BalanceResult> {
    return this.request<BalanceResult>('GET', `/api/agents/${agentId}/balance`);
  }

  /**
   * Fund an agent wallet via Stripe Checkout.
   * Returns a checkout_url — redirect the user there to complete payment.
   */
  async fund(agentId: string, params: FundParams): Promise<FundResult> {
    return this.request<FundResult>('POST', `/api/agents/${agentId}/fund`, params);
  }

  /**
   * Get a specific payment/transaction by ID.
   */
  async getPayment(id: string): Promise<Transaction> {
    return this.request<Transaction>('GET', `/api/payments/${id}`);
  }

  /**
   * List transactions for the authenticated agent (sent and received).
   */
  async transactions(params?: { limit?: number; offset?: number }): Promise<{ transactions: Transaction[]; pagination: { limit: number; offset: number } }> {
    const qs = new URLSearchParams();
    if (params?.limit != null) qs.set('limit', String(params.limit));
    if (params?.offset != null) qs.set('offset', String(params.offset));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return this.request('GET', `/api/transactions${query}`);
  }
}

export default AgentPay;

/**
 * Register a new agent and get an API key.
 * Static helper — use before you have an API key.
 *
 * @example
 * ```typescript
 * const { id, api_key } = await register(
 *   { name: 'My Bot', email: 'bot@example.com' }
 * );
 * const ap = new AgentPay(api_key);
 * ```
 */
export async function register(
  params: RegisterParams,
  config?: { baseUrl?: string }
): Promise<RegisterResult> {
  const baseUrl = config?.baseUrl ?? 'https://agent-pay.pro';
  const res = await fetch(`${baseUrl}/api/agents/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json() as RegisterResult & { error?: string };
  if (!res.ok) {
    throw new AgentPayError(data.error ?? `HTTP ${res.status}`, res.status);
  }
  return data;
}
