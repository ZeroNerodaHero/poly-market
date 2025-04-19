import { useEffect, useState, useMemo } from 'react';
import { EventDisplayerProps } from '../interfaces/marketInterfaces';
import { mark } from 'framer-motion/client';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { generateGradient } from '@/helpTS/generateGradient';

interface Holder {
    proxyWallet: string;
    bio: string;
    asset: string;
    pseudonym: string;
    amount: number;
    displayUsernamePublic: boolean;
    outcomeIndex: number;
    name: string;
    profileImage: string;
    profileImageOptimized: string;
}

interface TokenHolderList{
    token: string;
    holders: Holder[];
}

interface TokenHoldersResponse {
    yesHolders: TokenHolderList;
    noHolders: TokenHolderList;
}

export default function TopHolder({ event }: EventDisplayerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const openEvents = event.markets.filter(market => !market.closed && market.outcomePrices !== undefined);
    const [holderList, setHolderList] = useState<TokenHoldersResponse>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [curMarket, setCurMarket] = useState<number>(0);

    // Create a map of conditionId to market name
    const marketIds = new Map<string, string>(event.markets
        .filter(market => !market.closed && market.outcomePrices !== undefined && market.clobTokenIds.length > 0)
        .map(market => [market.groupItemTitle!, market.conditionId] as [string, string])
    );

    const marketNames = new Map<string, string>();
    event.markets.forEach(market => {
        if (!market.closed && market.outcomePrices !== undefined && market.clobTokenIds.length > 0 && market.groupItemTitle) {
            marketNames.set(market.conditionId, market.groupItemTitle);
        }
    });

    //another map to tell which token is yes and no
    const conditionToYes = new Map<string, string>(event.markets
        .filter(market => !market.closed && market.outcomePrices !== undefined && market.clobTokenIds.length > 0)
        .map(market => [market.conditionId, JSON.parse(market.clobTokenIds)[0]] as [string, string])
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const apiUrl = `/api/polymarket_topholders?market=${Array.from(marketIds)[curMarket][1]}&limit=30`;
                const response = await fetch(apiUrl);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const data = await response.json();
                const info: TokenHolderList[] = data.map((item: TokenHolderList) => (item));
                const finalData: TokenHoldersResponse = {
                    yesHolders: info[0].token == conditionToYes.get(info[0].token) ? info[0] : info[1],
                    noHolders: info[0].token != conditionToYes.get(info[0].token) ? info[0] : info[1]
                };
                setHolderList(finalData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [curMarket]);

    const handleMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newIndex = parseInt(e.target.value);
        setCurMarket(newIndex);
        setIsExpanded(false);
    };

    return (
        <div className="space-y-4" onClick={(e)=>{e.stopPropagation()}}>
            <div className="text-center">
                {marketIds.size > 1 && (
                    <select
                        value={curMarket}
                        onChange={handleMarketChange}
                        className="mt-2 block w-64 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {Array.from(marketIds).map(([title, id], index) => (
                            <option key={id} value={index}>
                                {title}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            <div className="bg-white rounded-lg shadow">
                <HoldersDisplay data={holderList} isExpanded={isExpanded} />
                <div 
                    className="flex justify-center items-center py-2 cursor-pointer hover:bg-gray-50 rounded-b-lg"
                    onClick={(e) => {
                        setIsExpanded(!isExpanded)
                    }}
                >
                    {isExpanded ? (
                        <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                    ) : (
                        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                    )}
                </div>
            </div>
        </div>
    );
}


//AI CODE----------------------------------------------------
//AI CODE----------------------------------------------------
//AI CODE----------------------------------------------------
//AI CODE----------------------------------------------------
interface HoldersDisplayProps {
    data: TokenHoldersResponse | null | undefined;
    isExpanded: boolean;
}

// --- Helper Function (Keep it simple) ---
const getHolderDisplayName = (holder: Holder): string => {
    const name = holder.displayUsernamePublic && holder.name
        ? holder.name
        : holder.pseudonym
        ? holder.pseudonym
        : `${holder.proxyWallet.substring(0, 6)}...${holder.proxyWallet.substring(holder.proxyWallet.length - 4)}`;
    
    return name.length > 16 ? `${name.substring(0, 16)}...` : name;
};

// --- The Display Component ---
const HoldersDisplay: React.FC<HoldersDisplayProps> = ({ data, isExpanded }) => {
    if (!data) {
        return <div className="p-4 text-center text-gray-400 italic">Holder data not available.</div>;
    }

    const { yesHolders, noHolders } = data;

    const renderHolderList = (title: string, holders: Holder[], colorClass: string) => {
        const displayHolders = isExpanded ? holders : holders?.slice(0, 10) || [];
        const hasMore = holders && holders.length > 10 && !isExpanded;

        return (
            <div className="w-full md:w-1/2 bg-white p-4" >
                <h2 className="text-lg font-semibold mb-2 pb-1 border-b border-gray-300">{title}</h2>
                {displayHolders.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                        {displayHolders.map((holder) => (
                            <a 
                            key={holder.proxyWallet} 
                            href={`/profile/${holder.proxyWallet}`}
                            className="truncate cursor-pointer hover:text-blue-600" 
                            title={getHolderDisplayName(holder)}
                            >
                            <li 
                                className="flex justify-between items-center py-0.5 group relative hover:bg-gray-100 transition-colors duration-200"
                            >
                                <div className="flex items-center gap-2">
                                    {holder.profileImage ? (
                                        <img 
                                            src={holder.profileImage} 
                                            alt={getHolderDisplayName(holder)}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div 
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                            style={{ background: generateGradient(getHolderDisplayName(holder)) }}
                                        >
                                            {getHolderDisplayName(holder)[0].toUpperCase()}
                                        </div>
                                    )}
                                    {getHolderDisplayName(holder)}
                                </div>
                                <span className={`font-medium flex-shrink-0 ${colorClass}`}>
                                    {Math.floor(holder.amount).toLocaleString()}
                                </span>
                            </li>
                            </a>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 italic mt-2">None</p>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row">
            {renderHolderList("Yes Holders", yesHolders?.holders || [], "text-green-600")}
            <div className="border-l border-gray-200"></div>
            {renderHolderList("No Holders", noHolders?.holders || [], "text-red-600")}
        </div>
    );
};


