import React, { useState } from 'react';
import { format } from "d3-format";
import { timeFormat } from "d3-time-format";
import {
    ema,
    discontinuousTimeScaleProviderBuilder,
    Chart,
    ChartCanvas,
    CandlestickSeries,
    LineSeries,
    XAxis,
    YAxis,
    CrossHairCursor,
    MouseCoordinateX,
    MouseCoordinateY,
    lastVisibleItemBasedZoomAnchor,
    withDeviceRatio,
    withSize,
    TrendLine,
    MCPElement, // Our new MCP interface
} from "@slowclap/financial-charts";
import { IOHLCData } from "./withOHLCData";

interface MCPTrendLineDemoProps {
    readonly data: IOHLCData[];
    readonly height: number;
    readonly width: number;
    readonly ratio: number;
}

const MCPTrendLineDemo: React.FC<MCPTrendLineDemoProps> = ({ data, height, width, ratio }) => {
    const [mcpElements, setMcpElements] = useState<MCPElement[]>([]);
    const [trends, setTrends] = useState<any[]>([]);
    const [mcpEnabled, setMcpEnabled] = useState(true);

    const margin = { left: 50, right: 80, top: 20, bottom: 24 };
    const xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
        (d: IOHLCData) => d.date,
    );

    // Calculate EMA for display
    const ema12 = ema()
        .id(1)
        .options({ windowSize: 12 })
        .merge((d: any, c: any) => { d.ema12 = c; })
        .accessor((d: any) => d.ema12);

    const calculatedData = ema12(data);
    const { data: chartData, xScale, xAccessor, displayXAccessor } = xScaleProvider(calculatedData);

    // Set up chart display area
    const max = xAccessor(chartData[chartData.length - 1]);
    const min = xAccessor(chartData[Math.max(0, chartData.length - 100)]);
    const xExtents = [min, max + 10];

    // MCP Event Handlers
    const handleMCPCreate = (elementType: string, elementData: any, appearance: any) => {
        console.log('🎯 MCP Create Event:', { elementType, elementData, appearance });
        
        const newElement: MCPElement = {
            id: elementData.id,
            type: elementType,
            data: elementData,
            appearance: appearance,
            selected: false
        };
        
        setMcpElements(prev => [...prev, newElement]);
        
        // Also show notification
        alert(`MCP Element Created!\nType: ${elementType}\nID: ${elementData.id}\nStart: [${elementData.start}]\nEnd: [${elementData.end}]`);
    };

    const handleMCPSelect = (elementId: string) => {
        console.log('🎯 MCP Select Event:', elementId);
        setMcpElements(prev => prev.map(el => ({
            ...el,
            selected: el.id === elementId
        })));
    };

    const handleMCPModify = (elementId: string, newData: any) => {
        console.log('🎯 MCP Modify Event:', { elementId, newData });
        setMcpElements(prev => prev.map(el => 
            el.id === elementId 
                ? { ...el, data: { ...el.data, ...newData } }
                : el
        ));
    };

    const handleMCPDelete = (elementId: string) => {
        console.log('🎯 MCP Delete Event:', elementId);
        setMcpElements(prev => prev.filter(el => el.id !== elementId));
    };

    // Regular trend line handlers (for comparison)
    const handleTrendComplete = (newTrends: any[]) => {
        setTrends(newTrends);
    };

    const clearAll = () => {
        setMcpElements([]);
        setTrends([]);
    };

    // Test MCP functionality by programmatically creating an element
    const testMCPCreate = () => {
        // Use actual visible chart data for realistic coordinates
        const visibleStartIndex = Math.max(0, chartData.length - 100);
        const visibleEndIndex = chartData.length - 1;
        
        const startData = chartData[visibleStartIndex];
        const endData = chartData[visibleEndIndex];
        
        // Use realistic price coordinates from the visible data
        const startPrice = Math.min(startData.low, startData.open, startData.close);
        const endPrice = Math.max(endData.high, endData.open, endData.close);
        
        // Use xAccessor values for x-coordinates (this is what the chart system expects)
        const startX = xAccessor(startData);
        const endX = xAccessor(endData);
        
        const testElement: MCPElement = {
            id: `test_mcp_${Date.now()}`,
            type: 'trendline',
            data: {
                // Use chart's x-accessor values instead of raw dates
                start: [startX, startPrice],
                end: [endX, endPrice],
                id: `test_mcp_${Date.now()}`
            },
            appearance: {
                strokeStyle: '#00ff00',
                strokeWidth: 3,
                strokeDasharray: 'Solid',
                edgeStrokeWidth: 3,
                edgeFill: '#00ff00',
                edgeStroke: '#00ff00'
            },
            selected: true
        };

        console.log('🧪 Creating test MCP element with chart coordinates:', testElement);
        console.log('📊 Chart coordinate mapping:', { 
            startX: startX,
            endX: endX,
            startPrice: startPrice,
            endPrice: endPrice,
            xAccessorType: typeof xAccessor,
            totalPoints: chartData.length 
        });
        setMcpElements(prev => [...prev, testElement]);
    };

    return (
        <div style={{ background: "#131722", width: '100%', height: '100%' }}>
            {/* Control Panel */}
            <div style={{ 
                padding: '8px 15px', 
                background: '#1e222d', 
                color: '#d1d4dc',
                fontSize: '12px',
                borderBottom: '1px solid #2a2e39',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000
            }}>
                <div style={{ marginBottom: '10px' }}>
                    <strong>MCP TrendLine Demo</strong> - Test MCP Integration
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input 
                            type="checkbox" 
                            checked={mcpEnabled} 
                            onChange={(e) => setMcpEnabled(e.target.checked)}
                        />
                        Enable MCP Mode
                    </label>
                    <button 
                        onClick={testMCPCreate}
                        style={{ 
                            padding: '5px 10px', 
                            background: '#089981', 
                            color: 'white', 
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                    >
                        Test MCP Create
                    </button>
                    <button 
                        onClick={clearAll}
                        style={{ 
                            padding: '5px 10px', 
                            background: '#f23645', 
                            color: 'white', 
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer'
                        }}
                    >
                        Clear All
                    </button>
                    <span>Regular Trends: {trends.length}</span>
                    <span>MCP Elements: {mcpElements.length}</span>
                </div>
                {mcpElements.length > 0 && (
                    <div style={{ marginTop: '10px', fontSize: '12px' }}>
                        <strong>MCP Elements:</strong>
                        {mcpElements.map(el => (
                            <div key={el.id} style={{ 
                                marginLeft: '10px',
                                color: el.selected ? '#089981' : '#d1d4dc'
                            }}>
                                {el.type} ({el.id.slice(-8)}) - {el.selected ? 'SELECTED' : 'inactive'}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '80px' }}> {/* Account for fixed header */}
                <ChartCanvas
                    height={height - 80}
                    ratio={ratio}
                    width={width}
                    margin={margin}
                    data={chartData}
                    displayXAccessor={displayXAccessor}
                    seriesName="MCP Demo"
                    xScale={xScale}
                    xAccessor={xAccessor}
                    xExtents={xExtents}
                    zoomAnchor={lastVisibleItemBasedZoomAnchor}
                >
                <Chart 
                    id={1} 
                    height={height - 80 - margin.top - margin.bottom}
                    yExtents={(d: IOHLCData) => [d.high, d.low]}
                >
                    <XAxis showGridLines stroke="#2a2e39" tickStroke="#d1d4dc" />
                    <YAxis showGridLines stroke="#2a2e39" tickStroke="#d1d4dc" />
                    
                    <CandlestickSeries 
                        fill={(d: any) => d.close > d.open ? "#089981" : "#f23645"}
                        stroke={(d: any) => d.close > d.open ? "#089981" : "#f23645"}
                        wickStroke={(d: any) => d.close > d.open ? "#089981" : "#f23645"}
                    />
                    
                    <LineSeries 
                        yAccessor={ema12.accessor()} 
                        strokeStyle="#2962ff" 
                        strokeWidth={2} 
                    />

                    {/* MCP-Enhanced TrendLine Component */}
                    <TrendLine
                        enabled={true}
                        snap={false}
                        onStart={() => {}}
                        onComplete={mcpEnabled ? undefined : handleTrendComplete}
                        trends={mcpEnabled ? [] : trends} // Use empty if MCP mode, regular trends if not
                        type="LINE"
                        appearance={{
                            strokeStyle: mcpEnabled ? "#ff9800" : "#2196f3",
                            strokeWidth: 2,
                            strokeDasharray: "Solid",
                            edgeStrokeWidth: 2,
                            edgeFill: mcpEnabled ? "#ff9800" : "#2196f3",
                            edgeStroke: mcpEnabled ? "#ff9800" : "#2196f3",
                        }}
                        // MCP Integration Props
                        onMCPCreate={mcpEnabled ? handleMCPCreate : undefined}
                        onMCPSelect={mcpEnabled ? handleMCPSelect : undefined}
                        onMCPModify={mcpEnabled ? handleMCPModify : undefined}
                        onMCPDelete={mcpEnabled ? handleMCPDelete : undefined}
                        mcpElements={(() => {
                            const result = mcpEnabled ? mcpElements : undefined;
                            console.log('🎯 MCPTrendLineDemo passing mcpElements:', { 
                                mcpEnabled, 
                                mcpElementsLength: mcpElements.length, 
                                mcpElements, 
                                result 
                            });
                            return result;
                        })()}
                    />

                    <MouseCoordinateX 
                        rectWidth={100} 
                        displayFormat={timeFormat("%d %b")}
                        fill="#131722"
                        stroke="#2a2e39"
                        textFill="#d1d4dc"
                    />
                    
                    <MouseCoordinateY 
                        rectWidth={80} 
                        displayFormat={format(".2f")}
                        fill="#131722"
                        stroke="#2a2e39"
                        textFill="#d1d4dc"
                    />
                </Chart>
                
                <CrossHairCursor stroke="#2a2e39" />
            </ChartCanvas>
            </div>
        </div>
    );
};

export default withSize({ style: { minHeight: 600 } })(withDeviceRatio()(MCPTrendLineDemo));