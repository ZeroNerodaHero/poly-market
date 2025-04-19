import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First fetch the event details
    const eventResponse = await fetch(`https://strapi-matic.poly.market/api/polymarket-events/${params.id}?populate=*`);
    console.log('Event Response:', eventResponse);
    if (!eventResponse.ok) {
      throw new Error(`HTTP error! status: ${eventResponse.status}`);
    }
    
    const eventData = await eventResponse.json();

    // Then fetch the markets for this event
    const marketsResponse = await fetch(`https://strapi-matic.poly.market/api/polymarket-markets?filters[event][id][$eq]=${params.id}&populate=*`);
    
    if (!marketsResponse.ok) {
      throw new Error(`HTTP error! status: ${marketsResponse.status}`);
    }
    
    const marketsData = await marketsResponse.json();

    // Combine the data
    const combinedData = {
      ...eventData.data,
      markets: marketsData.data
    };

    return NextResponse.json(combinedData);
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
} 