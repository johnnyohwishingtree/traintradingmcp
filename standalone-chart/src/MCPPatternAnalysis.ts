import { MCPElement } from "@slowclap/financial-charts";
import { IOHLCData } from "./withOHLCData";

export interface PatternConfig {
    lookback: number;
    minDecline: number;
    minAdvance: number;
}

export interface LocalBottom {
    index: number;
    date: Date;
    low: number;
    declinePercent: number;
    xValue: number;
}

export interface LocalTop {
    index: number;
    date: Date;
    high: number;
    advancePercent: number;
    xValue: number;
}

export interface VolumeSpike {
    index: number;
    date: Date;
    volume: number;
    price: number;
    volumeRatio: number;
    xValue: number;
}

/**
 * LLM-powered pattern recognition for chart analysis
 */
export class MCPPatternAnalyzer {
    private data: IOHLCData[];
    private xAccessor: (datum: any) => number;

    constructor(data: IOHLCData[], xAccessor: (datum: any) => number) {
        this.data = data;
        this.xAccessor = xAccessor;
    }

    /**
     * Find local bottoms using swing low analysis
     */
    findLocalBottoms(config: PatternConfig): LocalBottom[] {
        const bottoms: LocalBottom[] = [];
        
        for (let i = config.lookback; i < this.data.length - config.lookback; i++) {
            const current = this.data[i];
            const beforePeriod = this.data.slice(i - config.lookback, i);
            const afterPeriod = this.data.slice(i + 1, i + config.lookback + 1);
            
            // Check if current low is lower than surrounding periods
            const isLocalBottom = beforePeriod.every(d => current.low <= d.low) &&
                                 afterPeriod.every(d => current.low <= d.low);
            
            if (isLocalBottom) {
                // Verify significant decline before bottom
                const highBefore = Math.max(...beforePeriod.map(d => d.high));
                const declinePercent = (highBefore - current.low) / highBefore;
                
                if (declinePercent >= config.minDecline) {
                    bottoms.push({
                        index: i,
                        date: current.date,
                        low: current.low,
                        declinePercent: declinePercent,
                        xValue: this.xAccessor(current)
                    });
                }
            }
        }
        
        return bottoms.slice(-5); // Return last 5 most recent bottoms
    }

    /**
     * Find local tops using swing high analysis
     */
    findLocalTops(config: PatternConfig): LocalTop[] {
        const tops: LocalTop[] = [];
        
        for (let i = config.lookback; i < this.data.length - config.lookback; i++) {
            const current = this.data[i];
            const beforePeriod = this.data.slice(i - config.lookback, i);
            const afterPeriod = this.data.slice(i + 1, i + config.lookback + 1);
            
            // Check if current high is higher than surrounding periods
            const isLocalTop = beforePeriod.every(d => current.high >= d.high) &&
                              afterPeriod.every(d => current.high >= d.high);
            
            if (isLocalTop) {
                // Verify significant advance before top
                const lowBefore = Math.min(...beforePeriod.map(d => d.low));
                const advancePercent = (current.high - lowBefore) / lowBefore;
                
                if (advancePercent >= config.minAdvance) {
                    tops.push({
                        index: i,
                        date: current.date,
                        high: current.high,
                        advancePercent: advancePercent,
                        xValue: this.xAccessor(current)
                    });
                }
            }
        }
        
        return tops.slice(-5); // Return last 5 most recent tops
    }

    /**
     * Find volume spikes that could indicate significant events
     */
    findVolumeSpikes(): VolumeSpike[] {
        const spikes: VolumeSpike[] = [];
        const volumeData = this.data.filter(d => d.volume && d.volume > 0);
        
        if (volumeData.length < 20) return spikes;
        
        // Calculate average volume over last 20 periods
        const recentVolumes = volumeData.slice(-20).map(d => d.volume);
        const avgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
        
        // Find volume spikes (3x average volume)
        for (let i = volumeData.length - 10; i < volumeData.length; i++) {
            const current = volumeData[i];
            const volumeRatio = current.volume / avgVolume;
            
            if (volumeRatio >= 3.0) {
                spikes.push({
                    index: i,
                    date: current.date,
                    volume: current.volume,
                    price: current.close,
                    volumeRatio: volumeRatio,
                    xValue: this.xAccessor(current)
                });
            }
        }
        
        return spikes;
    }

    /**
     * Generate MCP label elements from pattern analysis
     */
    generateMCPLabels(config: PatternConfig): MCPElement[] {
        const labels: MCPElement[] = [];
        
        console.log('🤖 LLM analyzing chart patterns...');
        
        // Find local bottoms
        const bottoms = this.findLocalBottoms(config);
        bottoms.forEach((bottom, index) => {
            labels.push({
                id: `bottom_${bottom.index}`,
                type: 'label',
                data: {
                    position: [bottom.xValue, bottom.low * 0.98], // Position slightly below the low
                    text: `Local Bottom\n$${bottom.low.toFixed(2)}\n${(bottom.declinePercent * 100).toFixed(1)}% decline`,
                    direction: 'up',
                    priority: 'high'
                },
                appearance: {
                    bgFill: '#e8f5e8',
                    bgStroke: '#4caf50',
                    textFill: '#2e7d32',
                    fontSize: 11,
                    fontWeight: 'bold'
                },
                selected: false
            });
        });

        // Find local tops
        const tops = this.findLocalTops(config);
        tops.forEach((top, index) => {
            labels.push({
                id: `top_${top.index}`,
                type: 'label',
                data: {
                    position: [top.xValue, top.high * 1.02], // Position slightly above the high
                    text: `Local Top\n$${top.high.toFixed(2)}\n${(top.advancePercent * 100).toFixed(1)}% advance`,
                    direction: 'down',
                    priority: 'high'
                },
                appearance: {
                    bgFill: '#ffebee',
                    bgStroke: '#f44336',
                    textFill: '#c62828',
                    fontSize: 11,
                    fontWeight: 'bold'
                },
                selected: false
            });
        });

        // Find volume spikes
        const spikes = this.findVolumeSpikes();
        spikes.forEach((spike, index) => {
            labels.push({
                id: `volume_${spike.index}`,
                type: 'label',
                data: {
                    position: [spike.xValue, spike.price * 1.05],
                    text: `Volume Spike\n${(spike.volumeRatio).toFixed(1)}x avg\n${(spike.volume / 1000000).toFixed(1)}M`,
                    direction: 'neutral',
                    priority: 'medium'
                },
                appearance: {
                    bgFill: '#fff3e0',
                    bgStroke: '#ff9800',
                    textFill: '#f57c00',
                    fontSize: 10,
                    fontWeight: 'normal'
                },
                selected: false
            });
        });

        console.log(`✅ Generated ${labels.length} intelligent labels:`, {
            bottoms: bottoms.length,
            tops: tops.length,
            volumeSpikes: spikes.length
        });

        return labels;
    }

    /**
     * Generate actionable trendlines that provide clear price targets and contain recent price action
     */
    generateMCPTrendlines(config: PatternConfig): MCPElement[] {
        const elements: MCPElement[] = [];
        
        console.log('📈 LLM generating actionable trendlines for price targets...');
        
        // Focus on recent 50 candles for actionable analysis
        const recentDataPoints = 50;
        const startIndex = Math.max(0, this.data.length - recentDataPoints);
        const recentData = this.data.slice(startIndex);
        const recentStartX = this.xAccessor(recentData[0]);
        const recentEndX = this.xAccessor(recentData[recentData.length - 1]);
        
        console.log(`🎯 Analyzing last ${recentData.length} candles for actionable support/resistance`);
        
        // 1. Create ascending support trendline (bullish scenario)
        const ascendingSupport = this.createAscendingSupportLine(recentData, startIndex);
        if (ascendingSupport) elements.push(ascendingSupport);
        
        // 2. Create descending resistance trendline (bearish scenario)  
        const descendingResistance = this.createDescendingResistanceLine(recentData, startIndex);
        if (descendingResistance) elements.push(descendingResistance);
        
        // 3. Create horizontal support/resistance at key levels
        const horizontalLevels = this.createHorizontalSupportResistance(recentData, startIndex);
        elements.push(...horizontalLevels);
        
        // 4. Create trend channel if clear trend exists
        if (ascendingSupport && descendingResistance) {
            const trendChannel = this.createContainingTrendChannel(recentData, startIndex);
            if (trendChannel) elements.push(...trendChannel);
        }
        
        console.log(`✅ Generated ${elements.length} actionable trendlines with price targets`);
        return elements;
    }

    private createAscendingSupportLine(recentData: IOHLCData[], globalStartIndex: number): MCPElement | null {
        // Find ascending support by connecting rising lows
        const lows: {index: number, price: number, x: number}[] = [];
        
        // Identify significant lows in recent data
        for (let i = 2; i < recentData.length - 2; i++) {
            const current = recentData[i];
            const before = recentData.slice(Math.max(0, i-2), i);
            const after = recentData.slice(i+1, Math.min(recentData.length, i+3));
            
            // Check if this is a local low
            if (before.every(d => current.low <= d.low) && after.every(d => current.low <= d.low)) {
                lows.push({
                    index: globalStartIndex + i,
                    price: current.low,
                    x: this.xAccessor(current)
                });
            }
        }
        
        if (lows.length < 2) return null;
        
        // Find the best ascending line through these lows
        let bestLine = null;
        let mostTouchPoints = 0;
        
        for (let i = 0; i < lows.length - 1; i++) {
            for (let j = i + 1; j < lows.length; j++) {
                const low1 = lows[i];
                const low2 = lows[j];
                
                // Only consider ascending lines
                if (low2.price <= low1.price) continue;
                
                // Count how many lows are near this line
                const slope = (low2.price - low1.price) / (low2.x - low1.x);
                let touchPoints = 2; // The two points we're connecting
                
                for (const testLow of lows) {
                    if (testLow === low1 || testLow === low2) continue;
                    
                    const expectedPrice = low1.price + slope * (testLow.x - low1.x);
                    const deviation = Math.abs(testLow.price - expectedPrice);
                    const tolerance = (low2.price - low1.price) * 0.02; // 2% tolerance
                    
                    if (deviation <= tolerance) touchPoints++;
                }
                
                if (touchPoints > mostTouchPoints) {
                    mostTouchPoints = touchPoints;
                    bestLine = {
                        start: [low1.x, low1.price],
                        end: [this.xAccessor(recentData[recentData.length - 1]) + 20, low2.price + slope * (this.xAccessor(recentData[recentData.length - 1]) + 20 - low2.x)],
                        touchPoints
                    };
                }
            }
        }
        
        if (!bestLine || mostTouchPoints < 2) return null;
        
        return {
            id: `ascending_support_${Date.now()}`,
            type: 'trendline',
            data: {
                start: bestLine.start,
                end: bestLine.end,
                id: `ascending_support_${Date.now()}`
            },
            appearance: {
                strokeStyle: '#4caf50', // Green for bullish support
                strokeWidth: 2,
                strokeDasharray: 'Solid',
                edgeStrokeWidth: 2,
                edgeFill: '#4caf50',
                edgeStroke: '#4caf50'
            },
            selected: false
        };
    }

    private createDescendingResistanceLine(recentData: IOHLCData[], globalStartIndex: number): MCPElement | null {
        // Find descending resistance by connecting falling highs
        const highs: {index: number, price: number, x: number}[] = [];
        
        // Identify significant highs in recent data
        for (let i = 2; i < recentData.length - 2; i++) {
            const current = recentData[i];
            const before = recentData.slice(Math.max(0, i-2), i);
            const after = recentData.slice(i+1, Math.min(recentData.length, i+3));
            
            // Check if this is a local high
            if (before.every(d => current.high >= d.high) && after.every(d => current.high >= d.high)) {
                highs.push({
                    index: globalStartIndex + i,
                    price: current.high,
                    x: this.xAccessor(current)
                });
            }
        }
        
        if (highs.length < 2) return null;
        
        // Find the best descending line through these highs
        let bestLine = null;
        let mostTouchPoints = 0;
        
        for (let i = 0; i < highs.length - 1; i++) {
            for (let j = i + 1; j < highs.length; j++) {
                const high1 = highs[i];
                const high2 = highs[j];
                
                // Only consider descending lines
                if (high2.price >= high1.price) continue;
                
                // Count how many highs are near this line
                const slope = (high2.price - high1.price) / (high2.x - high1.x);
                let touchPoints = 2;
                
                for (const testHigh of highs) {
                    if (testHigh === high1 || testHigh === high2) continue;
                    
                    const expectedPrice = high1.price + slope * (testHigh.x - high1.x);
                    const deviation = Math.abs(testHigh.price - expectedPrice);
                    const tolerance = (high1.price - high2.price) * 0.02; // 2% tolerance
                    
                    if (deviation <= tolerance) touchPoints++;
                }
                
                if (touchPoints > mostTouchPoints) {
                    mostTouchPoints = touchPoints;
                    bestLine = {
                        start: [high1.x, high1.price],
                        end: [this.xAccessor(recentData[recentData.length - 1]) + 20, high2.price + slope * (this.xAccessor(recentData[recentData.length - 1]) + 20 - high2.x)],
                        touchPoints
                    };
                }
            }
        }
        
        if (!bestLine || mostTouchPoints < 2) return null;
        
        return {
            id: `descending_resistance_${Date.now()}`,
            type: 'trendline',
            data: {
                start: bestLine.start,
                end: bestLine.end,
                id: `descending_resistance_${Date.now()}`
            },
            appearance: {
                strokeStyle: '#f44336', // Red for bearish resistance
                strokeWidth: 2,
                strokeDasharray: 'Solid',
                edgeStrokeWidth: 2,
                edgeFill: '#f44336',
                edgeStroke: '#f44336'
            },
            selected: false
        };
    }

    private createHorizontalSupportResistance(recentData: IOHLCData[], globalStartIndex: number): MCPElement[] {
        const elements: MCPElement[] = [];
        
        // Find significant price levels that have been tested multiple times
        const priceMap = new Map<number, number>(); // price level -> count
        const tolerance = (Math.max(...recentData.map(d => d.high)) - Math.min(...recentData.map(d => d.low))) * 0.005; // 0.5% tolerance
        
        // Count touches at each price level
        recentData.forEach(candle => {
            const testPrices = [candle.high, candle.low, candle.open, candle.close];
            
            testPrices.forEach(price => {
                let found = false;
                for (const [level, count] of priceMap) {
                    if (Math.abs(price - level) <= tolerance) {
                        priceMap.set(level, count + 1);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    priceMap.set(price, 1);
                }
            });
        });
        
        // Find levels with 3+ touches
        const significantLevels = Array.from(priceMap.entries())
            .filter(([price, count]) => count >= 3)
            .sort((a, b) => b[1] - a[1]) // Sort by touch count
            .slice(0, 3); // Take top 3 levels
        
        const startX = this.xAccessor(recentData[0]);
        const endX = this.xAccessor(recentData[recentData.length - 1]) + 20; // Extend forward
        
        significantLevels.forEach(([price, touches], index) => {
            const currentPrice = recentData[recentData.length - 1].close;
            const isSupport = price < currentPrice;
            
            elements.push({
                id: `horizontal_${isSupport ? 'support' : 'resistance'}_${Date.now()}_${index}`,
                type: 'trendline',
                data: {
                    start: [startX, price],
                    end: [endX, price],
                    id: `horizontal_${isSupport ? 'support' : 'resistance'}_${Date.now()}_${index}`
                },
                appearance: {
                    strokeStyle: isSupport ? '#4caf50' : '#f44336',
                    strokeWidth: touches >= 4 ? 2 : 1,
                    strokeDasharray: 'ShortDash',
                    edgeStrokeWidth: 1,
                    edgeFill: isSupport ? '#4caf50' : '#f44336',
                    edgeStroke: isSupport ? '#4caf50' : '#f44336'
                },
                selected: false
            });
        });
        
        return elements;
    }

    private createContainingTrendChannel(recentData: IOHLCData[], globalStartIndex: number): MCPElement[] {
        // Create a channel that contains most of the recent price action
        const elements: MCPElement[] = [];
        
        const recentHigh = Math.max(...recentData.map(d => d.high));
        const recentLow = Math.min(...recentData.map(d => d.low));
        const channelWidth = (recentHigh - recentLow) * 0.8; // 80% of recent range
        const channelMiddle = (recentHigh + recentLow) / 2;
        
        const startX = this.xAccessor(recentData[0]);
        const endX = this.xAccessor(recentData[recentData.length - 1]) + 20;
        
        // Upper channel (resistance)
        elements.push({
            id: `trend_channel_upper_${Date.now()}`,
            type: 'trendline',
            data: {
                start: [startX, channelMiddle + channelWidth/2],
                end: [endX, channelMiddle + channelWidth/2],
                id: `trend_channel_upper_${Date.now()}`
            },
            appearance: {
                strokeStyle: '#9c27b0', // Purple for channel
                strokeWidth: 1,
                strokeDasharray: 'ShortDash',
                edgeStrokeWidth: 1,
                edgeFill: '#9c27b0',
                edgeStroke: '#9c27b0'
            },
            selected: false
        });
        
        // Lower channel (support)
        elements.push({
            id: `trend_channel_lower_${Date.now()}`,
            type: 'trendline',
            data: {
                start: [startX, channelMiddle - channelWidth/2],
                end: [endX, channelMiddle - channelWidth/2],
                id: `trend_channel_lower_${Date.now()}`
            },
            appearance: {
                strokeStyle: '#9c27b0', // Purple for channel
                strokeWidth: 1,
                strokeDasharray: 'ShortDash',
                edgeStrokeWidth: 1,
                edgeFill: '#9c27b0',
                edgeStroke: '#9c27b0'
            },
            selected: false
        });
        
        return elements;
    }
}