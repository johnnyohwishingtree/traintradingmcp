import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import * as React from "react";
import {
    elderRay,
    ema,
    discontinuousTimeScaleProviderBuilder,
    Chart,
    ChartCanvas,
    CurrentCoordinate,
    BarSeries,
    CandlestickSeries,
    ElderRaySeries,
    LineSeries,
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
} from "react-financial-charts";

interface IOHLCData {
    readonly close: number;
    readonly date: Date;
    readonly high: number;
    readonly low: number;
    readonly open: number;
    readonly volume: number;
}

interface TradingViewChartProps {
    data: any[];
    selectedIndicators: string[];
    activeDrawingTool: string | null;
    loading?: boolean;
    symbol?: string;
    readonly height: number;
    readonly dateTimeFormat?: string;
    readonly width: number;
    readonly ratio: number;
}

class TradingViewChartBase extends React.Component<TradingViewChartProps> {
    private readonly margin = { left: 0, right: 48, top: 0, bottom: 24 };
    private readonly pricesDisplayFormat = format(".2f");
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
        (d: IOHLCData) => d.date,
    );

    public render() {
        const { data: rawData, dateTimeFormat = "%d %b", height, ratio, width, loading, symbol = 'Unknown', selectedIndicators, activeDrawingTool } = this.props;

        if (loading) {
            return (
                <div style={{ 
                    width: '100%', 
                    height: '400px', 
                    background: '#131722', 
                    border: '1px solid #2a2e39',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d1d4dc'
                }}>
                    <div>Loading {symbol} chart...</div>
                </div>
            );
        }

        if (!rawData || rawData.length === 0) {
            return (
                <div style={{ 
                    width: '100%', 
                    height: '400px', 
                    background: '#131722', 
                    border: '1px solid #2a2e39',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d1d4dc'
                }}>
                    <div>No chart data available for {symbol}</div>
                </div>
            );
        }

        // Transform our data to IOHLCData format
        const initialData: IOHLCData[] = rawData.map(item => ({
            date: new Date(item.date),
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close,
            volume: item.volume
        }));

        const ema12 = ema()
            .id(1)
            .options({ windowSize: 12 })
            .merge((d: any, c: any) => {
                d.ema12 = c;
            })
            .accessor((d: any) => d.ema12)
            .stroke("#2962ff"); // TradingView blue

        const ema26 = ema()
            .id(2)
            .options({ windowSize: 26 })
            .merge((d: any, c: any) => {
                d.ema26 = c;
            })
            .accessor((d: any) => d.ema26)
            .stroke("#ff6d00"); // TradingView orange

        const elder = elderRay();

        const calculatedData = elder(ema26(ema12(initialData)));

        const { margin, xScaleProvider } = this;

        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);

        const max = xAccessor(data[data.length - 1]);
        const min = xAccessor(data[Math.max(0, data.length - 50)]);
        const xExtents = [min, max + 2];

        const gridHeight = height - margin.top - margin.bottom;

        const elderRayHeight = 100;
        const elderRayOrigin = (_: number, h: number) => [0, h - elderRayHeight];
        const barChartHeight = gridHeight / 4;
        const barChartOrigin = (_: number, h: number) => [0, h - barChartHeight - elderRayHeight];
        const chartHeight = gridHeight - elderRayHeight;

        const timeDisplayFormat = timeFormat(dateTimeFormat);

        // TradingView styling
        const tvBackgroundColor = "#131722";
        const tvGridColor = "#2a2e39";
        const tvTextColor = "#d1d4dc";
        const tvGreenColor = "#089981";
        const tvRedColor = "#f23645";

        return (
            <div style={{ 
                width: '100%', 
                height: `${height}px`, 
                background: tvBackgroundColor, 
                border: `1px solid ${tvGridColor}`,
                borderRadius: '4px',
                color: tvTextColor,
                position: 'relative'
            }}>
                {/* Chart Header - TradingView style */}
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    zIndex: 10,
                    background: 'rgba(19, 23, 34, 0.9)',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }}>
                    {symbol} • Chart
                    <div style={{ fontSize: '11px', color: '#787b86', marginTop: '2px' }}>
                        🛠️ {activeDrawingTool || 'None'} • 📈 {selectedIndicators.length} indicators
                    </div>
                </div>

                <ChartCanvas
                    height={height}
                    ratio={ratio}
                    width={width}
                    margin={margin}
                    data={data}
                    displayXAccessor={displayXAccessor}
                    seriesName={`${symbol} Data`}
                    xScale={xScale}
                    xAccessor={xAccessor}
                    xExtents={xExtents}
                    zoomAnchor={lastVisibleItemBasedZoomAnchor}
                    style={{ background: tvBackgroundColor }}
                >
                    {/* Volume Chart */}
                    <Chart id={2} height={barChartHeight} origin={barChartOrigin} yExtents={this.barChartExtents}>
                        <BarSeries fillStyle={this.volumeColor} yAccessor={this.volumeSeries} />
                    </Chart>
                    
                    {/* Main Candlestick Chart */}
                    <Chart id={3} height={chartHeight} yExtents={this.candleChartExtents}>
                        <XAxis 
                            showGridLines 
                            showTicks={false} 
                            showTickLabel={false} 
                            stroke={tvGridColor}
                            tickStroke={tvTextColor}
                            gridLinesStrokeStyle={tvGridColor}
                        />
                        <YAxis 
                            showGridLines 
                            tickFormat={this.pricesDisplayFormat} 
                            stroke={tvGridColor}
                            tickStroke={tvTextColor}
                            gridLinesStrokeStyle={tvGridColor}
                        />
                        
                        {/* Candlesticks with TradingView colors */}
                        <CandlestickSeries 
                            fill={this.openCloseColor}
                            stroke={this.openCloseColor}
                            wickStroke={this.openCloseColor}
                            candleStrokeWidth={1}
                        />
                        
                        {/* Show EMAs only if selected */}
                        {selectedIndicators.includes('ma') || selectedIndicators.includes('ema') ? (
                            <>
                                <LineSeries yAccessor={ema26.accessor()} strokeStyle={ema26.stroke()} strokeWidth={2} />
                                <CurrentCoordinate yAccessor={ema26.accessor()} fillStyle={ema26.stroke()} />
                                <LineSeries yAccessor={ema12.accessor()} strokeStyle={ema12.stroke()} strokeWidth={2} />
                                <CurrentCoordinate yAccessor={ema12.accessor()} fillStyle={ema12.stroke()} />
                            </>
                        ) : null}

                        <MouseCoordinateY 
                            rectWidth={margin.right} 
                            displayFormat={this.pricesDisplayFormat}
                            fill={tvBackgroundColor}
                            stroke={tvGridColor}
                            textFill={tvTextColor}
                        />
                        
                        <EdgeIndicator
                            itemType="last"
                            rectWidth={margin.right}
                            fill={this.openCloseColor}
                            lineStroke={this.openCloseColor}
                            displayFormat={this.pricesDisplayFormat}
                            yAccessor={this.yEdgeIndicator}
                            textFill="#ffffff"
                        />
                        
                        {/* Tooltips with TradingView styling */}
                        {(selectedIndicators.includes('ma') || selectedIndicators.includes('ema')) && (
                            <MovingAverageTooltip
                                origin={[8, 60]}
                                textFill={tvTextColor}
                                labelFill={tvTextColor}
                                options={[
                                    {
                                        yAccessor: ema26.accessor(),
                                        type: "EMA",
                                        stroke: ema26.stroke(),
                                        windowSize: ema26.options().windowSize,
                                    },
                                    {
                                        yAccessor: ema12.accessor(),
                                        type: "EMA",
                                        stroke: ema12.stroke(),
                                        windowSize: ema12.options().windowSize,
                                    },
                                ]}
                            />
                        )}

                        <ZoomButtons 
                            fill={tvBackgroundColor}
                            stroke={tvGridColor}
                            textFill={tvTextColor}
                        />
                        
                        <OHLCTooltip 
                            origin={[8, 16]} 
                            textFill={tvTextColor}
                            labelFill={tvTextColor}
                            ohlcFormat={this.pricesDisplayFormat}
                        />
                    </Chart>
                    
                    {/* Elder Ray Chart - only if Elder Ray indicator selected */}
                    {selectedIndicators.includes('elder') && (
                        <Chart
                            id={4}
                            height={elderRayHeight}
                            yExtents={[0, elder.accessor()]}
                            origin={elderRayOrigin}
                            padding={{ top: 8, bottom: 8 }}
                        >
                            <XAxis 
                                showGridLines 
                                gridLinesStrokeStyle={tvGridColor}
                                stroke={tvGridColor}
                                tickStroke={tvTextColor}
                            />
                            <YAxis 
                                ticks={4} 
                                tickFormat={this.pricesDisplayFormat}
                                stroke={tvGridColor}
                                tickStroke={tvTextColor}
                            />

                            <MouseCoordinateX 
                                displayFormat={timeDisplayFormat}
                                fill={tvBackgroundColor}
                                stroke={tvGridColor}
                                textFill={tvTextColor}
                            />
                            <MouseCoordinateY 
                                rectWidth={margin.right} 
                                displayFormat={this.pricesDisplayFormat}
                                fill={tvBackgroundColor}
                                stroke={tvGridColor}
                                textFill={tvTextColor}
                            />

                            <ElderRaySeries yAccessor={elder.accessor()} />

                            <SingleValueTooltip
                                yAccessor={elder.accessor()}
                                yLabel="Elder Ray"
                                yDisplayFormat={(d: any) =>
                                    `${this.pricesDisplayFormat(d.bullPower)}, ${this.pricesDisplayFormat(d.bearPower)}`
                                }
                                origin={[8, 16]}
                                textFill={tvTextColor}
                                labelFill={tvTextColor}
                            />
                        </Chart>
                    )}
                    
                    <CrossHairCursor stroke={tvGridColor} />
                </ChartCanvas>
            </div>
        );
    }

    private readonly barChartExtents = (data: IOHLCData) => {
        return data.volume;
    };

    private readonly candleChartExtents = (data: IOHLCData) => {
        return [data.high, data.low];
    };

    private readonly yEdgeIndicator = (data: IOHLCData) => {
        return data.close;
    };

    private readonly volumeColor = (data: IOHLCData) => {
        return data.close > data.open ? "rgba(8, 153, 129, 0.3)" : "rgba(242, 54, 69, 0.3)"; // TradingView colors
    };

    private readonly volumeSeries = (data: IOHLCData) => {
        return data.volume;
    };

    private readonly openCloseColor = (data: IOHLCData) => {
        return data.close > data.open ? "#089981" : "#f23645"; // TradingView green/red
    };
}

const TradingViewChart = withSize({ style: { minHeight: 600 } })(withDeviceRatio()(TradingViewChartBase));

export default TradingViewChart;