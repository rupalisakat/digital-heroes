'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function WinnersPage() {
  const [winnings, setWinnings] = useState<any[]>([]);

  useEffect(() => {
    const fetchWinnings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('payouts')
          .select('draw_id, tier, amount, payment_status')
          .eq('user_id', user.id);
        setWinnings(data || []);
      }
    };
    fetchWinnings();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Your Winnings</h1>
      {winnings.length === 0 ? (
        <p className="text-gray-500 mt-4">No winnings yet. Keep playing!</p>
      ) : (
        <div className="mt-6 space-y-4">
          {winnings.map((w, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm flex justify-between">
              <div>
                <span className="font-medium capitalize">{w.tier}</span>
                <span className="text-gray-500 ml-2">Draw #{w.draw_id.slice(0,8)}</span>
              </div>
              <div>
                <span className="font-bold text-green-600">${w.amount}</span>
                <span className={`ml-2 text-sm px-2 py-1 rounded ${w.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {w.payment_status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}