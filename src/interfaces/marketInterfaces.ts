export interface Market {
  id: string;
  question: string;
  outcomes: string;
  outcomePrices: string;
  volume: string;
  volume24hr: string;
  active: boolean;
  closed: boolean;
  restricted: boolean;
  image?: string;
  groupItemTitle?: string;
  description?: string;
  //this actually returns a string with two items in it 
  clobTokenIds: string;
  conditionId: string;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  endDate: string;
  markets: Market[];
  image?: string;
  slug: string;
}

export interface EventDisplayerProps {
    event: PolymarketEvent;  
}

export interface Position {
  asset: string;
  title: string;
  outcome: 'Yes' | 'No';
  size: number;
  avgPrice: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  icon?: string;
  slug?: string;
}