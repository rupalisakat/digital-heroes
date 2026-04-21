'use client';
import { useState } from 'react';

export default function DrawsAdmin() {
  const [drawType, setDrawType] = useState('random');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const simulateDraw = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/draws/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drawType }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  const publishDraw = async () => {
    if (!result) return;
    setPublishing(true);
    const res = await fetch('/api/admin/draws/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drawType: result.drawType,
        winningNumbers: result.winningNumbers,
        totalPrizePool: result.totalPrizePool,
        winners: result.winners,
        entries: result.entries,
      }),
    });
    const data = await res.json();
    if (data.success) alert('Draw published successfully!');
    else alert('Error: ' + data.error);
    setPublishing(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Draw Management</h1>
      <div className="mt-6 bg-white p-6 rounded-xl shadow-sm">
        <label className="block font-medium">Draw Logic</label>
        <select
          value={drawType}
          onChange={(e) => setDrawType(e.target.value)}
          className="mt-1 px-3 py-2 border rounded"
        >
          <option value="random">Random (Lottery style)</option>
          <option value="algorithmic">Algorithmic (Weighted by frequent scores)</option>
        </select>
        <div className="mt-4 flex gap-4">
          <button
            onClick={simulateDraw}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Simulating...' : 'Simulate Draw'}
          </button>
          {result && (
            <button
              onClick={publishDraw}
              disabled={publishing}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish Draw'}
            </button>
          )}
        </div>

        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h2 className="font-bold">Simulation Result</h2>
            <p><strong>Winning Numbers:</strong> {result.winningNumbers?.join(', ')}</p>
            <p><strong>Active Subscribers:</strong> {result.activeSubscribers}</p>
            <p><strong>Total Prize Pool:</strong> ${result.totalPrizePool}</p>
            <hr className="my-2" />
            <h3 className="font-semibold">Winners</h3>
            <ul>
              <li>5-match: {result.winners?.['5-match']?.winnersCount} winners (${result.winners?.['5-match']?.perWinner?.toFixed(2)} each)</li>
              <li>4-match: {result.winners?.['4-match']?.winnersCount} winners (${result.winners?.['4-match']?.perWinner?.toFixed(2)} each)</li>
              <li>3-match: {result.winners?.['3-match']?.winnersCount} winners (${result.winners?.['3-match']?.perWinner?.toFixed(2)} each)</li>
            </ul>
            {result.entries?.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer text-blue-600">Show winner details</summary>
                <pre className="text-xs mt-2">{JSON.stringify(result.entries, null, 2)}</pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}