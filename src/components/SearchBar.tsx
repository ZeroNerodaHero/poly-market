'use client';
import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  image?: string;
  volume?: string;
  volume24hr?: string;
  endDate?: string;
  markets?: Array<{
    volume: string;
    volume24hr: string;
  }>;
}

export default function SearchBar({ placeholder = 'Search events...', onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://polymarket.com/api/events/search?_s=volume_24hr&_sts=active&_q=${encodeURIComponent(query)}&_hide_sports=false&_l=5&_p=1`
        );
        const data = await response.json();
        setResults(data.events || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.title);
    setResults([]);
    onSearch(result.slug);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setResults([]);
        inputRef.current?.blur();
        break;
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const formatVolume = (volume: string | undefined) => {
    if (!volume) return '0';
    const num = parseFloat(volume);
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400 group-hover:text-gray-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 text-gray-900 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {(isLoading || (results.length > 0 && isFocused)) && (
        <div 
          ref={resultsRef}
          className="absolute w-full mt-2 bg-white rounded-xl shadow-lg max-h-96 overflow-y-auto transition-all duration-200 border border-gray-100"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-gray-500 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-sm">Searching events...</span>
            </div>
          ) : (
            results.map((result, index) => {
              const totalVolume = result.markets?.reduce((acc, market) => acc + parseFloat(market.volume || '0'), 0) || 0;
              const totalVolume24hr = result.markets?.reduce((acc, market) => acc + parseFloat(market.volume24hr || '0'), 0) || 0;

              return (
                <div
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={`p-4 cursor-pointer transition-all duration-150 ${
                    index === selectedIndex
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  } ${index !== results.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex items-start space-x-4">
                    {result.image ? (
                      <div className="w-14 h-14 flex-shrink-0">
                        <img 
                          src={result.image} 
                          alt={result.title}
                          className="w-full h-full object-cover rounded-lg shadow-sm"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">{result.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <div className="flex items-center bg-gray-50 px-2 py-1 rounded-full">
                          <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{result.endDate ? new Date(result.endDate).toLocaleDateString() : 'No end date'}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 px-2 py-1 rounded-full">
                          <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>Total: {formatVolume(totalVolume.toString())}</span>
                        </div>
                        <div className="flex items-center bg-gray-50 px-2 py-1 rounded-full">
                          <svg className="w-3 h-3 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span>24h: {formatVolume(totalVolume24hr.toString())}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
} 