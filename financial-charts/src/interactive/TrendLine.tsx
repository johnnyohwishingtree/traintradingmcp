import * as React from "react";
import { isDefined, isNotDefined, noop, strokeDashTypes } from "../core";
import { getValueFromOverride, isHoverForInteractiveType, saveNodeType, terminate } from "./utils";
import { HoverTextNearMouse, MouseLocationIndicator, InteractiveStraightLine } from "./components";
import { EachTrendLine } from "./wrapper";

export interface MCPElement {
    readonly id: string;
    readonly type: string;
    readonly data: any;
    readonly appearance?: any;
    readonly selected?: boolean;
}

export interface TrendLineProps {
    readonly snap: boolean;
    readonly enabled: boolean;
    readonly snapTo?: (datum: any) => number | number[];
    readonly shouldDisableSnap?: (e: React.MouseEvent) => boolean;
    readonly onStart: (e: React.MouseEvent, moreProps: any) => void;
    readonly onComplete?: (e: React.MouseEvent, newTrends: any[], moreProps: any) => void;
    readonly onSelect?: (e: React.MouseEvent, interactives: any[], moreProps: any) => void;
    readonly currentPositionStroke?: string;
    readonly currentPositionStrokeWidth?: number;
    readonly currentPositionstrokeOpacity?: number;
    readonly currentPositionRadius?: number;
    readonly type:
        | "XLINE" // extends from -Infinity to +Infinity
        | "RAY" // extends to +/-Infinity in one direction
        | "LINE"; // extends between the set bounds
    readonly hoverText: object;
    readonly trends: any[];
    readonly appearance: {
        readonly strokeStyle: string;
        readonly strokeWidth: number;
        readonly strokeDasharray: strokeDashTypes;
        readonly edgeStrokeWidth: number;
        readonly edgeFill: string;
        readonly edgeStroke: string;
    };
    // MCP Integration Props (optional)
    readonly onMCPCreate?: (elementType: string, elementData: any, appearance: any) => void;
    readonly onMCPSelect?: (elementId: string) => void;
    readonly onMCPModify?: (elementId: string, newData: any) => void;
    readonly onMCPDelete?: (elementId: string) => void;
    readonly mcpElements?: MCPElement[]; // MCP-managed elements to display
}

interface TrendLineState {
    current?: any;
    override?: any;
    trends?: any;
}

export class TrendLine extends React.Component<TrendLineProps, TrendLineState> {
    public static defaultProps = {
        type: "XLINE",
        onStart: noop,
        onSelect: noop,
        currentPositionStroke: "#000000",
        currentPositionstrokeOpacity: 1,
        currentPositionStrokeWidth: 3,
        currentPositionRadius: 0,
        shouldDisableSnap: (e: React.MouseEvent) => e.button === 2 || e.shiftKey,
        hoverText: {
            ...HoverTextNearMouse.defaultProps,
            enable: true,
            bgHeight: "auto",
            bgWidth: "auto",
            text: "Click to select object",
            selectedText: "",
        },
        trends: [],
        appearance: {
            strokeStyle: "#000000",
            strokeWidth: 1,
            strokeDasharray: "Solid",
            edgeStrokeWidth: 1,
            edgeFill: "#FFFFFF",
            edgeStroke: "#000000",
            r: 6,
        },
    };

    // @ts-ignore
    private getSelectionState: any;
    private mouseMoved: any;
    private saveNodeType: any;
    // @ts-ignore
    private terminate: any;

    public constructor(props: TrendLineProps) {
        super(props);

        this.terminate = terminate.bind(this);
        this.saveNodeType = saveNodeType.bind(this);

        this.getSelectionState = isHoverForInteractiveType("trends").bind(this);

        this.state = {};
    }

    // Convert MCP elements to trends format for native rendering
    private convertMCPElementsToTrends(mcpElements: MCPElement[], appearance: any): any[] {
        console.log('🔍 convertMCPElementsToTrends called with:', { mcpElements, appearance });
        
        if (!mcpElements) {
            console.log('  ❌ No mcpElements provided, returning []');
            return [];
        }
        
        console.log('  📊 MCP Elements before filtering:', mcpElements.length, mcpElements);
        
        const filtered = mcpElements.filter(el => el.type === 'trendline');
        console.log('  📊 After filtering for trendlines:', filtered.length, filtered);
        
        const converted = filtered.map(el => ({
            id: el.id,
            start: el.data.start,
            end: el.data.end,
            appearance: el.appearance || appearance,
            type: "LINE",
            selected: el.selected || false,
            isMCPElement: true // Mark as MCP-managed
        }));
        
        console.log('  ✅ Converted trends:', converted.length, converted);
        return converted;
    }

    // Generate unique ID for new elements
    private generateElementId(): string {
        return `trendline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    public render() {
        const {
            appearance,
            currentPositionstrokeOpacity,
            currentPositionRadius = TrendLine.defaultProps.currentPositionRadius,
            currentPositionStroke,
            currentPositionStrokeWidth,
            enabled,
            hoverText,
            shouldDisableSnap,
            snap,
            snapTo,
            trends,
            type,
            mcpElements,
        } = this.props;

        const { current, override } = this.state;

        console.log('🎨 TrendLine render props:', { mcpElements, mcpElementsType: typeof mcpElements, mcpElementsLength: mcpElements?.length });

        // Merge MCP elements with regular trends for unified rendering
        const mcpTrends = this.convertMCPElementsToTrends(mcpElements, appearance);
        const allTrends = [...(trends || []), ...mcpTrends];
        
        console.log('🎨 TrendLine render:', { 
            enabled, 
            regularTrends: (trends || []).length, 
            mcpTrends: mcpTrends.length,
            totalTrends: allTrends.length 
        });

        const tempLine =
            isDefined(current) && isDefined(current.end) ? (
                <InteractiveStraightLine
                    type={type}
                    x1Value={current.start[0]}
                    y1Value={current.start[1]}
                    x2Value={current.end[0]}
                    y2Value={current.end[1]}
                    strokeStyle={appearance.strokeStyle}
                    strokeWidth={appearance.strokeWidth}
                />
            ) : null;

        return (
            <g>
                {allTrends.map((each, idx) => {
                    const eachAppearance = isDefined(each.appearance)
                        ? { ...appearance, ...each.appearance }
                        : appearance;

                    const hoverTextWithDefault = {
                        ...TrendLine.defaultProps.hoverText,
                        ...hoverText,
                    };

                    return (
                        <EachTrendLine
                            key={idx}
                            ref={this.saveNodeType(idx)}
                            index={idx}
                            type={each.type}
                            selected={each.selected}
                            x1Value={getValueFromOverride(override, idx, "x1Value", each.start[0])}
                            y1Value={getValueFromOverride(override, idx, "y1Value", each.start[1])}
                            x2Value={getValueFromOverride(override, idx, "x2Value", each.end[0])}
                            y2Value={getValueFromOverride(override, idx, "y2Value", each.end[1])}
                            strokeStyle={eachAppearance.strokeStyle}
                            strokeWidth={eachAppearance.strokeWidth}
                            strokeOpacity={eachAppearance.strokeOpacity}
                            strokeDasharray={eachAppearance.strokeDasharray}
                            edgeStroke={eachAppearance.edgeStroke}
                            edgeFill={eachAppearance.edgeFill}
                            edgeStrokeWidth={eachAppearance.edgeStrokeWidth}
                            r={eachAppearance.r}
                            hoverText={hoverTextWithDefault}
                            onSelect={this.props.onSelect}
                            onDrag={this.handleDragLine}
                            onDragComplete={this.handleDragLineComplete}
                            edgeInteractiveCursor="react-financial-charts-move-cursor"
                            lineInteractiveCursor="react-financial-charts-move-cursor"
                        />
                    );
                })}
                {tempLine}
                {enabled && (
                    <MouseLocationIndicator
                        enabled={enabled}
                        snap={snap}
                        shouldDisableSnap={shouldDisableSnap}
                        snapTo={snapTo}
                        r={currentPositionRadius}
                        stroke={currentPositionStroke}
                        opacity={currentPositionstrokeOpacity}
                        strokeWidth={currentPositionStrokeWidth}
                        onMouseDown={this.handleStart}
                        onClick={this.handleEnd}
                        onMouseMove={this.handleDrawLine}
                    />
                )}
            </g>
        );
    }

    private readonly handleEnd = (e: React.MouseEvent, xyValue: any, moreProps: any) => {
        const { current } = this.state;
        const { trends, appearance, type } = this.props;

        console.log('🏁 TrendLine handleEnd called', { current, xyValue, mouseMoved: this.mouseMoved });

        // For line completion: 
        // - If we have a current state with start point AND either mouseMoved OR different coordinates, complete it
        // - This allows both drag and click-click interactions to work
        if (isDefined(current) && isDefined(current.start)) {
            const startX = current.start[0];
            const startY = current.start[1];
            const endX = xyValue[0];
            const endY = xyValue[1];
            
            // Complete line if mouse moved OR if click is at different coordinates
            const differentPosition = Math.abs(startX - endX) > 1 || Math.abs(startY - endY) > 1;
            
            console.log('  📏 Distance check:', { startX, startY, endX, endY, differentPosition, mouseMoved: this.mouseMoved });
            
            if (this.mouseMoved || differentPosition) {
                console.log('  ✅ Completing trendline!');
                const newTrendlineId = this.generateElementId();
                const newTrendline = {
                    id: newTrendlineId,
                    start: current.start,
                    end: xyValue,
                    selected: true,
                    appearance,
                    type,
                };
                const newTrends = [
                    ...(trends || []).map((d) => ({ ...d, selected: false })),
                    newTrendline,
                ];
                this.setState(
                    {
                        current: null,
                        trends: newTrends,
                    },
                    () => {
                        const { onComplete, onMCPCreate } = this.props;
                        
                        // Emit MCP event if handler is provided
                        if (onMCPCreate) {
                            console.log('  📡 Emitting MCP create event for trendline:', newTrendlineId);
                            onMCPCreate('trendline', {
                                start: current.start,
                                end: xyValue,
                                id: newTrendlineId
                            }, appearance);
                        }
                        
                        if (onComplete !== undefined) {
                            onComplete(e, newTrends, moreProps);
                        }
                    },
                );
            } else {
                console.log('  ❌ Not completing - no movement detected');
            }
        } else {
            console.log('  ❌ Not completing - no current state or start point');
        }
    };

    private readonly handleStart = (e: React.MouseEvent, xyValue: any, moreProps: any) => {
        const { current } = this.state;
        
        console.log('🏁 TrendLine handleStart called, current:', current);

        if (isNotDefined(current) || isNotDefined(current.start)) {
            console.log('  ⚠️ Setting mouseMoved = false (resetting)');
            this.mouseMoved = false;

            this.setState(
                {
                    current: {
                        start: xyValue,
                        end: null,
                    },
                },
                () => {
                    const { onStart } = this.props;
                    if (onStart !== undefined) {
                        onStart(e, moreProps);
                    }
                },
            );
        } else {
            console.log('  ✅ handleStart condition not met, NOT resetting mouseMoved (current value:', this.mouseMoved, ')');
        }
    };

    private readonly handleDrawLine = (_: React.MouseEvent, xyValue: any) => {
        const { current } = this.state;
        if (isDefined(current) && isDefined(current.start)) {
            this.mouseMoved = true;
            this.setState({
                current: {
                    start: current.start,
                    end: xyValue,
                },
            });
        }
    };

    private readonly handleDragLineComplete = (e: React.MouseEvent, moreProps: any) => {
        console.log('🎯 handleDragLineComplete called');
        const { override } = this.state;
        console.log('  Override state:', override);
        
        if (isDefined(override)) {
            const { trends, mcpElements } = this.props;
            const allTrends = [...(trends || []), ...this.convertMCPElementsToTrends(mcpElements, this.props.appearance)];
            const modifiedTrend = allTrends[override.index];
            
            const newTrends = (trends || []).map((each, idx) =>
                idx === override.index
                    ? {
                          ...each,
                          start: [override.x1Value, override.y1Value],
                          end: [override.x2Value, override.y2Value],
                          selected: true,
                      }
                    : {
                          ...each,
                          selected: false,
                      },
            );
            
            console.log('  📌 Setting dragged line as selected, index:', override.index);

            this.setState(
                {
                    override: null,
                },
                () => {
                    const { onComplete, onMCPModify } = this.props;
                    
                    // Emit MCP modify event if the modified trend is MCP-managed and handler exists
                    if (onMCPModify && modifiedTrend && modifiedTrend.isMCPElement) {
                        console.log('  📡 Emitting MCP modify event for trendline:', modifiedTrend.id);
                        onMCPModify(modifiedTrend.id, {
                            start: [override.x1Value, override.y1Value],
                            end: [override.x2Value, override.y2Value]
                        });
                    }
                    
                    if (onComplete !== undefined) {
                        onComplete(e, newTrends, moreProps);
                    }
                },
            );
        }
    };

    private readonly handleDragLine = (_: React.MouseEvent, index: number | undefined, newXYValue: any) => {
        console.log('📐 handleDragLine called, index:', index, 'new position:', newXYValue);
        this.setState({
            override: {
                index,
                ...newXYValue,
            },
        });
    };
}
