'use client';
import { useEffect, useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

import type {EventDisplayerProps } from '@/interfaces/marketInterfaces';
import { formatDecimal, formatVolume } from '@/helpTS/formatNumber';

export default function EventDisplayer({ event }: EventDisplayerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [itemsPerRow, setItemsPerRow] = useState(2);
    const openEvents = event.markets.filter(market => !market.closed && market.outcomePrices !== undefined);
  
    // Calculate total and 24hr volumes for the event
    const { totalVolume, volume24h } = openEvents.reduce((acc, market) => {
      const vol = parseFloat(market.volume) || 0;  // Use 0 if NaN
      const vol24 = parseFloat(market.volume24hr) || 0;  // Use 0 if NaN
      return {
        totalVolume: acc.totalVolume + vol,
        volume24h: acc.volume24h + vol24
      };
    }, { totalVolume: 0, volume24h: 0 });
  
    // Use useEffect to update itemsPerRow based on window width
    useEffect(() => {
      function updateItemsPerRow() {
        const width = window.innerWidth;
        if (width < 640) setItemsPerRow(2);        // mobile
        else if (width < 768) setItemsPerRow(3);   // sm
        else if (width < 1024) setItemsPerRow(4);  // md
        else setItemsPerRow(5);                     // lg
      }
  
      // Initial calculation
      updateItemsPerRow();
  
      // Update on window resize
      window.addEventListener('resize', updateItemsPerRow);
      return () => window.removeEventListener('resize', updateItemsPerRow);
    }, []);
  
    const displayedEvents = isExpanded ? openEvents : openEvents.slice(0, itemsPerRow);
    const hasMoreEvents = openEvents.length > itemsPerRow;
  
    return (
      <div key={event.id} className='p-3 rounded-lg shadow-md bg-gray-200 transition-colors duration-200 hover:bg-gray-300'>
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          {event.image && (
            <img 
              src={event.image} 
              alt={event.title}
              className="w-12 h-12 object-cover rounded-lg"
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-bold truncate">{event.title}</h1>
            <div className="flex items-center justify-between mt-1">
              <div className="text-xs text-gray-500">
                Closes: {new Date(event.endDate).toLocaleDateString()}
              </div>
              <div className="flex gap-3 text-sm">
                <div className="flex flex-col items-end">
                  <div className="font-medium">{formatVolume(totalVolume.toString())}</div>
                  <div className="text-xs text-gray-500">Total Volume</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-medium">{formatVolume(volume24h.toString())}</div>
                  <div className="text-xs text-gray-500">24h Volume</div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Markets Grid */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {openEvents.length > 0 ? (
              displayedEvents.map((market) => {
                const prices = JSON.parse(market.outcomePrices);
                return (
                  <div key={market.id} className="bg-gray-100 rounded-lg p-2 flex flex-col transition-colors duration-200 hover:bg-gray-200">
                    <div className="flex items-start gap-2 mb-2">
                      {market.image && (
                        <img 
                          src={market.image} 
                          alt={market.question}
                          className="w-8 h-8 object-cover rounded flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{market.groupItemTitle}</div>
                        <div className="text-xs text-gray-500">
                          {formatVolume(market.volume)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <div className="flex-1 bg-gray-100 rounded p-1.5 text-center transition-colors duration-200 hover:bg-gray-200">
                        <div className="text-green-600 font-medium text-sm">Yes</div>
                        <div className="text-sm">{formatDecimal(prices[0],'%')}</div>
                      </div>
                      <div className="flex-1 bg-gray-100 rounded p-1.5 text-center transition-colors duration-200 hover:bg-gray-200">
                        <div className="text-red-600 font-medium text-sm">No</div>
                        <div className="text-sm">{formatDecimal(prices[1],'%')}</div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="col-span-full text-center py-2 text-gray-500 text-sm">
                No open markets currently available
              </div>
            )}
          </div>
          
          {/* Expand/Collapse Button */}
          {hasMoreEvents && (
            <div 
              className="flex justify-center items-center py-2 cursor-pointer hover:bg-gray-300 rounded-lg transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
  