export interface Order {
  price: number;
  size: number;
}

export interface MarketOrderBook {
  market: string;
  asset_id: string;
  timestamp: string;
  hash: string;
  bids: Order[];
  asks: Order[];
}

export type PriceChangeEntry = {
  price: string;
  side: "BUY" | "SELL" | "buy" | "sell" | "Buy" | "Sell";  // for safety
  size: string;
};

export type PriceChangeEvent = {
  market: string;
  asset_id: string;
  timestamp: string;
  hash: string;
  changes: PriceChangeEntry[];
  event_type: "price_change";
};

export type OrderBookNameToId = {
  name: string;
  id: string;
};