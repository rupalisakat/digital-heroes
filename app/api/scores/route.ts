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
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { score, date_played } = await request.json();

    if (typeof score !== 'number' || score < 1 || score > 45) {
      return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 400 });
    }
    if (!date_played) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    // Check duplicate date
    const { data: existing } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', user.id)
      .eq('date_played', date_played)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Score already entered for this date' }, { status: 400 });
    }

    // Insert new score
    const { data: newScore, error: insertError } = await supabase
      .from('scores')
      .insert({ user_id: user.id, score, date_played })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Enforce last 5 scores: delete oldest if more than 5
    const { data: allScores } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', user.id)
      .order('date_played', { ascending: false });

    if (allScores && allScores.length > 5) {
      const toDelete = allScores.slice(5);
      await supabase.from('scores').delete().in('id', toDelete.map(s => s.id));
    }

    return NextResponse.json(newScore, { status: 201 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: scores, error } = await supabase
      .from('scores')
      .select('score, date_played')
      .eq('user_id', user.id)
      .order('date_played', { ascending: false })
      .limit(5);

    if (error) throw error;
    return NextResponse.json(scores || []);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}