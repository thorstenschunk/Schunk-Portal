import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = supabaseAdmin();
    const { error } = await db.from('roles').select('id').limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true, service: 'schunk-portal', version: '1.0.0' }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch {
    return NextResponse.json({ ok: false, service: 'schunk-portal' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  }
}
