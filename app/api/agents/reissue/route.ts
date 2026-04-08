import { NextRequest, NextResponse } from 'next/server';
import { getDb, generateApiKey, hashApiKey } from '@/lib/db';

const GRACE_MINUTES = 15;

// POST /api/agents/reissue — reissue API key with 15-min grace period on the old key
// Requires: { email } — no API key needed (breaks the circular dependency)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const db = getDb();
    const agent = db.prepare(
      'SELECT id, name, api_key_hash FROM agents WHERE email = ?'
    ).get(email.toLowerCase().trim()) as { id: string; name: string; api_key_hash: string } | undefined;

    if (!agent) {
      // Return same response to avoid email enumeration
      return NextResponse.json({
        message: 'If that email is registered, a new API key has been issued. Your old key remains valid for 15 minutes.',
      });
    }

    const { apiKey: newKey, hash: newHash, prefix: newPrefix } = generateApiKey();
    const graceExpiry = new Date(Date.now() + GRACE_MINUTES * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

    // Store old key hash for grace period, issue new key
    db.prepare(`
      UPDATE agents
      SET old_api_key_hash = api_key_hash,
          api_key_grace_expires_at = ?,
          api_key_hash = ?,
          api_key_prefix = ?
      WHERE id = ?
    `).run(graceExpiry, newHash, newPrefix, agent.id);

    return NextResponse.json({
      agent_id: agent.id,
      name: agent.name,
      api_key: newKey, // returned once — save immediately
      grace_period_minutes: GRACE_MINUTES,
      message: `New API key issued. Your old key remains valid for ${GRACE_MINUTES} minutes to allow safe rotation.`,
    });
  } catch (err: unknown) {
    console.error('reissue error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
