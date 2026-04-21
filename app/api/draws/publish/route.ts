import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get(name) { return cookieStore.get(name)?.value; }, set() {}, remove() {} } }
    );

    const { drawType, winningNumbers, totalPrizePool, winners, entries } = await request.json();

    // Create draw record
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .insert({
        month: new Date().toISOString().slice(0, 7) + '-01', // first day of current month
        draw_type: drawType,
        winning_numbers: winningNumbers,
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (drawError) throw drawError;

    // Create draw_entries for all participants (winners and non-winners)
    for (const entry of entries) {
      await supabase.from('draw_entries').insert({
        draw_id: draw.id,
        user_id: entry.user_id,
        scores_used: entry.scores_used,
        match_tier: entry.match_tier || null,
        prize_amount: entry.match_tier ? (winners[entry.match_tier]?.perWinner || 0) : 0,
        is_winner: !!entry.match_tier,
      });
    }

    // Create payouts for winners
    const winnersOnly = entries.filter(e => e.match_tier);
    for (const winner of winnersOnly) {
      await supabase.from('payouts').insert({
        draw_id: draw.id,
        user_id: winner.user_id,
        tier: winner.match_tier,
        amount: winners[winner.match_tier]?.perWinner || 0,
        payment_status: 'pending',
      });
    }

    return NextResponse.json({ success: true, drawId: draw.id });
  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}