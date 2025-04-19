export interface MarketPriceHistory {
    t: string;
    p: string;
}

export interface ProcessedDataPoint {
    date: Date;
    value: number;
}

export interface InputDataset {
    name: string; 
    color?: string;
    data: MarketPriceHistory[]; 
}

export interface ProcessedDataset {
    name: string;
    color: string; // Will have a definite color after processing
    processedData: ProcessedDataPoint[];
}

export interface TimeValuePair {
    name: string;
    color: string;
    point: ProcessedDataPoint | null;
}