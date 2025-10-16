import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import * as React from "react";
import { formatTimeWithTimezone } from "./utils/timezoneUtils";
import {
    elderRay,
    ema,
    sma,
    bollingerBand,
    discontinuousTimeScaleProviderBuilder,
    Chart,
    ChartCanvas,
    CurrentCoordinate,
    BarSeries,
    CandlestickSeries,
    OHLCSeries,
    ElderRaySeries,
    LineSeries,
    AreaSeries,
    BollingerSeries,
    MovingAverageTooltip,
    OHLCTooltip,
    SingleValueTooltip,
    lastVisibleItemBasedZoomAnchor,
    XAxis,
    YAxis,
    CrossHairCursor,
    EdgeIndicator,
    MouseCoordinateX,
    MouseCoordinateY,
    ZoomButtons,
    withDeviceRatio,
    withSize,
    TrendLine,
    HorizontalLine,
    VerticalLine,
    HorizontalRay,
    InfoLine,
    FibonacciRetracement,
    TrianglePattern,
    EquidistantChannel,
    InteractiveYCoordinate,
    InteractiveText,
} from "@slowclap/financial-charts";
import { IOHLCData, WithOHLCDataProps } from "./withOHLCData";
import ResizeHandle from './ResizeHandle';
import { PineScriptOutput } from './PineScriptEngine';

interface StockChartWithToolsProps extends WithOHLCDataProps {
    readonly height: number;
    readonly dateTimeFormat?: string;
    readonly displayTimezone?: string;
    readonly width: number;
    readonly ratio: number;
    readonly currentTool?: string | null;
    readonly enableTrendLine?: boolean;
    readonly enableTrendChannel?: boolean;
    readonly enableFibonacci?: boolean;
    readonly enablePatterns?: boolean;
    readonly trendLines?: any[];
    readonly trendChannels?: any[];
    readonly fibonacciRetracements?: any[];
    readonly trianglePatterns?: any[];
    readonly labels?: any[];
    readonly horizontalLines?: any[];
    readonly horizontalRays?: any[];
    readonly verticalLines?: any[];
    readonly selectedTrendLines?: number[];
    readonly selectedChannels?: number[];
    readonly selectedFibs?: number[];
    readonly selectedTriangles?: number[];
    readonly selectedLabels?: number[];
    readonly selectedHorizontalLines?: number[];
    readonly selectedHorizontalRays?: number[];
    readonly selectedVerticalLines?: number[];
    readonly onTrendLineComplete?: (trendLines: any[]) => void;
    readonly onTrendChannelComplete?: (channels: any[]) => void;
    readonly onFibonacciComplete?: (fibs: any[]) => void;
    readonly onRefresh?: () => void;
    readonly onTriangleComplete?: (triangles: any[]) => void;
    readonly onLabelComplete?: (labels: any[]) => void;
    readonly onHorizontalLineComplete?: (lines: any[]) => void;
    readonly onHorizontalRayComplete?: (rays: any[]) => void;
    readonly onVerticalLineComplete?: (lines: any[]) => void;
    readonly onTrendLineSelect?: (e: React.MouseEvent, interactives: any[]) => void;
    readonly onTrendChannelSelect?: (e: React.MouseEvent, interactives: any[]) => void;
    readonly onFibonacciSelect?: (e: React.MouseEvent, interactives: any[]) => void;
    readonly onTriangleSelect?: (e: React.MouseEvent, interactives: any[]) => void;
    readonly onLabelSelect?: (e: React.MouseEvent, interactives: any[]) => void;
    readonly onHorizontalLineSelect?: (e: React.MouseEvent, interactives: any[]) => void;
    readonly onHorizontalRaySelect?: (e: React.MouseEvent, interactives: any[]) => void;
    readonly onVerticalLineSelect?: (e: React.MouseEvent, interactives: any[]) => void;
    readonly onDeselectAll?: () => void;
    readonly isReplayMode?: boolean;
    readonly replayPosition?: number;
    readonly fullData?: IOHLCData[];
    readonly enabledIndicators?: {
        ema10: boolean;
        ema12: boolean;
        ema26: boolean;
        ema50: boolean;
        ema200: boolean;
        sma10: boolean;
        sma50: boolean;
        sma200: boolean;
        bollingerBands: boolean;
        elderRay: boolean;
        volume: boolean;
    };
    readonly chartType?: 'candlestick' | 'ohlc' | 'line' | 'area';
    readonly zoomMultiplier?: number;
    readonly importedIndicators?: Array<{
        name: string;
        output: PineScriptOutput;
        enabled: boolean;
    }>;
    readonly elderRayHeight?: number;
    readonly volumeHeight?: number;
    readonly onElderRayHeightChange?: (height: number) => void;
    readonly onVolumeHeightChange?: (height: number) => void;
    readonly yAxisPadding?: number;
    readonly onYAxisPaddingChange?: (padding: number) => void;
}

interface StockChartState {
    isDraggingYAxis: boolean;
}

class StockChartWithTools extends React.Component<StockChartWithToolsProps, StockChartState> {
    private readonly margin = { left: 50, right: 80, top: 20, bottom: 24 }; // Right margin to accommodate Y-axis labels + drag area

    constructor(props: StockChartWithToolsProps) {
        super(props);
        this.state = {
            isDraggingYAxis: false
        };
    }
    private readonly pricesDisplayFormat = format(".2f");
    private readonly preciseDisplayFormat = (value: number) => {
        return value.toFixed(2);
    };

    private getTradingViewColors = () => {
        return {
            background: "#131722",
            grid: "#2a2e39", 
            text: "#d1d4dc",
            green: "#089981",
            red: "#f23645",
            blue: "#2962ff",
            orange: "#ff9800",
        };
    };

    private renderLineTools = () => {
        const {
            currentTool,
            enableTrendLine,
            enableTrendChannel,
            trendLines = [],
            trendChannels = [],
            horizontalLines = [],
            selectedTrendLines = [],
            selectedChannels = [],
            selectedHorizontalLines = [],
            onTrendLineComplete,
            onTrendChannelComplete,
            onHorizontalLineComplete,
            onTrendLineSelect,
            onTrendChannelSelect,
            onHorizontalLineSelect
        } = this.props;

        const tvColors = this.getTradingViewColors();

        // Common line tool props
        const commonProps = {
            enabled: enableTrendLine,
            snap: false,
            snapTo: (d: any) => [d.high, d.low],
            onStart: () => {},
            onComplete: (e: any, newTrends: any[], moreProps: any) => {
                if (onTrendLineComplete) {
                    onTrendLineComplete(newTrends);
                }
            },
            onDragStart: (e: any, interactives: any[], moreProps: any) => {
                if (onTrendLineSelect && interactives.length > 0) {
                    onTrendLineSelect(e, interactives);
                }
            },
            onDragComplete: (e: any, newTrends: any[], moreProps: any) => {
                if (newTrends.length > 0) {
                    if (onTrendLineComplete) {
                        onTrendLineComplete(newTrends);
                    }
                    if (onTrendLineSelect) {
                        onTrendLineSelect(e, newTrends);
                    }
                }
            },
            onSelect: onTrendLineSelect,
            trends: trendLines.filter(trend => 
                // Only include regular trend lines, not channel data
                !trend.channelType
            ).map((trend, index) => ({
                ...trend,
                selected: selectedTrendLines.includes(index)
            })),
            hoverText: {
                enable: false,
            }
        };

        // Render different line types based on currentTool
        switch (currentTool) {
            case 'trendline':
                // Trend lines are now handled by the standalone persistent component
                return null;

            case 'ray':
                return (
                    <TrendLine
                        {...commonProps}
                        type="RAY"
                        appearance={{
                            strokeStyle: "#ff9800",
                            strokeWidth: 2,
                            strokeDasharray: "Solid",
                            edgeStrokeWidth: 2,
                            edgeFill: "#ff9800",
                            edgeStroke: "#ff9800",
                        }}
                        currentPositionStroke="#ff9800"
                        currentPositionStrokeWidth={3}
                        currentPositionRadius={4}
                    />
                );

            case 'extendedline':
                return (
                    <TrendLine
                        {...commonProps}
                        type="XLINE"
                        appearance={{
                            strokeStyle: "#4caf50",
                            strokeWidth: 2,
                            strokeDasharray: "ShortDot",
                            edgeStrokeWidth: 2,
                            edgeFill: "#4caf50",
                            edgeStroke: "#4caf50",
                        }}
                        currentPositionStroke="#4caf50"
                        currentPositionStrokeWidth={3}
                        currentPositionRadius={4}
                    />
                );


            case 'horizontalline':
                // Horizontal lines are now handled by the standalone persistent component
                return null;

            case 'horizontalray':
                // Horizontal rays are now handled by the standalone persistent component
                return null;

            case 'verticalline':
                // Vertical lines are now handled by the standalone persistent component
                return null;

            case 'infoline':
                return (
                    <InfoLine
                        {...commonProps}
                        type="LINE"
                        appearance={{
                            strokeStyle: "#607d8b",
                            strokeWidth: 2,
                            strokeDasharray: "LongDash",
                            edgeStrokeWidth: 2,
                            edgeFill: "#607d8b",
                            edgeStroke: "#607d8b",
                        }}
                        currentPositionStroke="#607d8b"
                        currentPositionStrokeWidth={3}
                        currentPositionRadius={4}
                    />
                );

            default:
                // All tools (trendline, trendchannel, etc.) are now handled independently
                // Persistent displays are handled by standalone components
                return null;
        }
    };
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
        (d: IOHLCData) => d.date,
    );

    // Cache for expensive indicator calculations
    private cachedCalculatedData: IOHLCData[] | null = null;
    private cachedIndicators: any = {};
    private lastDataLength = 0;
    private lastEnabledIndicators: string = '';
    private lastDataTimestamp = 0;


    private shouldRecalculateIndicators(data: IOHLCData[], enabledIndicators: any): boolean {
        const currentEnabledIndicators = JSON.stringify(enabledIndicators);
        const currentDataLength = data.length;
        const currentDataTimestamp = data.length > 0 ? data[data.length - 1].date.getTime() : 0;

        const shouldRecalc = (
            this.cachedCalculatedData === null ||
            currentDataLength !== this.lastDataLength ||
            currentEnabledIndicators !== this.lastEnabledIndicators ||
            currentDataTimestamp !== this.lastDataTimestamp
        );

        if (shouldRecalc) {
            this.lastDataLength = currentDataLength;
            this.lastEnabledIndicators = currentEnabledIndicators;
            this.lastDataTimestamp = currentDataTimestamp;
        }

        return shouldRecalc;
    }

    private calculateIndicators(initialData: IOHLCData[], enabledIndicators: any): { calculatedData: IOHLCData[], indicators: any } {
        let calculatedData = initialData;
        const indicators: any = {};
        let idCounter = 1;

        // EMA Indicators
        if (enabledIndicators.ema10) {
            indicators.ema10 = ema()
                .id(idCounter++)
                .options({ windowSize: 10 })
                .merge((d: any, c: any) => { d.ema10 = c; })
                .accessor((d: any) => d.ema10);
            calculatedData = indicators.ema10(calculatedData);
        }
        
        if (enabledIndicators.ema12) {
            indicators.ema12 = ema()
                .id(idCounter++)
                .options({ windowSize: 12 })
                .merge((d: any, c: any) => { d.ema12 = c; })
                .accessor((d: any) => d.ema12);
            calculatedData = indicators.ema12(calculatedData);
        }
        
        if (enabledIndicators.ema26) {
            indicators.ema26 = ema()
                .id(idCounter++)
                .options({ windowSize: 26 })
                .merge((d: any, c: any) => { d.ema26 = c; })
                .accessor((d: any) => d.ema26);
            calculatedData = indicators.ema26(calculatedData);
        }
        
        if (enabledIndicators.ema50) {
            indicators.ema50 = ema()
                .id(idCounter++)
                .options({ windowSize: 50 })
                .merge((d: any, c: any) => { d.ema50 = c; })
                .accessor((d: any) => d.ema50);
            calculatedData = indicators.ema50(calculatedData);
        }
        
        if (enabledIndicators.ema200) {
            indicators.ema200 = ema()
                .id(idCounter++)
                .options({ windowSize: 200 })
                .merge((d: any, c: any) => { d.ema200 = c; })
                .accessor((d: any) => d.ema200);
            calculatedData = indicators.ema200(calculatedData);
        }

        // SMA Indicators
        if (enabledIndicators.sma10) {
            indicators.sma10 = sma()
                .id(idCounter++)
                .options({ windowSize: 10 })
                .merge((d: any, c: any) => { d.sma10 = c; })
                .accessor((d: any) => d.sma10);
            calculatedData = indicators.sma10(calculatedData);
        }
        
        if (enabledIndicators.sma50) {
            indicators.sma50 = sma()
                .id(idCounter++)
                .options({ windowSize: 50 })
                .merge((d: any, c: any) => { d.sma50 = c; })
                .accessor((d: any) => d.sma50);
            calculatedData = indicators.sma50(calculatedData);
        }
        
        if (enabledIndicators.sma200) {
            indicators.sma200 = sma()
                .id(idCounter++)
                .options({ windowSize: 200 })
                .merge((d: any, c: any) => { d.sma200 = c; })
                .accessor((d: any) => d.sma200);
            calculatedData = indicators.sma200(calculatedData);
        }

        // Bollinger Bands
        if (enabledIndicators.bollingerBands) {
            indicators.bollingerBands = bollingerBand()
                .merge((d: any, c: any) => { d.bb = c; })
                .accessor((d: any) => d.bb);
            calculatedData = indicators.bollingerBands(calculatedData);
        }

        // Elder Ray calculation (conditional)
        if (enabledIndicators.elderRay) {
            const elder = elderRay();
            calculatedData = elder(calculatedData);
            indicators.elder = elder;
        }

        return { calculatedData, indicators };
    }

    public render() {
        const { 
            data: initialData, 
            dateTimeFormat = "%d %b",
            displayTimezone = 'local',
            currentTool,
            height, 
            ratio, 
            width,
            enableTrendLine = false,
            enableTrendChannel = false,
            enableFibonacci = false,
            enablePatterns = false,
            importedIndicators = [],
            trendLines = [],
            trendChannels = [],
            fibonacciRetracements = [],
            trianglePatterns = [],
            labels = [],
            selectedTrendLines = [],
            selectedChannels = [],
            selectedFibs = [],
            selectedTriangles = [],
            selectedLabels = [],
            onTrendLineComplete,
            onTrendChannelComplete,
            onFibonacciComplete,
            onTriangleComplete,
            onLabelComplete,
            onTrendLineSelect,
            onTrendChannelSelect,
            onFibonacciSelect,
            onTriangleSelect,
            onLabelSelect,
            onDeselectAll,
            enabledIndicators = {
                ema10: false,
                ema12: true,  // Keep existing ones enabled by default
                ema26: true,
                ema50: false,
                ema200: false,
                sma10: false,
                sma50: false,
                sma200: false,
                bollingerBands: false,
                elderRay: true,  // Enabled by default to maintain current behavior
                volume: true     // Enabled by default to maintain current behavior
            },
            chartType = 'candlestick',
            zoomMultiplier = 1.05,
            elderRayHeight: propElderRayHeight = 100,
            volumeHeight: propVolumeHeight = 150
        } = this.props;

        // Use cached calculations or recalculate if needed
        let calculatedData: IOHLCData[];
        let indicators: any;

        if (this.shouldRecalculateIndicators(initialData, enabledIndicators)) {
            // console.log('🔄 Recalculating indicators for performance...');
            const result = this.calculateIndicators(initialData, enabledIndicators);
            calculatedData = result.calculatedData;
            indicators = result.indicators;
            
            // Cache the results
            this.cachedCalculatedData = calculatedData;
            this.cachedIndicators = indicators;
        } else {
            // console.log('⚡ Using cached indicators for performance');
            calculatedData = this.cachedCalculatedData!;
            indicators = this.cachedIndicators;
        }

        const { margin, xScaleProvider } = this;

        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);

        // Debug: Check if xScaleProvider is filtering data incorrectly
        if (calculatedData.length !== data.length) {
            console.warn(`⚠️ Data filtering detected: ${calculatedData.length} → ${data.length} points`);
            
            // Find missing dates
            const originalDates = calculatedData.map(d => d.date.toISOString().split('T')[0]);
            const processedDates = data.map(d => d.date.toISOString().split('T')[0]);
            const missingDates = originalDates.filter(date => !processedDates.includes(date));
            
            if (missingDates.length > 0) {
                console.warn(`🔍 Missing dates after xScaleProvider:`, missingDates.slice(-10)); // Show last 10 missing
            }
        }

        // Create stable xExtents that don't change frequently during zoom
        const max = xAccessor(data[data.length - 1]);
        // Show last 100 data points by default (about 5 months of daily data)
        // This provides a good balance between detail and overview
        const defaultVisiblePoints = 100;
        const min = xAccessor(data[Math.max(0, data.length - defaultVisiblePoints)]);
        const xExtents = [min, max + 10];
        
        // Debug: Log the date range being displayed
        if (data.length > 0) {
            const startIdx = Math.max(0, data.length - defaultVisiblePoints);
            const startDate = data[startIdx].date.toISOString().split('T')[0];
            const endDate = data[data.length - 1].date.toISOString().split('T')[0];
            console.log(`📊 Chart showing data from index ${startIdx} to ${data.length - 1}`);
            console.log(`📅 Date range: ${startDate} to ${endDate} (${defaultVisiblePoints} points visible of ${data.length} total)`);
        }

        const gridHeight = height - margin.top - margin.bottom;
        

        // Calculate dynamic heights based on enabled indicators with padding
        const paddingBetweenCharts = 10;
        const elderRayHeight = enabledIndicators.elderRay ? propElderRayHeight : 0;
        const barChartHeight = enabledIndicators.volume ? propVolumeHeight : 0;
        
        // Add padding between charts
        let totalPadding = 0;
        if (enabledIndicators.volume) totalPadding += paddingBetweenCharts;
        if (enabledIndicators.elderRay) totalPadding += paddingBetweenCharts;
        
        const chartHeight = gridHeight - elderRayHeight - barChartHeight - totalPadding;

        const elderRayOrigin = (_: number, h: number) => [0, h - elderRayHeight];
        const barChartOrigin = (_: number, h: number) => [0, h - barChartHeight - elderRayHeight - (enabledIndicators.elderRay ? paddingBetweenCharts : 0)];

        // Get elder ray from cached indicators (if enabled)
        const elder = indicators.elder;

        // Create a custom time formatter that respects timezone
        const timeDisplayFormat = (date: Date) => {
            const isIntraday = dateTimeFormat.includes('%H') || dateTimeFormat.includes('%I');
            return formatTimeWithTimezone(date, displayTimezone, isIntraday);
        };

        // TradingView color scheme
        const tvColors = {
            background: "#131722",
            grid: "#2a2e39",
            text: "#d1d4dc",
            green: "#089981",
            red: "#f23645",
            blue: "#2962ff",
            orange: "#ff9800",
        };

        // Resize handlers
        const handleVolumeResize = (deltaY: number) => {
            const newHeight = Math.max(50, Math.min(300, propVolumeHeight + deltaY));
            if (this.props.onVolumeHeightChange) {
                this.props.onVolumeHeightChange(newHeight);
            }
        };

        const handleElderRayResize = (deltaY: number) => {
            const newHeight = Math.max(50, Math.min(200, propElderRayHeight + deltaY));
            if (this.props.onElderRayHeightChange) {
                this.props.onElderRayHeightChange(newHeight);
            }
        };

        return (
            <div style={{ 
                background: tvColors.background, 
                width: '100%', 
                height: '100%',
                position: 'relative'
            }}>
                <ChartCanvas
                    height={height}
                    ratio={ratio}
                    width={width}
                    margin={margin}
                    data={data}
                    displayXAccessor={displayXAccessor}
                    seriesName="Data"
                    xScale={xScale}
                    xAccessor={xAccessor}
                    xExtents={xExtents}
                    zoomAnchor={lastVisibleItemBasedZoomAnchor}
                    zoomMultiplier={zoomMultiplier}
                    onClick={(e: any, moreProps: any) => {
                        // List of drawing tools that should not trigger deselect on click
                        const drawingTools = ['trendline', 'ray', 'extendedline', 'infoline', 'horizontalline', 'horizontalray', 'verticalline', 'label'];
                        const isDrawingMode = drawingTools.includes(currentTool || '');

                        // Handle patterns mode
                        if (enablePatterns) {
                            console.log('📊 Patterns mode active - clicked at:', moreProps);
                            // TODO: Implement pattern drawing functionality
                            return;
                        }

                        // Skip deselect if we're in drawing mode - let the drawing component handle the click
                        if (isDrawingMode) {
                            console.log(`📊 Drawing mode active (${currentTool}) - letting drawing component handle click`);
                            return;
                        }

                        // Clear all selections when clicking on empty chart area using unified handler
                        if (onDeselectAll) {
                            console.log('📊 Empty chart area clicked - calling unified deselect');
                            onDeselectAll();
                        }
                    }}
                >
                    {/* Volume Chart - Conditionally Rendered */}
                    {enabledIndicators.volume && (
                        <Chart id={2} height={barChartHeight} origin={barChartOrigin} yExtents={this.barChartExtents}>
                            <YAxis 
                                axisAt="right" 
                                orient="right" 
                                ticks={5}
                                tickFormat={(d: number) => format(".2s")(d)}
                                showDomain={false}
                                showTicks={true}
                                showTickLabel={true}
                                tickLabelFill={tvColors.text}
                                tickStroke={tvColors.grid}
                                stroke={tvColors.grid}
                                fontSize={10}
                                fontFamily="'Roboto Mono', 'Monaco', 'Consolas', monospace"
                                tickLabelProps={() => ({
                                    fontSize: 10,
                                    fontWeight: 400,
                                    fill: tvColors.text,
                                    fontFamily: "'Roboto Mono', 'Monaco', 'Consolas', monospace",
                                    textAnchor: 'start',
                                    dx: 8
                                })}
                            />
                            <BarSeries fillStyle={this.volumeColor} yAccessor={this.volumeSeries} />
                            <SingleValueTooltip
                                yAccessor={this.volumeSeries}
                                yLabel="Volume"
                                yDisplayFormat={(d: number) => format(".2s")(d)}
                                origin={[8, 16]}
                                textFill={tvColors.text}
                                labelFill={tvColors.text}
                                valueFill={tvColors.text}
                            />
                        </Chart>
                    )}
                    
                    <Chart 
                        id={3} 
                        height={chartHeight} 
                        yExtents={this.candleChartExtents}
                        key={`main-chart-${this.props.yAxisPadding || 0.1}`}
                        padding={{ top: 10, bottom: 0, left: 0, right: 0 }}
                    >
                        <XAxis 
                            showGridLines 
                            showTicks={false} 
                            showTickLabel={!enabledIndicators.elderRay}
                            stroke={tvColors.grid}
                            tickStroke={tvColors.text}
                            tickLabelFill={tvColors.text}
                            gridLinesStrokeStyle={tvColors.grid}
                        />
                        <YAxis 
                            showGridLines 
                            tickFormat={this.preciseDisplayFormat}
                            stroke={tvColors.grid}
                            tickStroke={tvColors.text}
                            gridLinesStrokeStyle={tvColors.grid}
                        />
                        <YAxis 
                            axisAt="right" 
                            orient="right" 
                            ticks={8}
                            tickFormat={this.preciseDisplayFormat}
                            showDomain={false}
                            showTicks={true}
                            showTickLabel={true}
                            tickLabelFill="#ffffff"
                            tickStroke={tvColors.grid}
                            strokeWidth={1}
                            stroke={tvColors.grid}
                            fontSize={12}
                            fontFamily="'Roboto Mono', 'Monaco', 'Consolas', monospace"
                            tickLabelProps={() => ({
                                fontSize: 12,
                                fontWeight: 500,
                                fill: '#ffffff',
                                fontFamily: "'Roboto Mono', 'Monaco', 'Consolas', monospace",
                                textAnchor: 'start',
                                dx: 12
                            })}
                        />
                        
                        {/* Dynamic Chart Series based on chartType */}
                        {this.renderChartSeries(chartType, tvColors)}
                        
                        {/* Dynamic Indicator Lines */}
                        {this.renderIndicatorLines(indicators, enabledIndicators, tvColors, importedIndicators, data)}
                        
                        {/* Line Tools - Render different components based on currentTool */}
                        {this.renderLineTools()}
                        
                        {/* Fibonacci Retracement with selection support */}
                        <FibonacciRetracement
                            enabled={enableFibonacci}
                            type="BOUND"
                            onStart={() => {}}
                            onComplete={(e: any, newFibs: any[], moreProps: any) => {
                                if (onFibonacciComplete) {
                                    onFibonacciComplete(newFibs);
                                }
                            }}
                            onDragStart={(e: any, interactives: any[], moreProps: any) => {
                                if (onFibonacciSelect && interactives.length > 0) {
                                    onFibonacciSelect(e, interactives);
                                }
                            }}
                            onDragComplete={(e: any, newFibs: any[], moreProps: any) => {
                                if (onFibonacciSelect && newFibs.length > 0) {
                                    onFibonacciSelect(e, newFibs);
                                }
                            }}
                            onSelect={onFibonacciSelect}
                            retracements={fibonacciRetracements.map((fib, index) => ({
                                ...fib,
                                selected: selectedFibs.includes(index)
                            }))}
                            appearance={{
                                strokeStyle: "#ff9800", // TradingView orange
                                strokeWidth: 1,
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', sans-serif",
                                fontSize: 11,
                                fontFill: tvColors.text,
                                edgeStroke: "#ff9800",
                                edgeFill: "#ff9800",
                                nsEdgeFill: tvColors.background,
                                edgeStrokeWidth: 1,
                                r: 3,
                            }}
                            hoverText={{
                                enable: false,
                            }}
                            currentPositionStroke="#ff9800"
                            currentPositionStrokeWidth={2}
                            currentPositionRadius={4}
                        />
                        
                        {/* Triangle Pattern Component */}
                        <TrianglePattern
                            enabled={enablePatterns}
                            onStart={() => {}}
                            onComplete={(e: any, newTriangles: any[], moreProps: any) => {
                                if (onTriangleComplete) {
                                    onTriangleComplete(newTriangles);
                                }
                            }}
                            onDrag={(e: any, index: number, newTriangleData: any) => {
                                // Update triangle position during drag for smooth feedback
                                console.log('🔄 Triangle drag update:', index, newTriangleData);
                                // For now, just log - we'd need state management for real-time updates
                            }}
                            onDragComplete={(e: any, newTriangles: any[], moreProps: any) => {
                                if (onTriangleComplete) {
                                    console.log('✅ Triangle pattern drag completed:', newTriangles);
                                    onTriangleComplete(newTriangles);
                                }
                            }}
                            onSelect={onTriangleSelect}
                            triangles={trianglePatterns.map((triangle, index) => ({
                                ...triangle,
                                selected: selectedTriangles.includes(index)
                            }))}
                            appearance={{
                                strokeStyle: "#9c27b0", // Purple for triangles
                                strokeWidth: 2,
                                fillStyle: "#9c27b0",
                                fillOpacity: 0.05,
                                edgeStrokeWidth: 1,
                                edgeFill: "#9c27b0",
                                edgeStroke: "#9c27b0",
                                r: 4,
                            }}
                            hoverText={{
                                enable: false,
                            }}
                            currentPositionStroke="#9c27b0"
                            currentPositionStrokeWidth={2}
                            currentPositionRadius={4}
                        />

                        {/* Label Component - Single point text annotations using InteractiveText */}
                        <InteractiveText
                            enabled={currentTool === 'label'}
                            textList={labels?.map((label, index) => ({
                                ...label,
                                position: [label.x, label.y],
                                text: label.text || "Label",
                                selected: selectedLabels.includes(index)
                            }))}
                            onChoosePosition={(e: any, newText: any, moreProps: any) => {
                                if (onLabelComplete) {
                                    const newLabel = {
                                        x: newText.position[0],
                                        y: newText.position[1],
                                        text: newText.text,
                                        selected: true
                                    };
                                    onLabelComplete([
                                        ...labels.map(l => ({ ...l, selected: false })),
                                        newLabel
                                    ]);
                                }
                            }}
                            onSelect={onLabelSelect || (() => {})}
                            onDragComplete={(e: any, newTextList: any[], moreProps: any) => {
                                if (onLabelComplete && newTextList.length > 0) {
                                    const newLabels = newTextList.map(text => ({
                                        x: text.position[0],
                                        y: text.position[1],
                                        text: text.text,
                                        selected: text.selected
                                    }));
                                    onLabelComplete(newLabels);
                                }
                            }}
                            defaultText={{
                                bgFill: "#ffffff",
                                bgOpacity: 0.9,
                                bgStrokeWidth: 1,
                                bgStroke: "#666666",
                                textFill: "#000000",
                                fontFamily: "-apple-system, system-ui, Roboto, 'Helvetica Neue', Ubuntu, sans-serif",
                                fontSize: 12,
                                fontStyle: "normal",
                                fontWeight: "normal",
                                text: "Label",
                            }}
                            hoverText={{
                                enable: true,
                                bgHeight: "auto",
                                bgWidth: "auto",
                                text: "Click to place label",
                            }}
                        />

                        {/* Trend Channel Component - Standalone like Triangle */}
                        <EquidistantChannel
                            enabled={enableTrendChannel}
                            snap={false}
                            channels={trendChannels.map((channel, index) => ({
                                ...channel,
                                selected: selectedChannels.includes(index)
                            }))}
                            onStart={() => {}}
                            onComplete={(e: any, newChannels: any[], moreProps: any) => {
                                if (onTrendChannelComplete) {
                                    onTrendChannelComplete(newChannels);
                                }
                            }}
                            onSelect={onTrendChannelSelect || (() => {})}
                            currentPositionStroke="#9c27b0"
                            currentPositionStrokeWidth={3}
                            currentPositionRadius={4}
                            appearance={{
                                stroke: "#9c27b0",
                                strokeOpacity: 0.8,
                                strokeWidth: 2,
                                fill: "#9c27b0",
                                fillOpacity: 0.05,
                                edgeStroke: "#9c27b0",
                                edgeFill: "#FFFFFF",
                                edgeFill2: "#9c27b0",
                                edgeStrokeWidth: 2,
                                r: 6,
                            }}
                            onDragComplete={(e: any, newChannels: any[], moreProps: any) => {
                                if (onTrendChannelComplete && newChannels.length > 0) {
                                    onTrendChannelComplete(newChannels);
                                }
                            }}
                            hoverText={{
                                enable: true,
                                bgHeight: "auto",
                                bgWidth: "auto", 
                                text: "Click to select trend channel",
                                selectedText: "Trend channel selected",
                            }}
                        />

                        {/* Trend Line Component - Unified Drawing and Interaction */}
                        <TrendLine
                            enabled={currentTool === 'trendline'} // Only enable drawing when trendline tool is active
                            snap={false}
                            onStart={() => {}}
                            onComplete={(e: any, newTrends: any[], moreProps: any) => {
                                if (onTrendLineComplete && newTrends.length > 0) {
                                    onTrendLineComplete(newTrends);
                                }
                            }}
                            onDragStart={(e: any, interactives: any[], moreProps: any) => {
                                if (onTrendLineSelect && interactives.length > 0) {
                                    onTrendLineSelect(e, interactives);
                                }
                            }}
                            onDragComplete={(e: any, newTrends: any[], moreProps: any) => {
                                if (onTrendLineComplete && newTrends.length > 0) {
                                    onTrendLineComplete(newTrends);
                                }
                                if (onTrendLineSelect && newTrends.length > 0) {
                                    onTrendLineSelect(e, newTrends);
                                }
                            }}
                            onSelect={onTrendLineSelect}
                            trends={trendLines.filter(trend =>
                                // Only include regular trend lines, not channel data or horizontal rays
                                // Horizontal rays have identical Y coordinates (start[1] === end[1])
                                !trend.channelType && !(trend.start?.[1] === trend.end?.[1])
                            ).map((trend, index) => ({
                                ...trend,
                                selected: selectedTrendLines.includes(index)
                            }))}
                            hoverText={{
                                enable: true,
                                bgHeight: "auto",
                                bgWidth: "auto",
                                text: "Click to select trend line",
                                selectedText: "Trend line selected",
                            }}
                            type="LINE"
                            appearance={{
                                strokeStyle: "#2196f3", // Blue for trend lines
                                strokeWidth: 2,
                                strokeDasharray: "Solid",
                                edgeStrokeWidth: 2,
                                edgeFill: "#2196f3",
                                edgeStroke: "#2196f3",
                            }}
                            currentPositionStroke="#2196f3"
                            currentPositionStrokeWidth={3}
                            currentPositionRadius={4}
                        />

                        {/* Horizontal Line Component - Persistent Display */}
                        <HorizontalLine
                            enabled={currentTool === 'horizontalline'} // Only enable drawing when horizontal line tool is active
                            snap={false}
                            snapTo={(d: any) => [d.high, d.low]}
                            onStart={() => {}}
                            onComplete={(e: any, newLines: any[], moreProps: any) => {
                                if (this.props.onHorizontalLineComplete && newLines.length > 0) {
                                    this.props.onHorizontalLineComplete(newLines);
                                }
                            }}
                            onDragStart={(e: any, interactives: any[], moreProps: any) => {
                                if (this.props.onHorizontalLineSelect && interactives.length > 0) {
                                    this.props.onHorizontalLineSelect(e, interactives);
                                }
                            }}
                            onDragComplete={(e: any, newLines: any[], moreProps: any) => {
                                if (this.props.onHorizontalLineComplete && newLines.length > 0) {
                                    this.props.onHorizontalLineComplete(newLines);
                                }
                                if (this.props.onHorizontalLineSelect && newLines.length > 0) {
                                    this.props.onHorizontalLineSelect(e, newLines);
                                }
                            }}
                            onSelect={this.props.onHorizontalLineSelect}
                            trends={(this.props.horizontalLines || []).map((line, index) => ({
                                ...line,
                                selected: (this.props.selectedHorizontalLines || []).includes(index)
                            }))}
                            hoverText={{
                                enable: true,
                                bgHeight: "auto",
                                bgWidth: "auto",
                                text: "Click to select horizontal line",
                                selectedText: "Horizontal line selected",
                            }}
                            type="XLINE"
                            appearance={{
                                strokeStyle: "#f44336", // Red for horizontal lines
                                strokeWidth: 2,
                                strokeDasharray: "Solid",
                                edgeStrokeWidth: 2,
                                edgeFill: "#f44336",
                                edgeStroke: "#f44336",
                            }}
                            currentPositionStroke="#f44336"
                            currentPositionStrokeWidth={3}
                            currentPositionRadius={4}
                        />

                        {/* Horizontal Ray Component - Persistent Display */}
                        <HorizontalRay
                            enabled={currentTool === 'horizontalray'} // Only enable drawing when horizontal ray tool is active
                            snap={false}
                            snapTo={(d: any) => [d.high, d.low]}
                            onStart={() => {}}
                            onComplete={(e: any, newRays: any[], moreProps: any) => {
                                if (this.props.onHorizontalRayComplete && newRays.length > 0) {
                                    this.props.onHorizontalRayComplete(newRays);
                                }
                            }}
                            onDragStart={(e: any, interactives: any[], moreProps: any) => {
                                if (this.props.onHorizontalRaySelect && interactives.length > 0) {
                                    this.props.onHorizontalRaySelect(e, interactives);
                                }
                            }}
                            onDragComplete={(e: any, newRays: any[], moreProps: any) => {
                                if (this.props.onHorizontalRayComplete && newRays.length > 0) {
                                    this.props.onHorizontalRayComplete(newRays);
                                }
                                if (this.props.onHorizontalRaySelect && newRays.length > 0) {
                                    this.props.onHorizontalRaySelect(e, newRays);
                                }
                            }}
                            onSelect={this.props.onHorizontalRaySelect}
                            trends={(this.props.horizontalRays || []).map((ray, index) => ({
                                ...ray,
                                selected: (this.props.selectedHorizontalRays || []).includes(index)
                            }))}
                            hoverText={{
                                enable: true,
                                bgHeight: "auto",
                                bgWidth: "auto",
                                text: "Click to select horizontal ray",
                                selectedText: "Horizontal ray selected",
                            }}
                            type="RAY"
                            appearance={{
                                strokeStyle: "#795548", // Brown for horizontal rays
                                strokeWidth: 2,
                                strokeDasharray: "Solid",
                                edgeStrokeWidth: 2,
                                edgeFill: "#795548",
                                edgeStroke: "#795548",
                            }}
                            currentPositionStroke="#795548"
                            currentPositionStrokeWidth={3}
                            currentPositionRadius={4}
                        />

                        {/* Vertical Line Component - Persistent Display */}
                        <VerticalLine
                            enabled={currentTool === 'verticalline'} // Only enable drawing when vertical line tool is active
                            snap={false}
                            onStart={() => {}}
                            onComplete={(e: any, newLines: any[], moreProps: any) => {
                                if (this.props.onVerticalLineComplete && newLines.length > 0) {
                                    this.props.onVerticalLineComplete(newLines);
                                }
                            }}
                            onDragStart={(e: any, interactives: any[], moreProps: any) => {
                                if (this.props.onVerticalLineSelect && interactives.length > 0) {
                                    this.props.onVerticalLineSelect(e, interactives);
                                }
                            }}
                            onDragComplete={(e: any, newLines: any[], moreProps: any) => {
                                if (this.props.onVerticalLineComplete && newLines.length > 0) {
                                    this.props.onVerticalLineComplete(newLines);
                                }
                                if (this.props.onVerticalLineSelect && newLines.length > 0) {
                                    this.props.onVerticalLineSelect(e, newLines);
                                }
                            }}
                            onSelect={this.props.onVerticalLineSelect}
                            trends={(this.props.verticalLines || []).map((line, index) => ({
                                ...line,
                                selected: (this.props.selectedVerticalLines || []).includes(index)
                            }))}
                            hoverText={{
                                enable: true,
                                bgHeight: "auto",
                                bgWidth: "auto",
                                text: "Click to select vertical line",
                                selectedText: "Vertical line selected",
                            }}
                            type="XLINE"
                            appearance={{
                                strokeStyle: "#e91e63", // Pink for vertical lines
                                strokeWidth: 2,
                                strokeDasharray: "Solid",
                                edgeStrokeWidth: 2,
                                edgeFill: "#e91e63",
                                edgeStroke: "#e91e63",
                            }}
                            currentPositionStroke="#e91e63"
                            currentPositionStrokeWidth={3}
                            currentPositionRadius={4}
                        />

                        {/* Persistent display handled in renderLineTools default case */}
                        
                        <MouseCoordinateY 
                            rectWidth={80} 
                            displayFormat={this.preciseDisplayFormat}
                            fill={tvColors.background}
                            stroke={tvColors.grid}
                            textFill={tvColors.text}
                        />
                        
                        <EdgeIndicator
                            itemType="last"
                            rectWidth={80}
                            fill={this.openCloseColor}
                            lineStroke={this.openCloseColor}
                            displayFormat={this.preciseDisplayFormat}
                            yAccessor={this.yEdgeIndicator}
                            textFill="#ffffff"
                        />
                        
                        <MovingAverageTooltip
                            origin={[8, 24]}
                            textFill={tvColors.text}
                            options={this.getTooltipOptions(indicators, enabledIndicators)}
                        />

                        <ZoomButtons 
                            fill={tvColors.background}
                            stroke={tvColors.grid}
                            textFill={tvColors.text}
                            onReset={this.props.onRefresh}
                        />
                        
                        <OHLCTooltip 
                            origin={[8, 16]}
                            textFill={tvColors.text}
                        />
                        
                        {/* Replay Timestamp Indicator */}
                        {this.props.isReplayMode && this.props.replayPosition && this.props.fullData && this.props.fullData.length > 0 && (
                            <g className="replay-timestamp-indicator">
                                <rect
                                    x={8}
                                    y={height - elderRayHeight - 50}
                                    width={200}
                                    height={24}
                                    fill="rgba(41, 98, 255, 0.9)"
                                    rx={4}
                                    ry={4}
                                />
                                <text
                                    x={18}
                                    y={height - elderRayHeight - 32}
                                    fill="#ffffff"
                                    fontSize="12"
                                    fontFamily="'Roboto Mono', Monaco, Consolas, monospace"
                                    fontWeight="600"
                                >
                                    📊 Replay: {this.formatReplayTimestamp(this.props.replayPosition, this.props.fullData)}
                                </text>
                            </g>
                        )}
                        
                        {/* Replay Progress Line */}
                        {this.props.isReplayMode && this.props.replayPosition && data.length > 0 && (
                            <g className="replay-progress-line">
                                <line
                                    x1={this.getReplayLineX(this.props.replayPosition, data, xScale, displayXAccessor)}
                                    y1={0}
                                    x2={this.getReplayLineX(this.props.replayPosition, data, xScale, displayXAccessor)}
                                    y2={chartHeight}
                                    stroke="rgba(41, 98, 255, 0.8)"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                />
                                <circle
                                    cx={this.getReplayLineX(this.props.replayPosition, data, xScale, displayXAccessor)}
                                    cy={10}
                                    r="4"
                                    fill="rgba(41, 98, 255, 1)"
                                    stroke="#ffffff"
                                    strokeWidth="1"
                                />
                            </g>
                        )}
                    </Chart>
                    
                    {/* Elder Ray Chart - Conditionally Rendered */}
                    {enabledIndicators.elderRay && elder && (
                        <Chart
                            id={4}
                            height={elderRayHeight}
                            yExtents={[0, elder.accessor()]}
                            origin={elderRayOrigin}
                            padding={{ top: 8, bottom: 8 }}
                        >
                            <XAxis 
                                showGridLines 
                                gridLinesStrokeStyle={tvColors.grid}
                                stroke={tvColors.grid}
                                tickStroke={tvColors.text}
                                tickLabelFill={tvColors.text}
                            />
                            <YAxis 
                                ticks={4} 
                                tickFormat={this.preciseDisplayFormat}
                                stroke={tvColors.grid}
                                tickStroke={tvColors.text}
                                tickLabelFill={tvColors.text}
                            />

                            <MouseCoordinateX 
                                displayFormat={timeDisplayFormat}
                                fill={tvColors.background}
                                stroke={tvColors.grid}
                                textFill={tvColors.text}
                            />
                            <MouseCoordinateY 
                                rectWidth={80} 
                                displayFormat={this.preciseDisplayFormat}
                                fill={tvColors.background}
                                stroke={tvColors.grid}
                                textFill={tvColors.text}
                            />

                            <ElderRaySeries 
                                yAccessor={elder.accessor()} 
                                fillStyle={{
                                    bearPower: tvColors.red,
                                    bullPower: tvColors.green
                                }}
                                strokeStyle={{
                                    bearPower: tvColors.red,
                                    bullPower: tvColors.green
                                }}
                            />

                            <SingleValueTooltip
                                yAccessor={elder.accessor()}
                                yLabel="Elder Ray"
                                yDisplayFormat={(d: any) =>
                                    `${this.pricesDisplayFormat(d.bullPower)}, ${this.pricesDisplayFormat(d.bearPower)}`
                                }
                                origin={[8, 16]}
                                textFill={tvColors.text}
                                labelFill={tvColors.text}
                                valueFill={tvColors.text}
                                backgroundFill="rgba(0, 0, 0, 0)"
                                backgroundStroke="transparent"
                            />
                        </Chart>
                    )}
                    
                    <CrossHairCursor stroke={tvColors.grid} />
                </ChartCanvas>
                
                {/* Y-Axis Padding Resize Handle - Invisible and Full Height */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${width - margin.right}px`, // Start at beginning of entire Y-axis area
                        top: `${margin.top}px`, // Start at top of main chart
                        width: `${margin.right}px`, // Full width of right margin (includes Y-axis numbers)
                        height: `${chartHeight}px`, // Full height of main chart
                        background: this.state.isDraggingYAxis 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'transparent',
                        transition: this.state.isDraggingYAxis ? 'none' : 'background 0.2s ease',
                        cursor: 'ns-resize',
                        zIndex: 9999, // Very high z-index to ensure it appears above SVG chart elements
                        userSelect: 'none' as const,
                        pointerEvents: 'auto' // Ensure this element can receive pointer events
                    }}
                    data-testid="y-axis-resize-handle"
                    title={`Y-Axis Scaling (${Math.round((this.props.yAxisPadding || 0.1) * 100)}% padding) - Drag anywhere on Y-axis area`}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        
                        this.setState({ isDraggingYAxis: true });
                        
                        const startY = e.clientY;
                        const startPadding = this.props.yAxisPadding || 0.1;
                        
                        const handleMouseMove = (moveEvent: MouseEvent) => {
                            const deltaY = moveEvent.clientY - startY;
                            // FIXED: Drag DOWN = more padding (constrict Y-axis), Drag UP = less padding (expand Y-axis)
                            // Make the effect MUCH more dramatic and noticeable
                            const paddingDelta = (deltaY / chartHeight) * 3.0; // Much higher sensitivity
                            const newPadding = Math.max(0, startPadding + paddingDelta); // Unlimited scaling - no upper limit
                            
                            console.log(`🎛️ Y-Axis Resize: deltaY=${deltaY}, paddingDelta=${paddingDelta.toFixed(3)}, newPadding=${(newPadding * 100).toFixed(1)}%`);
                            console.log(`🎛️ Y-Axis Padding changed to ${(newPadding * 100).toFixed(1)}%`);
                            
                            if (this.props.onYAxisPaddingChange) {
                                this.props.onYAxisPaddingChange(newPadding);
                            }
                        };
                        
                        const handleMouseUp = () => {
                            this.setState({ isDraggingYAxis: false });
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                        };
                        
                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                    }}
                />
                
                {/* Resize handle positioned relative to Volume chart */}
                {enabledIndicators.volume && (
                    <div 
                        className="volume-resize-handle"
                        style={{
                            position: 'absolute',
                            top: `${margin.top + barChartOrigin(0, height - margin.top - margin.bottom)[1] - 2}px`, // Use same calculation as Volume chart
                            left: `${margin.left}px`,
                            width: `${width - margin.left - margin.right}px`,
                            height: '4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            zIndex: 1001,
                            cursor: 'ns-resize',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(74, 144, 226, 0.3)';
                            e.currentTarget.style.height = '6px';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.height = '4px';
                        }}
                        onMouseDown={(e) => {
                            console.log('Volume resize started');
                            
                            e.preventDefault();
                            const startY = e.clientY;
                            const startHeight = propVolumeHeight;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaY = moveEvent.clientY - startY;
                                // Invert the direction: dragging UP (negative deltaY) increases height
                                const newHeight = Math.max(50, Math.min(300, startHeight - deltaY));
                                if (this.props.onVolumeHeightChange) {
                                    this.props.onVolumeHeightChange(newHeight);
                                }
                            };
                            
                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                                console.log('Volume resize ended');
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                    />
                )}

                
                {enabledIndicators.elderRay && enabledIndicators.volume && (
                    <div 
                        className="elderray-resize-handle"
                        style={{
                            position: 'absolute',
                            top: `${margin.top + elderRayOrigin(0, height - margin.top - margin.bottom)[1] - 2}px`, // Use same calculation as Elder Ray chart
                            left: `${margin.left}px`,
                            width: `${width - margin.left - margin.right}px`,
                            height: '4px',
                            cursor: 'ns-resize',
                            zIndex: 1001,
                            backgroundColor: 'transparent',
                            border: 'none',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(144, 226, 74, 0.3)';
                            e.currentTarget.style.height = '6px';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.height = '4px';
                        }}
                        onMouseDown={(e) => {
                            console.log('Elder Ray resize started');
                            e.preventDefault();
                            
                            const startY = e.clientY;
                            const startHeight = propElderRayHeight;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaY = moveEvent.clientY - startY;
                                // Invert the direction: dragging UP (negative deltaY) increases height
                                const newHeight = Math.max(50, Math.min(200, startHeight - deltaY));
                                if (this.props.onElderRayHeightChange) {
                                    this.props.onElderRayHeightChange(newHeight);
                                }
                            };
                            
                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                                console.log('🔧 Elder Ray resize ended');
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                    />
                )}
            </div>
        );
    }

    private readonly barChartExtents = (data: IOHLCData) => {
        return data.volume;
    };

    private readonly candleChartExtents = (data: IOHLCData) => {
        const yAxisPadding = this.props.yAxisPadding || 0.1; // Default 10% padding
        const range = data.high - data.low;
        
        // Allow unlimited scaling: use exponential expansion for large padding values
        // For padding > 1, use exponential multiplier to allow truly unlimited scaling
        let paddingMultiplier = yAxisPadding;
        if (yAxisPadding > 1) {
            paddingMultiplier = Math.pow(yAxisPadding, 1.5); // Exponential expansion for unlimited scaling
        }
        
        const padding = range * paddingMultiplier;
        const extents = [data.high + padding, data.low - padding];
        console.log(`📊 Y-Axis Extents: padding=${(yAxisPadding * 100).toFixed(1)}%, multiplier=${paddingMultiplier.toFixed(2)}, range=${range.toFixed(2)}, extents=[${extents[0].toFixed(2)}, ${extents[1].toFixed(2)}]`);
        return extents;
    };

    private readonly yEdgeIndicator = (data: IOHLCData) => {
        return data.close;
    };

    private readonly volumeColor = (data: IOHLCData) => {
        return data.close > data.open ? "rgba(8, 153, 129, 0.3)" : "rgba(242, 54, 69, 0.3)";
    };

    private readonly volumeSeries = (data: IOHLCData) => {
        return data.volume;
    };

    private readonly openCloseColor = (data: IOHLCData) => {
        return data.close > data.open ? "#089981" : "#f23645";
    };

    private readonly getFibonacciColor = (index: number) => {
        // TradingView-style Fibonacci level colors
        const colors = [
            "#787b86", // 0% - Gray
            "#f23645", // 23.6% - Red
            "#ff9800", // 38.2% - Orange  
            "#ffeb3b", // 50% - Yellow
            "#4caf50", // 61.8% - Green
            "#00bcd4", // 78.6% - Cyan
            "#9c27b0", // 100% - Purple
            "#2196f3", // 127.2% - Blue
            "#3f51b5", // 161.8% - Indigo
        ];
        return colors[index % colors.length] || "#ff9800";
    };

    private readonly getFibonacciColorByLevel = (fib: any) => {
        // Look at the fibonacci level and return appropriate TradingView color
        if (!fib || !fib.y1 || !fib.y2) return "#ff9800";
        
        // Calculate the percentage based on y values
        const range = Math.abs(fib.y2 - fib.y1);
        const levels = [
            { percent: 0, color: "#787b86" },     // 0% - Gray
            { percent: 23.6, color: "#f23645" }, // 23.6% - Red
            { percent: 38.2, color: "#ff9800" }, // 38.2% - Orange
            { percent: 50, color: "#ffeb3b" },    // 50% - Yellow
            { percent: 61.8, color: "#4caf50" }, // 61.8% - Green
            { percent: 78.6, color: "#00bcd4" }, // 78.6% - Cyan
            { percent: 100, color: "#9c27b0" },   // 100% - Purple
        ];
        
        // Default to orange if we can't determine the level
        return "#ff9800";
    };

    private readonly formatReplayTimestamp = (position: number, fullData: IOHLCData[]): string => {
        if (!fullData || position <= 0 || position > fullData.length) {
            return "N/A";
        }
        
        const dataPoint = fullData[position - 1];
        if (!dataPoint || !dataPoint.date) {
            return "N/A";
        }
        
        const date = new Date(dataPoint.date);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: dataPoint.date.getHours ? '2-digit' : undefined,
            minute: dataPoint.date.getMinutes ? '2-digit' : undefined
        }).replace(/,/g, '');
    };

    private readonly getReplayLineX = (position: number, data: IOHLCData[], xScale: any, displayXAccessor: any): number => {
        if (!data || position <= 0 || position > data.length) {
            return 0;
        }
        
        // Get the data point at the replay position
        const dataPoint = data[position - 1];
        if (!dataPoint) {
            return 0;
        }
        
        // Use the xScale to get the x-coordinate for this data point's date
        try {
            const xValue = displayXAccessor(dataPoint);
            const x = xScale(xValue);
            return x || 0;
        } catch (error) {
            console.warn('Error calculating replay line x-coordinate:', error);
            return 0;
        }
    };

    private readonly renderIndicatorLines = (indicators: any, enabledIndicators: any, tvColors: any, importedIndicators: any, data: IOHLCData[]) => {
        const indicatorComponents = [];
        
        // Define colors for each indicator
        const colors = {
            ema10: "#ff6b6b",   // Red
            ema12: "#ff9800",   // Orange  
            ema26: "#2196f3",   // Blue
            ema50: "#9c27b0",   // Purple
            ema200: "#4caf50",  // Green
            sma10: "#e91e63",   // Pink
            sma50: "#795548",   // Brown
            sma200: "#607d8b",  // Blue Grey
        };

        // Render EMA lines
        Object.entries(enabledIndicators).forEach(([key, enabled]) => {
            if (enabled && indicators[key] && key !== 'bollingerBands') {
                const color = colors[key] || tvColors.text;
                indicatorComponents.push(
                    <LineSeries 
                        key={`line-${key}`}
                        yAccessor={indicators[key].accessor()} 
                        strokeStyle={color} 
                        strokeWidth={2} 
                    />
                );
                indicatorComponents.push(
                    <CurrentCoordinate 
                        key={`coord-${key}`}
                        yAccessor={indicators[key].accessor()} 
                        fillStyle={color} 
                    />
                );
            }
        });

        // Render Bollinger Bands if enabled
        if (enabledIndicators.bollingerBands && indicators.bollingerBands) {
            indicatorComponents.push(
                <BollingerSeries
                    key="bollinger-bands"
                    yAccessor={indicators.bollingerBands.accessor()}
                    strokeStyle={{
                        top: "#8884d8",
                        middle: "#82ca9d", 
                        bottom: "#8884d8"
                    }}
                    fillStyle="rgba(136, 132, 216, 0.1)"
                />
            );
        }

        // Render imported PineScript indicators
        if (importedIndicators && importedIndicators.length > 0) {
            importedIndicators.forEach((indicator, indIndex) => {
                if (indicator.enabled && indicator.output.plots) {
                    indicator.output.plots.forEach((plot, plotIndex) => {
                        // Create accessor for this plot's values
                        const plotAccessor = (d: any) => {
                            const index = data.indexOf(d);
                            return index >= 0 && index < plot.values.length 
                                ? plot.values[index] 
                                : null;
                        };

                        // Map PineScript plot styles to chart styles
                        const strokeDasharray = plot.style === 'dashed' ? '5, 5' : 
                                               plot.style === 'circles' ? '1, 6' : 
                                               undefined;

                        indicatorComponents.push(
                            <LineSeries 
                                key={`imported-${indIndex}-${plotIndex}`}
                                yAccessor={plotAccessor}
                                strokeStyle={plot.color || '#2196F3'}
                                strokeWidth={plot.lineWidth || 2}
                                strokeDasharray={strokeDasharray}
                            />
                        );

                        // Add current coordinate indicator
                        if (plot.style !== 'circles') {
                            indicatorComponents.push(
                                <CurrentCoordinate 
                                    key={`imported-coord-${indIndex}-${plotIndex}`}
                                    yAccessor={plotAccessor}
                                    fillStyle={plot.color || '#2196F3'}
                                />
                            );
                        }
                    });
                }
            });
        }

        return indicatorComponents;
    };

    private readonly renderChartSeries = (chartType: string, tvColors: any) => {
        const upColor = tvColors.green;
        const downColor = tvColors.red;

        switch (chartType) {
            case 'candlestick':
                return (
                    <CandlestickSeries 
                        fill={(d: any) => d.close > d.open ? upColor : downColor}
                        stroke={(d: any) => d.close > d.open ? upColor : downColor}
                        wickStroke={(d: any) => d.close > d.open ? upColor : downColor}
                        candleStrokeWidth={1}
                    />
                );
            
            case 'ohlc':
                return (
                    <OHLCSeries 
                        stroke={(d: any) => d.close > d.open ? upColor : downColor}
                        strokeWidth={1}
                    />
                );
            
            case 'line':
                return (
                    <LineSeries 
                        yAccessor={(d: any) => d.close}
                        strokeStyle={tvColors.blue}
                        strokeWidth={2}
                    />
                );
            
            case 'area':
                return (
                    <AreaSeries 
                        yAccessor={(d: any) => d.close}
                        strokeStyle={tvColors.blue}
                        fillStyle="rgba(33, 150, 243, 0.1)"
                        strokeWidth={2}
                    />
                );
            
            default:
                return (
                    <CandlestickSeries 
                        fill={(d: any) => d.close > d.open ? upColor : downColor}
                        stroke={(d: any) => d.close > d.open ? upColor : downColor}
                        wickStroke={(d: any) => d.close > d.open ? upColor : downColor}
                        candleStrokeWidth={1}
                    />
                );
        }
    };

    private readonly getTooltipOptions = (indicators: any, enabledIndicators: any) => {
        const options = [];
        
        // Define colors for each indicator (same as in renderIndicatorLines)
        const colors = {
            ema10: "#ff6b6b",   // Red
            ema12: "#ff9800",   // Orange  
            ema26: "#2196f3",   // Blue
            ema50: "#9c27b0",   // Purple
            ema200: "#4caf50",  // Green
            sma10: "#e91e63",   // Pink
            sma50: "#795548",   // Brown
            sma200: "#607d8b",  // Blue Grey
        };

        // Add enabled indicators to tooltip
        Object.entries(enabledIndicators).forEach(([key, enabled]) => {
            if (enabled && indicators[key] && key !== 'bollingerBands') {
                const color = colors[key];
                const type = key.startsWith('ema') ? 'EMA' : 'SMA';
                const windowSize = indicators[key].options().windowSize;
                
                options.push({
                    yAccessor: indicators[key].accessor(),
                    type: type,
                    stroke: color,
                    windowSize: windowSize,
                });
            }
        });

        return options;
    };
}

// Memoize the component to prevent unnecessary re-renders during wheel scroll
const MemoizedStockChartWithTools = React.memo(StockChartWithTools);

// Apply HOCs in a way that prevents unnecessary re-renders
const SizedChart = withSize({ style: { minHeight: 600 } })(MemoizedStockChartWithTools);
const FinalChart = withDeviceRatio()(SizedChart);

export default React.memo(FinalChart);