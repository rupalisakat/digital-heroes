'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestScorePage() {
  const [result, setResult] = useState('');

  const testSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setResult('Not logged in');
      return;
    }
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: 30, date_played: '2026-04-21' })
    });
    const data = await res.json();
    setResult(JSON.stringify(data, null, 2));
  };

  return (
    <div className="p-8">
      <h1>Test Score API</h1>
      <button onClick={testSave} className="bg-blue-600 text-white px-4 py-2 rounded">Test Save Score</button>
      <pre className="mt-4 bg-gray-100 p-4 rounded">{result}</pre>
    </div>
  );
}