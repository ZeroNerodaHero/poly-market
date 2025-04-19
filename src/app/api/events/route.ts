import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug) {
    return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://gamma-api.polymarket.com/events?slug=${slug}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch event data' }, { status: 500 });
  }
} 