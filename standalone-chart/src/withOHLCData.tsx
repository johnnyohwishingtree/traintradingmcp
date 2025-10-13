import { tsvParse } from "d3-dsv";
import { timeParse } from "d3-time-format";
import * as React from "react";
// Data source: Backend API serving cached Yahoo Finance data
import { getHistoricalData } from "./services/backendAPI";

export interface IOHLCData {
    readonly close: number;
    readonly date: Date;
    readonly high: number;
    readonly low: number;
    readonly open: number;
    readonly volume: number;
}

const parseDate = timeParse("%Y-%m-%d");

const parseData = () => {
    return (d: any) => {
        const date = parseDate(d.date);
        if (date === null) {
            d.date = new Date(Number(d.date));
        } else {
            d.date = new Date(date);
        }

        for (const key in d) {
            if (key !== "date" && Object.prototype.hasOwnProperty.call(d, key)) {
                d[key] = +d[key];
            }
        }

        return d as IOHLCData;
    };
};

interface WithOHLCDataProps {
    readonly data: IOHLCData[];
    readonly symbol?: string;
    readonly interval?: string;
    readonly displayTimezone?: string;
    readonly isReplayMode?: boolean;
    readonly replayPosition?: number;
    readonly onDataLoaded?: (data: IOHLCData[]) => void;
}

interface WithOHLCState {
    data?: IOHLCData[];
    message: string;
    currentSymbol?: string;
}

export function withOHLCData(dataSet = "DAILY") {
    return <TProps extends WithOHLCDataProps>(OriginalComponent: React.ComponentClass<TProps>) => {
        return class WithOHLCData extends React.Component<Omit<TProps, "data">, WithOHLCState> {
            public constructor(props: Omit<TProps, "data">) {
                super(props);

                this.state = {
                    message: `Loading ${dataSet} data...`,
                };
            }

            public componentDidMount() {
                this.loadData();
            }

            public componentDidUpdate(prevProps: Omit<TProps, "data">) {
                const currentSymbol = (this.props as any).symbol || 'SNOW';
                const currentInterval = (this.props as any).interval || '1day';
                const prevSymbol = prevProps ? (prevProps as any).symbol || 'SNOW' : null;
                const prevInterval = prevProps ? (prevProps as any).interval || '1day' : null;
                const isReplayMode = (this.props as any).isReplayMode || false;
                const prevReplayMode = prevProps ? (prevProps as any).isReplayMode || false : false;
                
                if (prevProps && (prevSymbol !== currentSymbol || prevInterval !== currentInterval)) {
                    console.log(`📊 Data reload triggered: ${prevSymbol}@${prevInterval} → ${currentSymbol}@${currentInterval}`);
                    this.loadData();
                }
                
                // Don't reload data when just changing replay position
                if (isReplayMode && prevReplayMode && (this.props as any).replayPosition !== (prevProps as any).replayPosition) {
                    // Just re-render with new position, don't reload data
                    this.forceUpdate();
                }
            }

            private loadData = async () => {
                const rawSymbol = (this.props as any).symbol || 'SNOW';
                const currentInterval = (this.props as any).interval || '1day';
                
                // Clean symbol name by removing refresh/replay/reset suffixes
                const currentSymbol = rawSymbol
                    .replace('_refresh', '')
                    .replace('_replay_exit', '')
                    .replace('_reset', '')
                    .replace('TEMP_RELOAD', 'SNOW');
                
                // Clear data immediately when switching symbols or intervals
                this.setState({ 
                    data: undefined,
                    message: `Loading ${currentSymbol} (${currentInterval}) data...`,
                    currentSymbol 
                });

                try {
                    // Get real historical data for the symbol and interval
                    const realData = await getHistoricalData(currentSymbol, currentInterval);
                    
                    if (realData && realData.length > 0) {
                        console.log(`📊 Setting new data: ${realData.length} items for ${currentSymbol}@${currentInterval}`);
                        console.log(`📊 First data point:`, realData[0]);
                        console.log(`📊 Last data point:`, realData[realData.length - 1]);
                        
                        // Notify parent component of full data
                        const onDataLoaded = (this.props as any).onDataLoaded;
                        if (onDataLoaded) {
                            onDataLoaded(realData);
                        }
                        
                        this.setState({
                            data: realData,
                            message: '',
                        });
                        return;
                    }
                } catch (error) {
                    console.log('Error generating data:', error);
                    
                    // No fallback - show no data available message
                    this.setState({
                        data: [],
                        message: `No data available for ${currentSymbol} (${currentInterval}). Please try a different symbol or interval.`,
                    });
                }
            };

            public render() {
                const { data, message, currentSymbol } = this.state;
                const currentInterval = (this.props as any).interval || '1day';
                const isReplayMode = (this.props as any).isReplayMode || false;
                const replayPosition = (this.props as any).replayPosition || 0;
                
                // Show message if no data or loading
                if (data === undefined) {
                    return <div className="center">{message}</div>;
                }
                
                // Show message for empty data
                if (data.length === 0) {
                    return <div className="center">{message || `No data available for ${currentSymbol} (${currentInterval})`}</div>;
                }

                // In replay mode, slice the data to show only up to replay position
                let displayData = data;
                if (isReplayMode && replayPosition > 0) {
                    displayData = data.slice(0, Math.min(replayPosition, data.length));
                    // console.log(`🎬 Replay mode: showing ${displayData.length} of ${data.length} bars`);
                }

                // Add key to force re-render when symbol or interval changes ONLY
                // Don't include data length in key to avoid re-mounts during wheel scroll
                const chartKey = `${currentSymbol}-${currentInterval}`;
                // console.log(`📋 Chart rendering with key: ${chartKey}`);

                return (
                    <OriginalComponent 
                        {...(this.props as TProps)} 
                        data={displayData} 
                        key={chartKey}
                    />
                );
            }
        };
    };
}