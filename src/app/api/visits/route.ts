import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { serializeError } from '@/lib/utils';

const VISITS_TABLE = 'admin_visits';
const VISITS_ROW_ID = 1;

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, message: 'Supabase admin client not configured.' }, { status: 500 });
    }

    // 1. Lấy giá trị hiện tại
    const { data: current } = await supabaseAdmin
      .from(VISITS_TABLE)
      .select('visits')
      .eq('id', VISITS_ROW_ID)
      .maybeSingle();

    const currentVisits = current?.visits || 0;

    // 2. Tăng lên 1
    const next = {
      id: VISITS_ROW_ID,
      visits: currentVisits + 1,
      last_updated: new Date().toISOString(),
    };

    // 3. Upsert vào database
    const { error } = await supabaseAdmin
      .from(VISITS_TABLE)
      .upsert(next, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ success: true, visits: next.visits });
  } catch (error) {
    return NextResponse.json({ success: false, message: serializeError(error) }, { status: 500 });
  }
}