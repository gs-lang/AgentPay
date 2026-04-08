import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

type Ctx = { params: { webhook_id: string } };

// PATCH /api/webhooks/manage/:webhook_id — update url, events, or enabled
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const webhook = db.prepare(
    'SELECT id, agent_id FROM webhooks WHERE id = ?'
  ).get(params.webhook_id) as { id: string; agent_id: string } | undefined;

  if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  if (webhook.agent_id !== auth.agentId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.url !== undefined) { updates.push('url = ?'); values.push(body.url); }
    if (body.events !== undefined) { updates.push('events = ?'); values.push(JSON.stringify(body.events)); }
    if (body.enabled !== undefined) { updates.push('enabled = ?'); values.push(body.enabled ? 1 : 0); }

    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    updates.push("updated_at = datetime('now')");
    values.push(params.webhook_id);

    db.prepare(`UPDATE webhooks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(params.webhook_id) as Record<string, unknown>;
    return NextResponse.json({ ...updated, events: JSON.parse(updated.events as string), enabled: !!(updated.enabled) });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/webhooks/manage/:webhook_id — delete a webhook
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const webhook = db.prepare(
    'SELECT id, agent_id FROM webhooks WHERE id = ?'
  ).get(params.webhook_id) as { id: string; agent_id: string } | undefined;

  if (!webhook) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
  if (webhook.agent_id !== auth.agentId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  db.prepare('DELETE FROM webhooks WHERE id = ?').run(params.webhook_id);
  return new NextResponse(null, { status: 204 });
}
