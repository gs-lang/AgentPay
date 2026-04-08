import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';

type Ctx = { params: { accept_id: string } };

// GET /api/accept/:accept_id — get accept record (auth required to protect agent transaction data)
export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const record = db.prepare(
    'SELECT * FROM accepts WHERE id = ?'
  ).get(params.accept_id) as Record<string, unknown> | undefined;

  if (!record) return NextResponse.json({ error: 'Accept record not found' }, { status: 404 });

  // Only the owning agent can retrieve the accept record
  if (record.agent_id !== auth.agentId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(record);
}
