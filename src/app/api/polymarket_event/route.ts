// app/api/polymarket/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const closed = searchParams.get('closed') || 'false';
    const limit = searchParams.get('limit') || '1';

    const apiUrl = `https://gamma-api.polymarket.com/events?closed=${closed}&limit=${limit}`;
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