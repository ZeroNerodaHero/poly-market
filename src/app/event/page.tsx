'use client';
import { useEffect, useState } from 'react';

export default function EventPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial setup or data fetching can go here
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Event Page</h1>
          
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Your content will go here</p>
          </div>
        </div>
      </main>
    </div>
  );
} 