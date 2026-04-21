'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function DashboardHome() {
  const [profile, setProfile] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(profileData);
        const { data: scoresData } = await supabase.from('scores').select('score, date_played').eq('user_id', user.id).order('date_played', { ascending: false }).limit(5);
        setScores(scoresData || []);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Welcome, {profile?.full_name || 'Hero'}!</h1>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-semibold">Subscription Status</h2>
          <p className="text-2xl font-bold mt-2 capitalize">{profile?.subscription_status || 'Inactive'}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-semibold">Recent Scores</h2>
          {scores.length === 0 ? <p className="text-gray-500 mt-2">No scores yet</p> : (
            <ul className="mt-2 space-y-1">
              {scores.map((s, i) => <li key={i}>{s.date_played}: {s.score} points</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
