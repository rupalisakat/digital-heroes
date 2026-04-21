'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ScoresPage() {
  const [scores, setScores] = useState<any[]>([]);
  const [score, setScore] = useState('');
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');

  const fetchScores = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('scores')
      .select('score, date_played')
      .eq('user_id', user.id)
      .order('date_played', { ascending: false })
      .limit(5);
    setScores(data || []);
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage('You must be logged in');
      return;
    }

    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 1 || scoreNum > 45) {
      setMessage('Score must be between 1 and 45');
      return;
    }
    if (!date) {
      setMessage('Please select a date');
      return;
    }

    // Check for duplicate date
    const { data: existing } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', user.id)
      .eq('date_played', date)
      .maybeSingle();

    if (existing) {
      setMessage('You already entered a score for this date');
      return;
    }

    // Insert new score
    const { error: insertError } = await supabase
      .from('scores')
      .insert({ user_id: user.id, score: scoreNum, date_played: date });

    if (insertError) {
      setMessage('Error: ' + insertError.message);
      return;
    }

    // Fetch all user scores to enforce "last 5"
    const { data: allScores } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', user.id)
      .order('date_played', { ascending: false });

    if (allScores && allScores.length > 5) {
      const toDelete = allScores.slice(5);
      await supabase.from('scores').delete().in('id', toDelete.map(s => s.id));
    }

    setMessage('✅ Score saved!');
    setScore('');
    setDate('');
    fetchScores();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Log Your Scores</h1>
      <p className="text-gray-500 mt-1">Enter your Stableford points (1–45) – only your last 5 scores count</p>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="number"
              min="1"
              max="45"
              placeholder="Score (1-45)"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
              required
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200"
              required
            />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700">
              Save Score
            </button>
            {message && <p className="text-sm text-center text-gray-600">{message}</p>}
          </form>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-semibold">Your Last 5 Scores</h2>
          {scores.length === 0 ? (
            <p className="text-gray-500 mt-4">No scores yet. Enter your first round!</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {scores.map((s, idx) => (
                <li key={idx} className="flex justify-between border-b pb-2">
                  <span>{s.date_played}</span>
                  <span className="font-bold">{s.score} points</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}