import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

// GET /api/webhooks/manage — list agent webhooks
export async function GET(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const webhooks = db.prepare(
    'SELECT id, url, events, enabled, created_at, updated_at FROM webhooks WHERE agent_id = ? ORDER BY created_at DESC'
  ).all(auth.agentId) as { id: string; url: string; events: string; enabled: number; created_at: string; updated_at: string }[];

  return NextResponse.json({
    webhooks: webhooks.map(w => ({ ...w, events: JSON.parse(w.events), enabled: !!w.enabled })),
  });
}

// POST /api/webhooks/manage — create a webhook
export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { url, events = ['payment.completed'] } = await req.json();
    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

    const id = `wh_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
    const db = getDb();
    db.prepare(
      'INSERT INTO webhooks (id, agent_id, url, events) VALUES (?, ?, ?, ?)'
    ).run(id, auth.agentId, url, JSON.stringify(events));

    return NextResponse.json({ id, url, events, enabled: true, created_at: new Date().toISOString() }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
