'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ShowPriceHistory from '@/components/ShowPriceHistory';
import OrderBook from '@/components/orderBook';
import TopHolder from '@/components/topholder';
import type { PolymarketEvent } from '@/interfaces/marketInterfaces';

export default function EventPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<PolymarketEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        console.log('Fetching event with slug:', slug);
        // Fetch event details using the slug
        const response = await fetch(
          `https://clob.polymarket.com/events?slug=${slug}`
        );
        console.log('Response status:', response.status);
        if (!response.ok) {
          console.error('Failed to fetch event:', response.statusText);
          throw new Error(`Failed to fetch event: ${response.statusText}`);
        }
        const eventData = await response.json();
        console.log('Event data:', eventData);
        
        if (!eventData || eventData.length === 0) {
          throw new Error('Event not found');
        }

        setEvent(eventData[0]);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [slug]);

  if (loading) return <div className="p-8">Loading event...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!event) return <div className="p-8">Event not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
       <div className="space-y-8 mt-4">
            <div className="bg-white rounded-lg shadow p-4">
              <ShowPriceHistory event={event}/>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <OrderBook event={event}/>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <TopHolder event={event}/>
            </div>
          </div>
    </div>
  );
} 