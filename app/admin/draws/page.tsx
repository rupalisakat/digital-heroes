'use client';
import { useState } from 'react';

export default function DrawsAdmin() {
  const [drawType, setDrawType] = useState('random');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const simulateDraw = async () => {
    try {
      setLoading(true);

      // ⚠️ Temporary dummy data (API avoid केलं)
      const dummyData = {
        winningNumbers: [5, 12, 18, 23, 30],
        activeSubscribers: 120,
        totalPrizePool: 5000,
        winners: {
          '5-match': { winnersCount: 1, perWinner: 2000 },
          '4-match': { winnersCount: 3, perWinner: 500 },
          '3-match': { winnersCount: 10, perWinner: 100 },
        },
      };

      setTimeout(() => {
        setResult(dummyData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
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
          <option value="algorithmic">Algorithmic (Weighted)</option>
        </select>

        <div className="mt-4">
          <button
            onClick={simulateDraw}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? 'Simulating...' : 'Simulate Draw'}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h2 className="font-bold">Simulation Result</h2>

            <p>
              <strong>Winning Numbers:</strong>{' '}
              {result.winningNumbers.join(', ')}
            </p>

            <p>
              <strong>Active Subscribers:</strong>{' '}
              {result.activeSubscribers}
            </p>

            <p>
              <strong>Total Prize Pool:</strong> $
              {result.totalPrizePool}
            </p>

            <hr className="my-2" />

            <h3 className="font-semibold">Winners</h3>

            <ul>
              <li>
                5-match: {result.winners['5-match'].winnersCount} winners ($
                {result.winners['5-match'].perWinner} each)
              </li>
              <li>
                4-match: {result.winners['4-match'].winnersCount} winners ($
                {result.winners['4-match'].perWinner} each)
              </li>
              <li>
                3-match: {result.winners['3-match'].winnersCount} winners ($
                {result.winners['3-match'].perWinner} each)
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}