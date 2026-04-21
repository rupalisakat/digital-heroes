import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    const { drawType } = await request.json();

    // Simple random numbers for now
    const winningNumbers = Array.from({ length: 5 }, () => Math.floor(Math.random() * 45) + 1);

    // Get active subscribers
    const { data: activeUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active');

    const activeCount = activeUsers?.length || 0;
    const totalPrizePool = activeCount * 10 * 0.5;

    return NextResponse.json({
      drawType,
      winningNumbers,
      activeSubscribers: activeCount,
      totalPrizePool: totalPrizePool.toFixed(2),
      winners: { '5-match': { count: 0, perWinner: 0 }, '4-match': { count: 0, perWinner: 0 }, '3-match': { count: 0, perWinner: 0 } },
      message: 'Simulation completed (simplified version)',
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}