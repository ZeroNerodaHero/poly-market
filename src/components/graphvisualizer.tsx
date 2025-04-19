import React, { useMemo, useState } from 'react';
import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisRight } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { curveLinear } from '@visx/curve';
import { extent, merge } from 'd3-array'; // Import merge
import { timeFormat } from 'd3-time-format';
import ParentSize from '@visx/responsive/lib/components/ParentSize';
import { TooltipWithBounds, useTooltip } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { Line } from '@visx/shape';

// Import interfaces
// Make sure this path is correct for your project structure
import type { MarketPriceHistory, ProcessedDataPoint, InputDataset, ProcessedDataset, TimeValuePair } from '../interfaces/graphvisulizer/pricehistorytype';

// --- Interfaces for Props ---
interface MultiLineChartProps {
    datasets: InputDataset[]; // Input is now an array of datasets
    width: number;
    height: number;
    margin?: { top: number; right: number; bottom: number; left: number };
    defaultColors?: string[]; // Optional array of default colors
}

// --- Constants ---
const defaultMargin = { top: 20, right: 50, bottom: 40, left: 20 };
const defaultColorsList = [ // Default color cycle if none provided
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

// --- Helper Accessors (remain the same) ---
const getDate = (d: ProcessedDataPoint): Date => d.date;
const getValue = (d: ProcessedDataPoint): number => d.value;

// Add time interval type and options
type TimeInterval = '1h' | '6h' | '24h' | '7d' | '30d' | 'all';

const timeIntervals: { label: string; value: TimeInterval }[] = [
  { label: '1H', value: '1h' },
  { label: '6H', value: '6h' },
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: 'All', value: 'all' }
];

// --- Main Chart Component ---
function ChartComponent({
    datasets = [], // Default to empty array if no datasets provided
    width,
    height,
    margin = defaultMargin,
    defaultColors = defaultColorsList,
}: MultiLineChartProps) {
    // Add tooltip state
    const {
        tooltipData,
        tooltipLeft,
        tooltipTop,
        showTooltip,
        hideTooltip,
    } = useTooltip<TimeValuePair[]>();

    // --- Data Processing ---
    const processedDatasets = useMemo((): ProcessedDataset[] => {
        return datasets.map((dataset, index) => {
            // Process data points for this individual dataset
            const processedData = dataset.data
                .map(d => {
                    const date = new Date(parseInt(d.t) * 1000);
                    const value = parseFloat(d.p);
                    if (!isNaN(date.getTime()) && !isNaN(value)) {
                        return { date, value };
                    }
                    console.warn(`Skipping invalid data point in dataset '${dataset.name}': t=${d.t}, p=${d.p}`);
                    return null;
                })
                .filter((d): d is ProcessedDataPoint => d !== null)
                .sort((a, b) => a.date.getTime() - b.date.getTime());

            // Assign color: use provided or cycle through defaults
            const color = dataset.color || defaultColors[index % defaultColors.length];

            return {
                name: dataset.name,
                color: color,
                processedData: processedData,
            };
        });
    }, [datasets, defaultColors]);

    const allProcessedDataPoints: ProcessedDataPoint[] = useMemo(() =>
        merge(processedDatasets.map(ds => ds.processedData)),
        [processedDatasets]
    );

    // --- Bounds ---
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // --- Scales (Domains calculated from ALL data points) ---
    const timeScale = useMemo(() => {
        // Now allProcessedDataPoints is correctly typed as ProcessedDataPoint[]
        const domain = extent(allProcessedDataPoints, getDate) as [Date, Date] | [undefined, undefined];
        const validDomain: [Date, Date] = (domain[0] && domain[1]) ? domain : [new Date(), new Date()];

        return scaleTime<number>({
            range: [0, innerWidth],
            domain: validDomain,
        });
    }, [innerWidth, allProcessedDataPoints]); // Dependency is correct

    const valueScale = useMemo(() => {
        // Now allProcessedDataPoints is correctly typed as ProcessedDataPoint[]
        const domain = extent(allProcessedDataPoints, getValue) as [number, number] | [undefined, undefined];
        const validDomain: [number, number] = (domain[0] !== undefined && domain[1] !== undefined) ? domain : [0, 1];

        return scaleLinear<number>({
            range: [innerHeight, 0],
            domain: validDomain,
            nice: true,
        });
    }, [innerHeight, allProcessedDataPoints]); // Dependency is correct

    // Add tooltip handler
    const handleTooltip = (event: React.MouseEvent<SVGSVGElement>) => {
        const { x, y } = localPoint(event) || { x: 0, y: 0 };
        
        // Check if the mouse is within the graph bounds
        const isWithinBounds = 
            x >= margin.left && 
            x <= width - margin.right && 
            y >= margin.top && 
            y <= height - margin.bottom;

        if (!isWithinBounds) {
            hideTooltip();
            return;
        }

        const x0 = timeScale.invert(x - margin.left);
        
        if (!x0) return;

        // Find the closest data points for each dataset
        const tooltipData: TimeValuePair[] = processedDatasets.map(dataset => {
            const points = dataset.processedData;
            const bisectDate = (array: ProcessedDataPoint[], date: Date) => {
                let left = 0;
                let right = array.length - 1;
                while (right - left > 1) {
                    const mid = Math.floor((left + right) / 2);
                    if (array[mid].date > date) {
                        right = mid;
                    } else {
                        left = mid;
                    }
                }
                return array[left];
            };
            
            const point = bisectDate(points, x0);
            return {
                name: dataset.name,
                color: dataset.color,
                point: point
            };
        });

        // Calculate tooltip position relative to cursor
        const tooltipX = x;
        const tooltipY = y;

        showTooltip({
            tooltipData,
            tooltipLeft: tooltipX,
            tooltipTop: tooltipY,
        });
    };

    // --- Render Checks ---
    if (width < 10 || height < 10 || innerWidth < 1 || innerHeight < 1) {
        return null;
    }
    // Check if *any* dataset has enough data to potentially draw
    const canDraw = processedDatasets.some(ds => ds.processedData.length >= 2);
    if (!canDraw) {
        return (
            <div style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                Not enough data to display chart.
            </div>
        );
    }


    // --- Render Chart ---
    return (
        <div style={{ position: 'relative' }}>
            <svg width={width} height={height} onMouseMove={handleTooltip} onMouseLeave={hideTooltip}>
                <Group left={margin.left} top={margin.top}>
                    {/* Grid Lines and Axes are drawn once using shared scales */}
                    <GridRows scale={valueScale} width={innerWidth} stroke="#e0e0e0" strokeDasharray="1,3" pointerEvents="none" numTicks={5} />
                    <AxisBottom top={innerHeight} scale={timeScale} numTicks={innerWidth > 520 ? 7 : 4} stroke="#e0e0e0" tickStroke="transparent" tickLabelProps={() => ({ fill: '#828282', fontSize: 11, textAnchor: 'middle', dy: '0.33em', })} tickFormat={(value) => timeFormat('%b %d')(value as Date)} />
                    <AxisRight left={innerWidth} scale={valueScale} numTicks={5} stroke="transparent" tickStroke="transparent" tickLabelProps={() => ({ fill: '#828282', fontSize: 11, textAnchor: 'start', dx: '0.5em', dy: '0.33em', })} tickFormat={(value) => typeof value === 'number' ? value.toFixed(2) : ''} />

                    {/* Add vertical line for tooltip */}
                    {tooltipData && tooltipLeft !== undefined && tooltipLeft >= margin.left && tooltipLeft <= width - margin.right && (
                        <>
                            <Line
                                from={{ x: tooltipLeft - margin.left, y: 0 }}
                                to={{ x: tooltipLeft - margin.left, y: innerHeight }}
                                stroke="#e0e0e0"
                                strokeWidth={1}
                                strokeDasharray="5,5"
                                pointerEvents="none"
                            />
                            {/* Add circles at intersection points */}
                            {tooltipData.map(({ point, color, name }) => (
                                point && (
                                    <circle
                                        key={`${name}-${point.date.getTime()}-${point.value}`}
                                        cx={tooltipLeft - margin.left}
                                        cy={valueScale(point.value)}
                                        r={4}
                                        fill={color}
                                        stroke="white"
                                        strokeWidth={1}
                                        pointerEvents="none"
                                    />
                                )
                            ))}
                        </>
                    )}

                    {/* --- MAP OVER PROCESSED DATASETS TO DRAW EACH LINE --- */}
                    {processedDatasets.map((dataset) => (
                        // Only render LinePath if dataset has enough points
                        dataset.processedData.length >= 2 && (
                            <LinePath<ProcessedDataPoint>
                                key={dataset.name} // Use dataset name as key
                                data={dataset.processedData} // Data for THIS line
                                x={(d) => timeScale(getDate(d)) ?? 0}
                                y={(d) => valueScale(getValue(d)) ?? 0}
                                stroke={dataset.color} // Color for THIS line
                                strokeWidth={2}
                                curve={curveLinear}
                            />
                        )
                    ))}
                    {/* END MAPPING */}
                </Group>
            </svg>

            {/* Tooltip */}
            {tooltipData && 
             tooltipLeft !== undefined && 
             tooltipTop !== undefined && 
             tooltipLeft >= margin.left && 
             tooltipLeft <= width - margin.right && (
                <TooltipWithBounds
                    key={Math.random()}
                    top={tooltipTop + 10} // Offset from cursor
                    left={tooltipLeft + 10} // Offset from cursor
                    style={{
                        backgroundColor: 'white',
                        padding: '8px',
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        position: 'absolute',
                        pointerEvents: 'none',
                        zIndex: 100,
                    }}
                >
                    <div style={{ fontSize: '12px' }}>
                        {timeFormat('%b %d, %H:%M')(timeScale.invert(tooltipLeft - margin.left))}
                        {tooltipData.map(({ name, color, point }) => (
                            point && (
                                <div key={name} style={{ color, marginTop: '4px' }}>
                                    {name}: {point.value.toFixed(2)}
                                </div>
                            )
                        ))}
                    </div>
                </TooltipWithBounds>
            )}
        </div>
    );
}

// --- Responsive Wrapper Component (Rename recommended) ---
interface ResponsiveMultiLineChartContainerProps {
    datasets: InputDataset[]; // Expects array of InputDataset
    defaultColors?: string[];
    [key: string]: any;
}

// Add new interface for the summary component
interface PriceSummaryProps {
    datasets: ProcessedDataset[];
}

// Add new component for price summary
const PriceSummary: React.FC<PriceSummaryProps> = ({ datasets }) => {
    return (
        <div className="flex flex-wrap gap-2 mb-2 p-1 bg-white rounded-lg shadow">
            {datasets.map((dataset) => {
                const lastPoint = dataset.processedData[dataset.processedData.length - 1];
                return (
                    <div key={dataset.name} className="flex items-center">
                        <div 
                            className="w-2 h-2 rounded-full mr-1" 
                            style={{ backgroundColor: dataset.color }}
                        />
                        <span className="text-sm font-medium">
                            {dataset.name}: {lastPoint ? `${Math.round(lastPoint.value * 100)}%` : 'N/A'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// Modify the ResponsiveMultiLineChart component
export default function ResponsiveMultiLineChart({ datasets, defaultColors = defaultColorsList, ...rest }: ResponsiveMultiLineChartContainerProps) {
    const [selectedInterval, setSelectedInterval] = useState<TimeInterval>('all');

    // Filter datasets based on time interval
    const filteredDatasets = useMemo(() => {
        const now = new Date();
        return datasets.map(dataset => {
            const filteredData = dataset.data.filter(d => {
                const date = new Date(parseInt(d.t) * 1000);
                const timeDiff = now.getTime() - date.getTime();
                
                switch (selectedInterval) {
                    case '1h':
                        return timeDiff <= 60 * 60 * 1000;
                    case '6h':
                        return timeDiff <= 6 * 60 * 60 * 1000;
                    case '24h':
                        return timeDiff <= 24 * 60 * 60 * 1000;
                    case '7d':
                        return timeDiff <= 7 * 24 * 60 * 60 * 1000;
                    case '30d':
                        return timeDiff <= 30 * 24 * 60 * 60 * 1000;
                    case 'all':
                        return true;
                    default:
                        return true;
                }
            });

            return {
                ...dataset,
                data: filteredData
            };
        });
    }, [datasets, selectedInterval]);

    return (
        <div className="w-full">
            <div className="h-[300px] relative overflow-hidden">
                <ParentSize debounceTime={10}>
                    {({ width, height }) => {
                        // Process datasets to get the most recent prices
                        const processedDatasets = filteredDatasets.map((dataset, index) => {
                            const processedData = dataset.data
                                .map(d => {
                                    const date = new Date(parseInt(d.t) * 1000);
                                    const value = parseFloat(d.p);
                                    if (!isNaN(date.getTime()) && !isNaN(value)) {
                                        return { date, value };
                                    }
                                    return null;
                                })
                                .filter((d): d is ProcessedDataPoint => d !== null)
                                .sort((a, b) => a.date.getTime() - b.date.getTime());

                            const color = dataset.color || defaultColors[index % defaultColors.length];

                            return {
                                name: dataset.name,
                                color: color,
                                processedData: processedData,
                            };
                        });

                        return (
                            <div className="flex flex-col h-full">
                                <div className="flex flex-wrap gap-1 mb-2 p-1 bg-white rounded-lg shadow overflow-x-auto">
                                    {processedDatasets.map((dataset) => {
                                        const lastPoint = dataset.processedData[dataset.processedData.length - 1];
                                        return (
                                            <div key={dataset.name} className="flex items-center whitespace-nowrap">
                                                <div 
                                                    className="w-2 h-2 rounded-full mr-1" 
                                                    style={{ backgroundColor: dataset.color }}
                                                />
                                                <span className="text-xs font-medium">
                                                    {dataset.name}: {lastPoint ? `${Math.round(lastPoint.value * 100)}%` : 'N/A'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex-1 min-h-0">
                                    <ChartComponent
                                        width={width}
                                        height={height - 40}
                                        datasets={filteredDatasets}
                                        defaultColors={defaultColors}
                                        {...rest}
                                    />
                                </div>
                            </div>
                        );
                    }}
                </ParentSize>
            </div>
            <div className="flex justify-center gap-2 mt-2">
                {timeIntervals.map(({ label, value }) => (
                    <button
                        key={value}
                        onClick={() => setSelectedInterval(value)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            selectedInterval === value
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
}