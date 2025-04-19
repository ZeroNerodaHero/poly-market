'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import type { PolymarketEvent, EventDisplayerProps } from '@/interfaces/marketInterfaces';
import EventDisplayer from '@/components/EventDisplayer';

function TempManageEvent({ event }: EventDisplayerProps){
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/event/${event.slug}`);
  };

  return (
    <div onClick={handleClick}>
      <EventDisplayer event={event} />
    </div>
  )
}

export default function Home() {
  const [events, setEvents] = useState<PolymarketEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<PolymarketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const response = await fetch('/api/polymarket_event?closed=false&limit=10');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setEvents(data);
      setFilteredEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (slug: string) => {
    router.push(`/event/${slug}`);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading data...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Search Bar */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gray-50 pt-2 pb-1">
        <div className="w-[75%] mx-auto">
          <SearchBar 
            placeholder="Search events..." 
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* Main Content with padding for fixed search bar */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid gap-y-1">
            {filteredEvents.map((event, ind) => (
              <TempManageEvent key={ind} event={event} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}