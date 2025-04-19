import { useEffect, useState, useMemo } from 'react';
import type { MarketOrderBook,PriceChangeEvent, OrderBookNameToId } from "../interfaces/orderBookInterfaces";
import type { EventDisplayerProps } from "../interfaces/marketInterfaces";
import { ChevronDown, ChevronUp } from 'lucide-react';

//type guard
function isFullBookEvent(data: any): data is MarketOrderBook {
  return data.event_type === "book" && Array.isArray(data.bids) && Array.isArray(data.asks);
}

function isPriceChangeEvent(data: any): data is PriceChangeEvent {
  return data.event_type === "price_change" && Array.isArray(data.changes);
}

const formatCents = (price: number): string => {
  return `${(price*100).toLocaleString('en-US', { maximumFractionDigits: 2 })}¢`;
};
const formatDollar = (value: number): string => {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

const formatShares = (value: number): string => {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export default function OrderBook({ event }: EventDisplayerProps) {
    const [orderBooks, setOrderBooks] = useState<Record<string, MarketOrderBook>>({});
    const [loaded, setLoaded] = useState(false);
    const [loadSize, setLoadSize] = useState(10);
    const orderMarkets: OrderBookNameToId[] = event.markets.filter(market => !market.closed && market.outcomePrices !== undefined 
                                                && market.clobTokenIds.length > 0 && market.groupItemTitle !== undefined)
                                            .map(market => {
                                                const obj:OrderBookNameToId = {
                                                    name: market.groupItemTitle!, 
                                                    id: JSON.parse(market.clobTokenIds)[0]
                                                }
                                                return obj;
                                            });

    useEffect(() => {
        const ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/market');

        ws.onopen = () => {
        ws.send(JSON.stringify({
            "assets_ids": orderMarkets.map(market => market.id),
            "type": "market"
        }));
        };

        ws.onmessage = (event) => { 
        const data = JSON.parse(event.data);
        for (const event of data) {
            if (isFullBookEvent(event)) {
                const newOrderBook: MarketOrderBook = {
                    market: event.market,
                    asset_id: event.asset_id,
                    timestamp: event.timestamp,
                    hash: event.hash,
                    bids: event.bids,
                    asks: event.asks
                };
        
                setOrderBooks(prev => ({
                    ...prev,
                    [event.asset_id]: newOrderBook
                }));
                setLoaded(true);
            } else if (isPriceChangeEvent(event)) {
                const { market, asset_id, changes } = event;
                setOrderBooks(prev => {
                    const book = prev[asset_id];
                    if (!book) return prev;

                    const updatedBids = [...book.bids];
                    const updatedAsks = [...book.asks];

                    for (const change of changes) {
                        const price = parseFloat(change.price);
                        const size = parseFloat(change.size);
                        const side = change.side.toUpperCase();

                        const target = side === "BUY" ? updatedBids : updatedAsks;
                        const rounded = (n: number) => Math.round(n * 1e5) / 1e5; 
                        const normalizedPrice = rounded(price);
                        const existingIndex = target.findIndex(entry => rounded(entry.price) === normalizedPrice);

                        if (size === 0) {
                            if (existingIndex !== -1) {
                                target.splice(existingIndex, 1);
                            }
                        } else {
                            if (existingIndex !== -1) {
                                target[existingIndex].size = size;
                            } else {
                                target.push({ price, size });
                            }
                        }
                    }

                    return {
                    ...prev,
                    [asset_id]: {
                        ...book,
                        bids: updatedBids,
                        asks: updatedAsks,
                        timestamp: event.timestamp,
                        hash: event.hash,
                    }
                    };
                });
            } else {
                console.warn("Unknown event type:", event);
            }
        }
        }
    },[])

    return (
    <div className="w-full p-4 space-y-6"> 
        {!loaded ? <div/> :
        ( 
            orderMarkets.map((OrderBookNameToId) => {
            const bookName = OrderBookNameToId.name;
            const assetId = OrderBookNameToId.id;
            const book = orderBooks[assetId];

            const sortedBids = book ? [...book.bids].sort((a, b) => b.price - a.price) : [];
            const sortedAsks = book ? [...book.asks].sort((a, b) => a.price - b.price) : [];
            const displayLength = book ? Math.max(sortedBids.length, sortedAsks.length) : 0;

            return (
            <div key={bookName} className="mb-8 w-full max-w-3xl mx-auto bg-white rounded shadow border border-gray-200 p-4">
                <h3 className="text-sm font-medium mb-3 text-center text-gray-600">Market: {bookName}</h3>

                {book ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-xs text-gray-500 font-normal">
                        <th className="px-3 py-1 text-left font-normal w-1/4">BID PRICE</th>
                        <th className="px-3 py-1 text-right font-normal w-1/4">BID SIZE</th>
                        <th className="px-3 py-1 text-right font-normal w-1/4">BID TOTAL</th>
                        <th className="px-3 py-1 text-left font-normal w-1/4">ASK PRICE</th>
                        <th className="px-3 py-1 text-right font-normal w-1/4">ASK SIZE</th>
                        <th className="px-3 py-1 text-right font-normal w-1/4">ASK TOTAL</th>
                        </tr>
                    </thead>

                    <tbody>
                        {Array.from({ length: Math.min(displayLength, loadSize) }).map((_, i) => { 
                        const bid = sortedBids[i]; 
                        const ask = sortedAsks[i]; 

                        return (
                            <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                            {/* Bid Price Cell */}
                            <td className={`px-3 py-1 ${bid ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                {bid ? formatCents(bid.price) : '-'}
                            </td>
                            {/* Bid Size Cell */}
                            <td className={`px-3 py-1 text-right ${bid ? 'text-gray-800' : 'text-gray-400'}`}>
                                {bid ? formatShares(bid.size) : '-'}
                            </td>
                            {/* Bid Size Volume */}
                            <td className={`px-3 py-1 text-right ${bid ? 'text-gray-800' : 'text-gray-400'}`}>
                                {bid ? formatDollar(bid.size * bid.price) : '-'}
                            </td>
                            {/* Ask Price Cell */}
                            <td className={`px-3 py-1 ${ask ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                                {ask ? formatCents(ask.price) : '-'}
                            </td>
                            {/* Ask Size Cell */}
                            <td className={`px-3 py-1 text-right ${ask ? 'text-gray-800' : 'text-gray-400'}`}>
                                {ask ? formatShares(ask.size) : '-'}
                            </td>
                            {/* Bid Size Volume */}
                            <td className={`px-3 py-1 text-right ${bid ? 'text-gray-800' : 'text-gray-400'}`}>
                                {ask ? formatDollar(ask.size * ask.price) : '-'}
                            </td>
                            </tr>
                        );
                        })}
                    </tbody>
                    </table>
                </div>
                ) : (
                // Styled Loading State
                <div className="text-gray-500 text-center py-10">Loading Order Book...</div>
                )}
                <div onClick={(e) => {
                    e.stopPropagation();
                    setLoadSize(loadSize == 10 ? 20 : 10);
                }} className="flex items-center justify-center">
                    {loadSize == 10 ? <ChevronDown/> : <ChevronUp/> }
                </div>
            </div>
            );
        })
    )}
    </div>
  );
}
