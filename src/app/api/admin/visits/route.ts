import { NextResponse } from 'next/server';
import { assertAdminRequest } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { serializeError } from '@/lib/utils';

const VISITS_TABLE = 'admin_visits';
const VISITS_ROW_ID = 1;

type VisitsRow = {
  id: number;
  visits: number;
  last_updated: string;
};

async function readVisits() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured.');
  }

  const { data, error } = await supabaseAdmin
    .from(VISITS_TABLE)
    .select('id, visits, last_updated')
    .eq('id', VISITS_ROW_ID)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const initial: VisitsRow = { id: VISITS_ROW_ID, visits: 0, last_updated: new Date().toISOString() };
    const { error: seedError } = await supabaseAdmin
      .from(VISITS_TABLE)
      .upsert(initial, { onConflict: 'id' });
    if (seedError) throw seedError;
    return { visits: initial.visits, lastUpdated: initial.last_updated };
  }

  return {
    visits: data.visits || 0,
    lastUpdated: data.last_updated,
  };
}

export async function GET(request: Request) {
  try {
    const authError = assertAdminRequest(request);
    if (authError) return authError;

    const data = await readVisits();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ success: false, message: serializeError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authError = assertAdminRequest(request);
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: 'Supabase admin client not configured.' }, { status: 500 });
    }

    const current = await readVisits();
    const next = {
      id: VISITS_ROW_ID,
      visits: (current.visits || 0) + 1,
      last_updated: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin
      .from(VISITS_TABLE)
      .upsert(next, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ visits: next.visits, lastUpdated: next.last_updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: serializeError(error) }, { status: 500 });
  }
}
