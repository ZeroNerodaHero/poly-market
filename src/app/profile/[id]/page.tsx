'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Position } from '@/interfaces/marketInterfaces';
import { generateGradient } from '@/helpTS/generateGradient';
import { formatVolume, formatDecimal } from '@/helpTS/formatNumber';

interface ProfileData {
  positions: Position[];
  volume: number;
  profit: number;
  trades: number;
  name: string;
  pseudonym: string;
  profileImage: string;
  bio: string;
}

export default function ProfilePage() {
  const params = useParams();
  const address = params.id as string;
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Fetch positions
        const positionsResponse = await fetch(
          `https://data-api.polymarket.com/positions?user=${address}&sortBy=CURRENT&sortDirection=DESC&sizeThreshold=.1&limit=50&offset=0`
        );
        if (!positionsResponse.ok) throw new Error('Failed to fetch positions');
        const positions = await positionsResponse.json();

        // Fetch volume and profile info
        const volumeResponse = await fetch(
          `https://lb-api.polymarket.com/volume?window=all&limit=1&address=${address}`
        );
        if (!volumeResponse.ok) throw new Error('Failed to fetch volume');
        const volumeData = await volumeResponse.json();
        const volume = volumeData[0]?.amount || 0;
        const { name, pseudonym, profileImage, bio } = volumeData[0] || {};

        // Fetch profit
        const profitResponse = await fetch(
          `https://lb-api.polymarket.com/profit?window=all&limit=1&address=${address}`
        );
        if (!profitResponse.ok) throw new Error('Failed to fetch profit');
        const profitData = await profitResponse.json();
        const profit = profitData[0]?.amount || 0;

        // Fetch trades
        const tradesResponse = await fetch(
          `https://data-api.polymarket.com/traded?user=${address}`
        );
        if (!tradesResponse.ok) throw new Error('Failed to fetch trades');
        const tradesData = await tradesResponse.json();
        const trades = tradesData.traded || 0;

        setData({
          positions,
          volume,
          profit,
          trades,
          name,
          pseudonym,
          profileImage,
          bio
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [address]);

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8">No data found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-6 mb-6">
          {data.profileImage ? (
            <img 
              src={data.profileImage} 
              alt={data.name || data.pseudonym}
              className="w-24 h-24 object-cover rounded-full"
            />
          ) : (
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold"
              style={{ background: generateGradient(data.name || data.pseudonym) }}
            >
              {(data.name || data.pseudonym)[0].toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {data.name || data.pseudonym}
            </h1>
            {data.pseudonym && data.name && (
              <p className="text-gray-500">@{data.pseudonym}</p>
            )}
            {data.bio && (
              <p className="mt-2 text-gray-600">{data.bio}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Total Volume</div>
            <div className="text-xl font-bold">{formatVolume(data.volume.toString())}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Total Profit</div>
            <div className={`text-xl font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatVolume(data.profit.toString())}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Total Trades</div>
            <div className="text-xl font-bold">{data.trades.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Positions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Current Positions</h2>
        {data.positions.map((position) => (
          <div key={position.asset} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-4">
              {position.icon && (
                <img 
                  src={position.icon} 
                  alt={position.title}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium">{position.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sm">
                    <span className="text-gray-500">Position:</span>{' '}
                    <span className={position.outcome === 'Yes' ? 'text-green-600' : 'text-red-600'}>
                      {position.outcome}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Size:</span>{' '}
                    <span className="font-medium">{position.size.toFixed(2)}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Avg Price:</span>{' '}
                    <span className="font-medium">{formatDecimal(position.avgPrice, '¢')}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Current Value:</span>{' '}
                    <span className="font-medium">{formatVolume(position.currentValue.toString())}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">P/L:</span>{' '}
                    <span className={position.cashPnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatVolume(position.cashPnl.toString())} ({formatDecimal(position.percentPnl)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 