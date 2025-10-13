import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import * as React from "react";
import {
    elderRay,
    ema,
    sma,
    rsi,
    macd,
    bollingerBand,
    discontinuousTimeScaleProviderBuilder,
    Chart,
    ChartCanvas,
    CurrentCoordinate,
    BarSeries,
    CandlestickSeries,
    LineSeries,
    MovingAverageTooltip,
    OHLCTooltip,
    RSITooltip,
    MACDTooltip,
    BollingerBandTooltip,
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
    RSISeries,
    MACDSeries,
    BollingerSeries,
} from "react-financial-charts";
import { generateSampleData } from '../data/sampleData';

interface IOHLCData {
    readonly close: number;
    readonly date: Date;
    readonly high: number;
    readonly low: number;
    readonly open: number;
    readonly volume: number;
}

interface StockChartProps {
    data: IOHLCData[];
    symbol: {
        symbol: string;
        name: string;
        price: number;
        change: number;
        changePercent: number;
    };
    activeDrawingTool: string | null;
    selectedIndicators: string[];
    readonly height?: number;
    readonly dateTimeFormat?: string;
    readonly width?: number;
    readonly ratio?: number;
}

class StockChart extends React.Component<StockChartProps> {
    private readonly margin = { left: 0, right: 48, top: 0, bottom: 24 };
    private readonly pricesDisplayFormat = format(".2f");
    private readonly xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
        (d: IOHLCData) => d.date,
    );

    public render() {
        const { 
            data: initialData, 
            selectedIndicators, 
            dateTimeFormat = "%d %b", 
            height = 600, 
            ratio = 1, 
            width = 800 
        } = this.props;

        // Build indicators based on selectedIndicators
        let calculatedData = initialData;
        const indicators: any = {};

        // Moving Averages
        if (selectedIndicators.includes('ma') || selectedIndicators.includes('ema')) {
            const ema12 = ema()
                .id(1)
                .options({ windowSize: 12 })
                .merge((d: any, c: any) => {
                    d.ema12 = c;
                })
                .accessor((d: any) => d.ema12);

            const ema26 = ema()
                .id(2)
                .options({ windowSize: 26 })
                .merge((d: any, c: any) => {
                    d.ema26 = c;
                })
                .accessor((d: any) => d.ema26);

            const sma20 = sma()
                .id(3)
                .options({ windowSize: 20 })
                .merge((d: any, c: any) => {
                    d.sma20 = c;
                })
                .accessor((d: any) => d.sma20);

            indicators.ema12 = ema12;
            indicators.ema26 = ema26;
            indicators.sma20 = sma20;

            calculatedData = sma20(ema26(ema12(calculatedData)));
        }

        // Bollinger Bands
        if (selectedIndicators.includes('bollinger')) {
            const bb = bollingerBand()
                .merge((d: any, c: any) => {d.bb = c;})
                .accessor((d: any) => d.bb);
            
            indicators.bb = bb;
            calculatedData = bb(calculatedData);
        }

        // RSI
        if (selectedIndicators.includes('rsi')) {
            const rsiCalculator = rsi()
                .options({ windowSize: 14 })
                .merge((d: any, c: any) => {d.rsi = c;})
                .accessor((d: any) => d.rsi);
            
            indicators.rsi = rsiCalculator;
            calculatedData = rsiCalculator(calculatedData);
        }

        // MACD
        if (selectedIndicators.includes('macd')) {
            const macdCalculator = macd()
                .options({
                    fast: 12,
                    slow: 26,
                    signal: 9,
                })
                .merge((d: any, c: any) => {d.macd = c;})
                .accessor((d: any) => d.macd);
            
            indicators.macd = macdCalculator;
            calculatedData = macdCalculator(calculatedData);
        }

        const elder = elderRay();
        calculatedData = elder(calculatedData);

        const { margin, xScaleProvider } = this;

        const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);

        const max = xAccessor(data[data.length - 1]);
        const min = xAccessor(data[Math.max(0, data.length - 100)]);
        const xExtents = [min, max + 5];

        const gridHeight = height - margin.top - margin.bottom;

        // Calculate heights based on selected indicators
        const volumeHeight = selectedIndicators.includes('volume') ? 80 : 0;
        const rsiHeight = selectedIndicators.includes('rsi') ? 100 : 0;
        const macdHeight = selectedIndicators.includes('macd') ? 100 : 0;
        const elderRayHeight = 0; // Keep Elder Ray hidden for now
        const indicatorHeight = rsiHeight + macdHeight + elderRayHeight;
        const chartHeight = gridHeight - volumeHeight - indicatorHeight;

        // Origins
        const elderRayOrigin = (_: number, h: number) => [0, h - elderRayHeight];
        const barChartOrigin = (_: number, h: number) => [0, h - volumeHeight];
        const rsiOrigin = (_: number, h: number) => [0, h - volumeHeight - rsiHeight];
        const macdOrigin = (_: number, h: number) => [0, h - volumeHeight - rsiHeight - macdHeight];

        const timeDisplayFormat = timeFormat(dateTimeFormat);

        return (
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
            >
                {/* Volume Chart */}
                {selectedIndicators.includes('volume') && (
                    <Chart id={1} height={volumeHeight} origin={barChartOrigin} yExtents={this.barChartExtents}>
                        <YAxis axisAt="right" orient="right" ticks={5} tickFormat={format(".2s")} />
                        <BarSeries fillStyle={this.volumeColor} yAccessor={this.volumeSeries} />
                    </Chart>
                )}

                {/* Main Price Chart */}
                <Chart id={2} height={chartHeight} yExtents={this.candleChartExtents}>
                    <XAxis showGridLines showTicks={false} showTickLabel={false} />
                    <YAxis showGridLines tickFormat={this.pricesDisplayFormat} />
                    <CandlestickSeries />
                    
                    {/* Moving Averages */}
                    {(selectedIndicators.includes('ema') || selectedIndicators.includes('ma')) && indicators.ema12 && (
                        <>
                            <LineSeries yAccessor={indicators.ema12.accessor()} strokeStyle="#2962ff" />
                            <CurrentCoordinate yAccessor={indicators.ema12.accessor()} fillStyle="#2962ff" />
                        </>
                    )}
                    
                    {(selectedIndicators.includes('ema') || selectedIndicators.includes('ma')) && indicators.ema26 && (
                        <>
                            <LineSeries yAccessor={indicators.ema26.accessor()} strokeStyle="#ff9800" />
                            <CurrentCoordinate yAccessor={indicators.ema26.accessor()} fillStyle="#ff9800" />
                        </>
                    )}
                    
                    {selectedIndicators.includes('ma') && indicators.sma20 && (
                        <>
                            <LineSeries yAccessor={indicators.sma20.accessor()} strokeStyle="#9c27b0" />
                            <CurrentCoordinate yAccessor={indicators.sma20.accessor()} fillStyle="#9c27b0" />
                        </>
                    )}

                    {/* Bollinger Bands */}
                    {selectedIndicators.includes('bollinger') && indicators.bb && (
                        <BollingerSeries yAccessor={indicators.bb.accessor()} />
                    )}

                    <MouseCoordinateY rectWidth={margin.right} displayFormat={this.pricesDisplayFormat} />
                    <EdgeIndicator
                        itemType="last"
                        rectWidth={margin.right}
                        fill={this.openCloseColor}
                        lineStroke={this.openCloseColor}
                        displayFormat={this.pricesDisplayFormat}
                        yAccessor={this.yEdgeIndicator}
                    />
                    
                    <MovingAverageTooltip
                        origin={[8, 24]}
                        options={[
                            ...(indicators.ema26 ? [{
                                yAccessor: indicators.ema26.accessor(),
                                type: "EMA",
                                stroke: "#ff9800",
                                windowSize: indicators.ema26.options().windowSize,
                            }] : []),
                            ...(indicators.ema12 ? [{
                                yAccessor: indicators.ema12.accessor(),
                                type: "EMA",
                                stroke: "#2962ff",
                                windowSize: indicators.ema12.options().windowSize,
                            }] : []),
                            ...(indicators.sma20 ? [{
                                yAccessor: indicators.sma20.accessor(),
                                type: "SMA",
                                stroke: "#9c27b0",
                                windowSize: indicators.sma20.options().windowSize,
                            }] : []),
                        ]}
                    />

                    {selectedIndicators.includes('bollinger') && indicators.bb && (
                        <BollingerBandTooltip 
                            origin={[8, 48]} 
                            yAccessor={indicators.bb.accessor()} 
                        />
                    )}

                    <ZoomButtons />
                    <OHLCTooltip origin={[8, 16]} />
                </Chart>

                {/* RSI Chart */}
                {selectedIndicators.includes('rsi') && indicators.rsi && (
                    <Chart
                        id={3}
                        height={rsiHeight}
                        yExtents={[0, 100]}
                        origin={rsiOrigin}
                        padding={{ top: 8, bottom: 8 }}
                    >
                        <XAxis showGridLines gridLinesStrokeStyle="#363a45" />
                        <YAxis axisAt="right" orient="right" tickValues={[30, 50, 70]} />
                        <RSISeries yAccessor={indicators.rsi.accessor()} />
                        
                        <RSITooltip
                            origin={[8, 16]}
                            yAccessor={indicators.rsi.accessor()}
                            options={indicators.rsi.options()}
                        />
                    </Chart>
                )}

                {/* MACD Chart */}
                {selectedIndicators.includes('macd') && indicators.macd && (
                    <Chart
                        id={4}
                        height={macdHeight}
                        yExtents={indicators.macd.accessor()}
                        origin={macdOrigin}
                        padding={{ top: 8, bottom: 8 }}
                    >
                        <XAxis showGridLines gridLinesStrokeStyle="#363a45" />
                        <YAxis axisAt="right" orient="right" ticks={2} tickFormat={this.pricesDisplayFormat} />
                        <MACDSeries yAccessor={indicators.macd.accessor()} />
                        
                        <MACDTooltip
                            origin={[8, 16]}
                            yAccessor={indicators.macd.accessor()}
                            options={indicators.macd.options()}
                        />
                    </Chart>
                )}

                <MouseCoordinateX displayFormat={timeDisplayFormat} />
                <CrossHairCursor />
            </ChartCanvas>
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
        return data.close > data.open ? "rgba(38, 166, 154, 0.3)" : "rgba(239, 83, 80, 0.3)";
    };

    private readonly volumeSeries = (data: IOHLCData) => {
        return data.volume;
    };

    private readonly openCloseColor = (data: IOHLCData) => {
        return data.close > data.open ? "#26a69a" : "#ef5350";
    };
}

export default withSize({ style: { minHeight: 600 } })(withDeviceRatio()(StockChart));