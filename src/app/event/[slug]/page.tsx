'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import type { EventDisplayerProps, PolymarketEvent } from '@/interfaces/marketInterfaces';
import EventDisplayer from '@/components/EventDisplayer';
import ShowPriceHistory from '@/components/ShowPriceHistory';
import OrderBook from '@/components/orderBook';
import TopHolder from '@/components/topholder';
import { formatVolume, formatDecimal } from '@/helpTS/formatNumber';

function PageHeader({ event }: EventDisplayerProps) {
  // Calculate total and 24hr volumes
  const { totalVolume, volume24h } = event.markets.reduce((acc, market) => {
    const vol = parseFloat(market.volume) || 0;
    const vol24 = parseFloat(market.volume24hr) || 0;
    return {
      totalVolume: acc.totalVolume + vol,
      volume24h: acc.volume24h + vol24
    };
  }, { totalVolume: 0, volume24h: 0 });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex gap-6 items-start">
        {/* Left side: Image */}
        {event.image && (
          <img 
            src={event.image} 
            alt={event.title}
            className="w-24 h-24 object-cover rounded-lg"
          />
        )}

        {/* Right side: Title and accessory info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
          
          {/* Accessory information */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex flex-col">
              <span className="font-medium">Total Volume</span>
              <span className="text-gray-900">{formatVolume(totalVolume.toString())}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">24h Volume</span>
              <span className="text-gray-900">{formatVolume(volume24h.toString())}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">Created</span>
              <span className="text-gray-900">{new Date(event.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">Ends</span>
              <span className="text-gray-900">{new Date(event.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Update OrderState interface
interface OrderState {
  marketId: string | null;
  outcome: 'yes' | 'no' | null;
  marketTitle: string | null;
  yesPrice: string | null;
  noPrice: string | null;
  image: string | null;
}

// Update Markets component props
interface MarketsProps extends EventDisplayerProps {
  orderRef: React.MutableRefObject<OrderState>;
  updateOrder: (newState: OrderState) => void;
}

function Markets({event, orderRef, updateOrder}: MarketsProps) {
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orderbook' | 'topholders'>('orderbook');
  const [websockets, setWebsockets] = useState<WebSocket[]>([]);
  const [currentWebSocket, setCurrentWebSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    // TODO: Close all websockets except the current one
  }, [activeTab, currentWebSocket]);

  const handleWebSocketCreated = (ws: WebSocket) => {
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Markets</h1>
      <div className="space-y-4">
        {event.markets.filter(market => !market.closed && market.restricted && market.active).map((market) => (
          <div key={market.id}>
            <div 
              className="flex items-center gap-4 p-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-50"
              onClick={() => setSelectedMarket(selectedMarket === market.id ? null : market.id)}
            >
              {/* Left side: Market info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {market.image ? (
                    <img 
                      src={market.image} 
                      alt={market.groupItemTitle}
                      className="w-6 h-6 object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-xs">M</span>
                    </div>
                  )}
                  <h2 className="text-base font-semibold text-gray-900">{market.groupItemTitle}</h2>
                </div>
                <div className="ml-8 text-xs text-gray-500">
                  <span>Volume: {formatVolume(market.volume)}</span>
                  <span className="ml-2">24h: {formatVolume(market.volume24hr)}</span>
                </div>
              </div>

              {/* Right side: Yes/No buttons */}
              <div className="flex gap-2">
                <button 
                  className="px-4 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors" 
                  onClick={(e) => {
                    if (selectedMarket !== market.id) {
                      setSelectedMarket(market.id);
                    } else {
                      e.stopPropagation();
                    }
                    const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) : ['0', '0'];
                    updateOrder({
                      marketId: market.id,
                      outcome: 'yes',
                      marketTitle: market.groupItemTitle || '',
                      yesPrice: prices[0],
                      noPrice: prices[1],
                      image: market.image || null
                    });
                  }}
                >
                  <div className="text-xs font-medium">Yes</div>
                  <div className="text-base font-bold">
                    {market.outcomePrices ? formatDecimal(parseFloat(JSON.parse(market.outcomePrices)[0]),'¢') : 'N/A'}
                  </div>
                </button>
                <button 
                  className="px-4 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors" 
                  onClick={(e) => {
                    if (selectedMarket !== market.id) {
                      setSelectedMarket(market.id);
                    } else {
                      e.stopPropagation();
                    }
                    const prices = market.outcomePrices ? JSON.parse(market.outcomePrices) : ['0', '0'];
                    updateOrder({
                      marketId: market.id,
                      outcome: 'no',
                      marketTitle: market.groupItemTitle || '',
                      yesPrice: prices[0],
                      noPrice: prices[1],
                      image: market.image || null
                    });
                  }}
                >
                  <div className="text-xs font-medium">No</div>
                  <div className="text-base font-bold">
                    {market.outcomePrices ? formatDecimal(parseFloat(JSON.parse(market.outcomePrices)[1]),'¢') : 'N/A'}
                  </div>
                </button>
              </div>
            </div>

            {/* Tabs for OrderBook and TopHolder */}
            {selectedMarket === market.id && (
              <div className="mt-2">
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Market Description</h3>
                  <p className="text-sm text-gray-600">
                    {market.description || 'No description available for this market.'}
                  </p>
                </div>
                <div className="border rounded-lg">
                  <div className="flex border-b">
                    <button
                      className={`flex-1 px-4 py-2 text-sm font-medium ${
                        activeTab === 'orderbook' 
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('orderbook')}
                    >
                      Order Book
                    </button>
                    <button
                      className={`flex-1 px-4 py-2 text-sm font-medium ${
                        activeTab === 'topholders'
                          ? 'border-b-2 border-blue-500 text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('topholders')}
                    >
                      Top Holders
                    </button>
                  </div>
                  <div className="p-4">
                    {activeTab === 'orderbook' ? (
                      <OrderBook event={{ ...event, markets: [market] }} />
                    ) : (
                      <TopHolder event={{ ...event, markets: [market] }} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Update OrderManager component props
interface OrderManagerProps extends EventDisplayerProps {
  orderRef: React.MutableRefObject<OrderState>;
  updateTrigger: number;
}

function OrderManager({event, orderRef, updateTrigger}: OrderManagerProps) {
  useEffect(() => {
    // This effect will run whenever updateTrigger changes
  }, [updateTrigger]);

  return (
    <div className="fixed top-0 right-0 w-96 h-screen bg-white shadow-lg p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Header with icon and title */}
        <div className="flex items-center gap-3">
          {orderRef.current.image ? (
            <img 
              src={orderRef.current.image} 
              alt={orderRef.current.marketTitle || ''}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-500 text-xs">M</span>
            </div>
          )}
          <h2 className="text-xl font-semibold">{orderRef.current.marketTitle || 'Select a market'}</h2>
        </div>

        {/* Buy/Sell tabs */}
        <div className="flex gap-4 border-b">
          <button className="px-4 py-2 font-semibold border-b-2 border-black">Buy</button>
          <button className="px-4 py-2 text-gray-500">Sell</button>
        </div>

        {/* Yes/No buttons */}
        <div className="flex gap-4">
          <button className={`flex-1 py-4 rounded-lg font-semibold ${
            orderRef.current.outcome === 'yes' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            Yes {orderRef.current.yesPrice ? formatDecimal(parseFloat(orderRef.current.yesPrice), '¢') : 'N/A'}
          </button>
          <button className={`flex-1 py-4 rounded-lg font-semibold ${
            orderRef.current.outcome === 'no' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            No {orderRef.current.noPrice ? formatDecimal(parseFloat(orderRef.current.noPrice), '¢') : 'N/A'}
          </button>
        </div>

        {/* Limit Price */}
        <div className="space-y-2">
          <label className="font-semibold">Limit Price</label>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 bg-gray-100 rounded-lg">-</button>
            <input type="text" value="32¢" className="flex-1 text-center border rounded-lg py-2" readOnly />
            <button className="w-8 h-8 bg-gray-100 rounded-lg">+</button>
          </div>
        </div>

        {/* Shares */}
        <div className="space-y-2">
          <label className="font-semibold">Shares</label>
          <input type="text" className="w-full border rounded-lg py-2 px-3" placeholder="Enter amount" />
          <div className="flex gap-2">
            <button className="flex-1 py-1 bg-gray-100 rounded-lg">-10</button>
            <button className="flex-1 py-1 bg-gray-100 rounded-lg">+10</button>
          </div>
        </div>

        {/* Set Expiration Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Set Expiration</span>
          <div className="w-12 h-6 bg-gray-200 rounded-full"></div>
        </div>

        {/* Total and To Win */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total</span>
            <span className="text-blue-600">$0</span>
          </div>
          <div className="flex justify-between">
            <span>To Win 💵</span>
            <span className="text-green-600">$0</span>
          </div>
        </div>

        {/* Place Order Button */}
        <button className="w-full py-3 bg-gray-200 text-gray-500 rounded-lg font-semibold">
          Unavailable
        </button>

        {/* Terms */}
        <p className="text-center text-sm text-gray-500">
          By trading, you agree to the Terms of Use.
        </p>
      </div>
    </div>
  );
}

export default function EventPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<PolymarketEvent | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Create the order ref
  const orderRef = useRef<OrderState>({
    marketId: null,
    outcome: null,
    marketTitle: null,
    yesPrice: null,
    noPrice: null,
    image: null
  });

  // Function to update order state and trigger re-render
  const updateOrder = (newState: OrderState) => {
    orderRef.current = newState;
    setUpdateTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        console.log('Making request to:', `/api/events?slug=${slug}`);
        const response = await fetch(`/api/events?slug=${slug}`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        //we can ensure the taht we only call one event now
        setEventData(data[0]); // Assuming the API returns an array and we want the first item
      } catch (error) {
        console.error('Error fetching event data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Event not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-1 py-2 pr-[384px]">
        <div className="space-y-8">
          {/* Page Header */}
          {eventData && <PageHeader event={eventData} />}

          {/* Price History */}
          <div className="bg-white rounded-lg shadow p-4">
            <ShowPriceHistory event={eventData} />
          </div>

          {/* Markets with integrated OrderBook and TopHolder tabs */}
          {eventData && (
            <Markets 
              event={eventData} 
              orderRef={orderRef}
              updateOrder={updateOrder}
            />
          )}
        </div>
      </main>
      
      {/* Order Manager */}
      {eventData && (
        <OrderManager 
          event={eventData} 
          orderRef={orderRef}
          updateTrigger={updateTrigger}
        />
      )}
    </div>
  );
}

