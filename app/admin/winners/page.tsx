'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function WinnersAdmin() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayouts = async () => {
    const { data } = await supabase
      .from('payouts')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });
    setPayouts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const verifyWinner = async (payoutId: string, status: 'approved' | 'rejected', proofUrl?: string) => {
    const { error } = await supabase
      .from('payouts')
      .update({
        payment_status: status === 'approved' ? 'paid' : 'rejected',
        proof_image_url: proofUrl,
        paid_at: status === 'approved' ? new Date().toISOString() : null,
      })
      .eq('id', payoutId);
    if (error) alert('Error updating');
    else fetchPayouts();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold">Winner Verification</h1>
      {payouts.length === 0 ? (
        <p className="mt-4 text-gray-500">No payouts yet. Run a draw with winners first.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {payouts.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex justify-between">
                <div>
                  <p><strong>User:</strong> {p.profiles?.full_name || p.user_id}</p>
                  <p><strong>Tier:</strong> {p.tier}</p>
                  <p><strong>Amount:</strong> ${p.amount}</p>
                  <p><strong>Status:</strong> <span className={`capitalize ${p.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{p.payment_status}</span></p>
                </div>
                {p.payment_status === 'pending' && (
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        const proof = prompt('Enter screenshot URL (or leave empty):');
                        verifyWinner(p.id, 'approved', proof || undefined);
                      }}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Approve & Pay
                    </button>
                    <button
                      onClick={() => verifyWinner(p.id, 'rejected')}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}