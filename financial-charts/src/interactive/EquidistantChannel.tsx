import * as React from "react";
import { isDefined, isNotDefined, noop, GenericChartComponent, getMouseCanvas } from "../core";
import { HoverTextNearMouse, MouseLocationIndicator } from "./components";
import { getSlope, getYIntercept } from "./components/InteractiveStraightLine";
import { isHoverForInteractiveType, saveNodeType, terminate } from "./utils";
import { EachEquidistantChannel } from "./wrapper";

// MCP Integration Types
export interface MCPElement {
    readonly id: string;
    readonly type: 'channel' | 'label';
    readonly data: any;
    readonly appearance?: any;
    readonly selected?: boolean;
}

interface EquidistantChannelProps {
    readonly enabled: boolean;
    readonly onStart: () => void;
    readonly onComplete: (e: React.MouseEvent, newChannels: any[], moreProps: any) => void;
    readonly onDragComplete?: (e: React.MouseEvent, newChannels: any[], moreProps: any) => void;
    readonly onSelect: (e: React.MouseEvent, interactives: any[], moreProps: any) => void;
    readonly currentPositionStroke?: string;
    readonly currentPositionStrokeWidth?: number;
    readonly currentPositionOpacity?: number;
    readonly currentPositionRadius?: number;
    readonly hoverText: object;
    readonly channels: any[];
    readonly appearance: {
        readonly stroke: string;
        readonly strokeOpacity: number;
        readonly strokeWidth: number;
        readonly fill: string;
        readonly fillOpacity: number;
        readonly edgeStroke: string;
        readonly edgeFill: string;
        readonly edgeFill2: string;
        readonly edgeStrokeWidth: number;
        readonly r: number;
    };
    // MCP Integration Props (optional)
    readonly onMCPCreate?: (elementType: string, elementData: any, appearance: any) => void;
    readonly onMCPSelect?: (elementId: string) => void;
    readonly onMCPModify?: (elementId: string, newData: any) => void;
    readonly onMCPDelete?: (elementId: string) => void;
    readonly mcpElements?: MCPElement[]; // MCP-managed elements to display
}

interface EquidistantChannelState {
    current?: any;
    override?: any;
}

export class EquidistantChannel extends React.Component<EquidistantChannelProps, EquidistantChannelState> {
    public static defaultProps = {
        onSelect: noop,
        currentPositionStroke: "#000000",
        currentPositionOpacity: 1,
        currentPositionStrokeWidth: 3,
        currentPositionRadius: 4,
        hoverText: {
            ...HoverTextNearMouse.defaultProps,
            enable: true,
            bgHeight: 18,
            bgWidth: 120,
            text: "Click to select object",
        },
        channels: [],
        appearance: {
            stroke: "#000000",
            strokeOpacity: 1,
            strokeWidth: 1,
            fill: "#8AAFE2",
            fillOpacity: 0.7,
            edgeStroke: "#000000",
            edgeFill: "#FFFFFF",
            edgeFill2: "#250B98",
            edgeStrokeWidth: 1,
            r: 5,
        },
    };

    // @ts-ignore
    private terminate: () => void;
    private saveNodeType: any;
    // @ts-ignore
    private getSelectionState: any;
    private mouseMoved: any;

    public constructor(props: EquidistantChannelProps) {
        super(props);

        this.terminate = terminate.bind(this);
        this.saveNodeType = saveNodeType.bind(this);
        this.getSelectionState = isHoverForInteractiveType("channels").bind(this);

        this.state = {};
    }

    // MCP Integration Methods
    private convertMCPElementsToChannels(mcpElements: MCPElement[]): any[] {
        const channelElements = mcpElements.filter(el => el.type === 'channel');
        return channelElements.map(el => ({
            id: el.id,
            startXY: el.data.startXY,
            endXY: el.data.endXY,
            dy: el.data.dy,
            selected: el.selected || false,
            appearance: el.appearance
        }));
    }

    private generateElementId(): string {
        return `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    public render() {
        const {
            appearance,
            channels,
            currentPositionOpacity,
            currentPositionRadius = EquidistantChannel.defaultProps.currentPositionRadius,
            currentPositionStroke,
            currentPositionStrokeWidth,
            enabled,
            hoverText,
            onDragComplete,
            mcpElements,
        } = this.props;

        // Merge regular channels with MCP elements
        const mcpChannels = mcpElements ? this.convertMCPElementsToChannels(mcpElements) : [];
        const allChannels = [...(channels || []), ...mcpChannels];


        const { current, override } = this.state;

        const overrideIndex = isDefined(override) ? override.index : null;

        return (
            <g>
                {allChannels.map((each, idx) => {
                    const eachAppearance = isDefined(each.appearance)
                        ? { ...appearance, ...each.appearance }
                        : appearance;

                    return (
                        <EachEquidistantChannel
                            key={idx}
                            ref={this.saveNodeType(idx)}
                            index={idx}
                            selected={each.selected}
                            hoverText={hoverText}
                            {...(idx === overrideIndex ? override : each)}
                            appearance={eachAppearance}
                            onDrag={this.handleDragChannel}
                            onDragComplete={this.handleDragChannelComplete}
                            onSelect={this.props.onSelect}
                        />
                    );
                })}
                
                {/* Current drawing preview using GenericChartComponent */}
                {isDefined(current) && (
                    <GenericChartComponent
                        canvasToDraw={getMouseCanvas}
                        canvasDraw={(ctx: CanvasRenderingContext2D, moreProps: any) => this.drawCurrentChannelOnCanvas(ctx, moreProps, current, appearance)}
                        drawOn={["mousemove", "pan", "drag"]}
                    />
                )}
                
                {enabled && (
                    <MouseLocationIndicator
                        enabled={enabled}
                        snap={false}
                        r={currentPositionRadius}
                        stroke={currentPositionStroke}
                        opacity={currentPositionOpacity}
                        strokeWidth={currentPositionStrokeWidth}
                        onMouseDown={this.handleStart}
                        onClick={this.handleEnd}
                        onMouseMove={this.handleDrawChannel}
                    />
                )}
            </g>
        );
    }

    private readonly handleDragChannel = (_: React.MouseEvent, index: any, newXYValue: any) => {
        this.setState({
            override: {
                index,
                ...newXYValue,
            },
        });
    };

    private readonly handleDragChannelComplete = (e: React.MouseEvent, moreProps: any) => {
        const { override } = this.state;
        const { channels, onDragComplete } = this.props;

        if (isDefined(override)) {
            const { index, ...rest } = override;
            const newChannels = channels.map((each, idx) =>
                idx === index 
                    ? { ...each, ...rest, selected: true }
                    : { ...each, selected: false },
            );

            if (onDragComplete !== undefined) {
                onDragComplete(e, newChannels, moreProps);
            }
        }
    };

    public componentDidUpdate(prevProps: EquidistantChannelProps) {
        const { override } = this.state;
        const { channels } = this.props;
        
        // Clear override when props update with the new channel positions
        if (override && prevProps.channels !== channels) {
            const { index } = override;
            const updatedChannel = channels[index];
            
            // Check if the channel props now match our override (drag was successful)
            if (updatedChannel && 
                updatedChannel.startXY && updatedChannel.endXY && updatedChannel.dy !== undefined &&
                (Math.abs(updatedChannel.startXY[0] - override.startXY[0]) < 0.01 &&
                 Math.abs(updatedChannel.startXY[1] - override.startXY[1]) < 0.01 &&
                 Math.abs(updatedChannel.endXY[0] - override.endXY[0]) < 0.01 &&
                 Math.abs(updatedChannel.endXY[1] - override.endXY[1]) < 0.01 &&
                 Math.abs(updatedChannel.dy - override.dy) < 0.01)) {
                
                this.setState({ override: null });
            }
        }
    }

    private readonly handleStart = (e: React.MouseEvent, xyValue: any, moreProps: any) => {
        const { current } = this.state;
        

        if (isNotDefined(current) || isNotDefined(current.startXY)) {
            this.mouseMoved = false;

            this.setState(
                {
                    current: {
                        startXY: xyValue,
                        endXY: null,
                        dy: null,
                    },
                },
                () => {
                    const { onStart } = this.props;
                    if (onStart !== undefined) {
                        onStart();
                    }
                },
            );
        }
    };

    private readonly handleEnd = (e: React.MouseEvent, xyValue: any, moreProps: any) => {
        const { current } = this.state;
        const { channels, appearance } = this.props;


        if (isDefined(current)) {
            if (isNotDefined(current.endXY)) {
                // Setting second point (end of base ray) - only if there was movement
                const startX = current.startXY[0];
                const startY = current.startXY[1];
                const endX = xyValue[0];
                const endY = xyValue[1];
                const differentPosition = Math.abs(startX - endX) > 1 || Math.abs(startY - endY) > 1;
                
                if (this.mouseMoved || differentPosition) {
                    this.setState({
                        current: {
                            ...current,
                            endXY: xyValue,
                        },
                    });
                }
            } else if (isNotDefined(current.dy)) {
                // Setting third point (width) - complete the channel
                const startX = current.endXY[0];
                const startY = current.endXY[1];
                const endX = xyValue[0];
                const endY = xyValue[1];
                const differentPosition = Math.abs(startX - endX) > 1 || Math.abs(startY - endY) > 1;
                
                if (this.mouseMoved || differentPosition) {
                    
                    // Calculate dy based on the perpendicular distance
                    const m = getSlope(current.startXY, current.endXY);
                    const b = getYIntercept(m, current.endXY);
                    const y = m * xyValue[0] + b;
                    const dy = xyValue[1] - y;
                    
                    const channelData = {
                        startXY: current.startXY,
                        endXY: current.endXY,
                        dy: dy,
                        selected: true,
                        appearance,
                    };

                    // If MCP mode is active, notify MCP instead of regular completion
                    const { onMCPCreate } = this.props;
                    if (onMCPCreate) {
                        const elementId = this.generateElementId();
                        const mcpElementData = {
                            id: elementId,
                            startXY: current.startXY,
                            endXY: current.endXY,
                            dy: dy,
                        };
                        
                        console.log('🎯 MCP Channel Create:', { elementId, mcpElementData, appearance });
                        onMCPCreate('channel', mcpElementData, appearance);
                    } else {
                        // Regular channel completion
                        const newChannels = [
                            ...channels.map((d) => ({ ...d, selected: false })),
                            channelData,
                        ];
                        const { onComplete } = this.props;
                        if (onComplete !== undefined) {
                            onComplete(e, newChannels, moreProps);
                        }
                    }
                    
                    this.setState({
                        current: null,
                    });
                }
            }
        }
    };

    private readonly handleDrawChannel = (_: React.MouseEvent, xyValue: any) => {
        const { current } = this.state;
        
        if (isDefined(current)) {
            this.mouseMoved = true;
            
            if (isDefined(current.startXY) && isNotDefined(current.endXY)) {
                // Drawing line from startXY to current mouse position
                this.setState({
                    current: {
                        ...current,
                        tempEndXY: xyValue,
                    },
                });
            } else if (isDefined(current.endXY) && isNotDefined(current.dy)) {
                // Drawing channel preview with all points
                const m = getSlope(current.startXY, current.endXY);
                const b = getYIntercept(m, current.endXY);
                const y = m * xyValue[0] + b;
                const dy = xyValue[1] - y;
                
                this.setState({
                    current: {
                        ...current,
                        tempDy: dy,
                    },
                });
            }
        }
    };

    private readonly drawCurrentChannelOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any, current: any, appearance: any) => {
        const { startXY, endXY, dy, tempEndXY, tempDy } = current;
        
        if (!isDefined(startXY)) {
            return;
        }

        const {
            xScale,
            chartConfig: { yScale },
        } = moreProps;

        // Convert first point to screen coordinates
        const x1 = xScale(startXY[0]);
        const y1 = yScale(startXY[1]);
        
        // Stage 1: Just startXY - show a dot
        if (isNotDefined(endXY) && isNotDefined(tempEndXY)) {
            ctx.fillStyle = appearance.stroke;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(x1, y1, 4, 0, 2 * Math.PI);
            ctx.fill();
            return;
        }
        
        // Stage 2: startXY and tempEndXY (or endXY) - show a ray line
        const endXYCoords = isDefined(endXY) ? endXY : tempEndXY;
        if (isDefined(endXYCoords) && (isNotDefined(dy) && isNotDefined(tempDy))) {
            const x2 = xScale(endXYCoords[0]);
            const y2 = yScale(endXYCoords[1]);
            
            // Draw line
            ctx.strokeStyle = appearance.stroke;
            ctx.lineWidth = appearance.strokeWidth;
            ctx.setLineDash([5, 5]);
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            // Draw points
            ctx.setLineDash([]);
            ctx.fillStyle = appearance.stroke;
            ctx.beginPath();
            ctx.arc(x1, y1, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x2, y2, 4, 0, 2 * Math.PI);
            ctx.fill();
            return;
        }
        
        // Stage 3: All points - show channel preview with parallel rays and fill
        const dyValue = isDefined(dy) ? dy : tempDy;
        if (isDefined(endXYCoords) && isDefined(dyValue)) {
            const x2 = xScale(endXYCoords[0]);
            const y2 = yScale(endXYCoords[1]);
            
            // Calculate parallel line coordinates
            const y1Parallel = yScale(startXY[1] + dyValue);
            const y2Parallel = yScale(endXYCoords[1] + dyValue);
            
            // Draw channel fill
            ctx.fillStyle = appearance.fill;
            ctx.globalAlpha = (appearance.fillOpacity || 0.1) * 0.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x2, y2Parallel);
            ctx.lineTo(x1, y1Parallel);
            ctx.closePath();
            ctx.fill();
            
            // Draw both ray lines
            ctx.strokeStyle = appearance.stroke;
            ctx.lineWidth = appearance.strokeWidth;
            ctx.setLineDash([5, 5]);
            ctx.globalAlpha = 0.7;
            
            // First ray
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            // Parallel ray
            ctx.beginPath();
            ctx.moveTo(x1, y1Parallel);
            ctx.lineTo(x2, y2Parallel);
            ctx.stroke();
            
            // Draw points
            ctx.setLineDash([]);
            ctx.fillStyle = appearance.stroke;
            ctx.globalAlpha = 0.7;
            [x1, x2, x1, x2].forEach((x, i) => {
                const y = [y1, y2, y1Parallel, y2Parallel][i];
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
    };
}
