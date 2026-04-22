import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Helper: generate random 5 numbers (1-45)
function generateRandomNumbers(): number[] {
  const nums = new Set<number>();
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(nums).sort((a, b) => a - b);
}

// Algorithmic: weighted by most frequent scores (last 30 days)
async function generateAlgorithmicNumbers(supabase: any): Promise<number[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

  const { data } = await supabase
    .from('scores')
    .select('score')
    .gte('date_played', dateStr);

  if (!data || data.length === 0) return generateRandomNumbers();

  const freq: Record<number, number> = {};
  data.forEach((row: any) => {
    freq[row.score] = (freq[row.score] || 0) + 1;
  });

  const weightedPool: number[] = [];
  for (const [score, count] of Object.entries(freq)) {
    for (let i = 0; i < count; i++) {
      weightedPool.push(Number(score));
    }
  }

  const selected = new Set<number>();
  while (selected.size < 5 && weightedPool.length > 0) {
    const idx = Math.floor(Math.random() * weightedPool.length);
    selected.add(weightedPool[idx]);
  }
  while (selected.size < 5) {
    selected.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(selected).sort((a, b) => a - b);
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
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    const { drawType }: { drawType: string } = await request.json();

    // 1. Generate winning numbers
    const winningNumbers = drawType === 'random'
      ? generateRandomNumbers()
      : await generateAlgorithmicNumbers(supabase);

    // 2. Get all active subscribers
    const { data: activeUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active');

    if (!activeUsers || activeUsers.length === 0) {
      return NextResponse.json({
        drawType,
        winningNumbers,
        activeSubscribers: 0,
        totalPrizePool: 0,
        winners: { '5-match': { count: 0, perWinner: 0 }, '4-match': { count: 0, perWinner: 0 }, '3-match': { count: 0, perWinner: 0 } },
        entries: []
      });
    }

    // 3. For each user, get their last 5 scores
    const entries: any[] = [];
    for (const user of activeUsers) {
      const { data: scores } = await supabase
        .from('scores')
        .select('score')
        .eq('user_id', user.id)
        .order('date_played', { ascending: false })
        .limit(5);

      if (scores && scores.length === 5) {
        const userNumbers = scores.map(s => s.score);
        const matchCount = userNumbers.filter(n => winningNumbers.includes(n)).length;
        let tier = null;
        if (matchCount === 5) tier = '5-match';
        else if (matchCount === 4) tier = '4-match';
        else if (matchCount === 3) tier = '3-match';

        entries.push({
          user_id: user.id,
          scores_used: userNumbers,
          match_tier: tier,
          is_winner: !!tier,
        });
      }
    }

    // 4. Calculate prize pool
    // Assume $10 per active subscription, 50% goes to prize pool (adjust as needed)
    const SUBSCRIPTION_FEE = 10;
    const PRIZE_POOL_PERCENT = 0.5;
    const totalPrizePool = activeUsers.length * SUBSCRIPTION_FEE * PRIZE_POOL_PERCENT;

    // 5. Distribute according to PRD: 40%, 35%, 25%
    const tierShares = { '5-match': 0.4, '4-match': 0.35, '3-match': 0.25 };
    const winnersByTier: any = { '5-match': [], '4-match': [], '3-match': [] };
    entries.forEach(e => {
      if (e.match_tier) winnersByTier[e.match_tier].push(e);
    });

    let remainingPool = totalPrizePool;
    const prizes: any = {};
    for (const tier of ['5-match', '4-match', '3-match']) {
      const share = tierShares[tier as keyof typeof tierShares];
      const tierPool = totalPrizePool * share;
      const winners = winnersByTier[tier];
      const perWinner = winners.length > 0 ? tierPool / winners.length : 0;
      prizes[tier] = { total: tierPool, perWinner, winnersCount: winners.length };
      remainingPool -= tierPool;
    }

    // Optional: remainingPool (due to rounding) could be added to jackpot

    // 6. Prepare result (including winners list for admin preview)
    const result = {
      drawType,
      winningNumbers,
      activeSubscribers: activeUsers.length,
      totalPrizePool: totalPrizePool.toFixed(2),
      winners: prizes,
      entries: entries.filter(e => e.is_winner).map(e => ({
        user_id: e.user_id,
        match_tier: e.match_tier,
        scores_used: e.scores_used,
      })),
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Simulation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}