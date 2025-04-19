// app/api/polymarket/route.ts
import { NextResponse } from 'next/server';

//send in condition id
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || 'false';
    const limit = searchParams.get('limit') || '1';

    const apiUrl = `https://data-api.polymarket.com/holders?market=${market}&limit=30`;
    console.log(apiUrl)
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