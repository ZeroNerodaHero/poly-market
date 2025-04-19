// app/api/polymarket/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('clobTokenIds') || 'false';
    //this gives the update interval in minutes
    const fidelity = searchParams.get('fidelity') || '720';

    const apiUrl = `https://clob.polymarket.com/prices-history?interval=all&market=${market}&fidelity=${fidelity}`;
    const response = await fetch(apiUrl);

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Polymarket proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Polymarket data' },
      { status: 500 }
    );
  }
}