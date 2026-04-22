import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface DrawEntry {
  user_id: string;
  scores_used: number[];
  match_tier?: string;
}

interface DrawResult {
  drawType: string;
  winningNumbers: number[];
  totalPrizePool: number;
  winners: {
    '5-match': { perWinner: number };
    '4-match': { perWinner: number };
    '3-match': { perWinner: number };
  };
  entries: DrawEntry[];
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set() {},
          remove() {},
        },
      }
    );

    const body: DrawResult = await request.json();
    const { drawType, winningNumbers, totalPrizePool, winners, entries } = body;

    // Create draw record
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .insert({
        month: new Date().toISOString().slice(0, 7) + '-01',
        draw_type: drawType,
        winning_numbers: winningNumbers,
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (drawError) throw drawError;

    // Create draw_entries for all participants
    for (const entry of entries) {
      await supabase.from('draw_entries').insert({
        draw_id: draw.id,
        user_id: entry.user_id,
        scores_used: entry.scores_used,
        match_tier: entry.match_tier || null,
        prize_amount: entry.match_tier ? winners[entry.match_tier as keyof typeof winners]?.perWinner || 0 : 0,
        is_winner: !!entry.match_tier,
      });
    }

    // Create payouts for winners (explicitly typed)
    const winnersOnly = entries.filter((entry: DrawEntry) => entry.match_tier);
    for (const winner of winnersOnly) {
      await supabase.from('payouts').insert({
        draw_id: draw.id,
        user_id: winner.user_id,
        tier: winner.match_tier,
        amount: winners[winner.match_tier as keyof typeof winners]?.perWinner || 0,
        payment_status: 'pending',
      });
    }

    return NextResponse.json({ success: true, drawId: draw.id });
  } catch (error: any) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}