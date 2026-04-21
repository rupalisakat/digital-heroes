'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function CharityPage() {
  const [charities, setCharities] = useState<any[]>([]);
  const [selectedCharity, setSelectedCharity] = useState('');
  const [percentage, setPercentage] = useState(10);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: charityList } = await supabase.from('charities').select('*');
      setCharities(charityList || []);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('selected_charity_id, charity_percentage').eq('id', user.id).single();
        if (profile) {
          setSelectedCharity(profile.selected_charity_id || '');
          setPercentage(profile.charity_percentage || 10);
        }
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ selected_charity_id: selectedCharity, charity_percentage: percentage }).eq('id', user.id);
    setMessage(error ? 'Error saving' : 'Saved!');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Support a Charity</h1>
      <p className="text-gray-500 mt-1">At least 10% of your subscription goes to your chosen cause.</p>
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <label className="block text-sm font-medium text-gray-700">Select Charity</label>
          <select value={selectedCharity} onChange={(e) => setSelectedCharity(e.target.value)} className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200">
            <option value="">-- Choose a charity --</option>
            {charities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <label className="block text-sm font-medium text-gray-700 mt-4">Donation Percentage</label>
          <input type="number" min="10" max="100" value={percentage} onChange={(e) => setPercentage(Number(e.target.value))} className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200" />
          <p className="text-xs text-gray-500 mt-1">Minimum 10% of your subscription fee</p>
          <button onClick={handleSave} className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-medium">Save Charity Choice</button>
          {message && <p className="text-sm text-center mt-2 text-green-600">{message}</p>}
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-semibold">Featured Charity</h2>
          {charities.filter(c => c.featured).map(f => (
            <div key={f.id} className="mt-4"><h3 className="font-medium">{f.name}</h3><p className="text-gray-500 text-sm">{f.description}</p></div>
          ))}
          {charities.filter(c => c.featured).length === 0 && <p className="text-gray-500 mt-2">No featured charity yet.</p>}
        </div>
      </div>
    </div>
  );
}
