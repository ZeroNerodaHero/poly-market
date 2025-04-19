import { useEffect, useState } from 'react';
import ResponsiveMultiLineChart from '@/components/graphvisualizer';

import type { InputDataset, MarketPriceHistory } from '@/interfaces/graphvisulizer/pricehistorytype';
import type { PolymarketEvent, EventDisplayerProps } from '@/interfaces/marketInterfaces';

export default function ShowPriceHistory({ event }: EventDisplayerProps){
    const [chartDatasets, setChartDatasets] = useState<InputDataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
  
    // Create a map of clobTokenIds to groupItemTitles
    const marketMap = new Map<string, string>();
    event.markets.forEach(market => {
      if (!market.closed && market.outcomePrices !== undefined && market.clobTokenIds.length > 0 && market.groupItemTitle) {
        const clobTokenId = JSON.parse(market.clobTokenIds)[0];
        marketMap.set(clobTokenId, market.groupItemTitle);
      }
    });
  
    var marketIds: string[] = Array.from(marketMap.keys());
  
    useEffect(() => {
      if (marketIds.length === 0) {
          setLoading(false);
          setChartDatasets([]);
          return;
      }
  
      const fetchAllData = async () => {
        setLoading(true);
        setError(null);
        setChartDatasets([]); // Reset datasets on new fetch
  
        try {
          // 1. Create an array of fetch promises
          const fetchPromises = marketIds.map(id => {
            const apiUrl = `/api/pricehistory?clobTokenIds=${id}&fidelity=720`;
            return fetch(apiUrl);
          });
  
          // 2. Wait for all fetch requests to get responses
          const responses = await Promise.all(fetchPromises);
  
          // 3. Check if any response failed
          const failedResponse = responses.find(res => !res.ok);
          if (failedResponse) {
            let errorMsg = `HTTP error! status: ${failedResponse.status}`;
            try {
              const errorBody = await failedResponse.json();
              errorMsg += `: ${JSON.stringify(errorBody)}`;
            } catch { /* Ignore if error body isn't JSON */ }
            throw new Error(errorMsg);
          }
  
          // 4. Parse JSON bodies for all successful responses
          const jsonPromises = responses.map(res => res.json());
          const results = await Promise.all(jsonPromises);
  
          // 5. Process the results and format them into InputDataset[]
          const datasets: InputDataset[] = results.map((data, index) => {
            const marketId = marketIds[index]; // Get corresponding market ID
            const priceArray = data.history;   // Access the 'history' array
            const marketName = marketMap.get(marketId) || `Market ${marketId.substring(0, 6)}...`;
  
            // Validate and create dataset object
            if (Array.isArray(priceArray)) {
              return {
                name: marketName,
                data: priceArray as MarketPriceHistory[]
              };
            } else {
              console.warn(`API response for market ID ${marketId} did not contain a 'history' array:`, data);
              return null;
            }
          }).filter((dataset): dataset is InputDataset => dataset !== null);
  
          setChartDatasets(datasets);
  
        } catch (err) {
          console.error("Failed to fetch market data:", err);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setChartDatasets([]);
        } finally {
          setLoading(false);
        }
      };
  
      fetchAllData();
    }, []); 
  
    if (loading) return <div className="p-8">Loading data...</div>;
    if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  
    return (
      <div>
        <ResponsiveMultiLineChart datasets={chartDatasets} />
      </div>
    );
  }