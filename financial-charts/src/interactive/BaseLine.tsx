import * as React from "react";
import { isDefined, isNotDefined, strokeDashTypes } from "../core";
import { InteractiveBase, InteractiveBaseProps, InteractiveBaseState } from "./InteractiveBase";
import { MouseLocationIndicator, InteractiveStraightLine } from "./components";

export interface BaseLineProps extends InteractiveBaseProps {
    readonly snap?: boolean;
    readonly snapTo?: (datum: any) => number | number[];
    readonly shouldDisableSnap?: (e: React.MouseEvent) => boolean;
    readonly type?:
        | "XLINE" // extends from -Infinity to +Infinity
        | "RAY" // extends to +/-Infinity in one direction
        | "LINE"; // extends between the set bounds
    readonly trends?: any[]; // Use trends instead of lines for compatibility
    readonly lines?: any[]; // Keep for backward compatibility
    readonly appearance: InteractiveBaseProps['appearance'] & {
        readonly strokeDasharray: strokeDashTypes;
        readonly r?: number;
    };
}

interface BaseLineState extends InteractiveBaseState {
    lines?: any[];
}

export class BaseLine extends InteractiveBase<BaseLineProps, BaseLineState> {
    public static defaultProps = {
        ...InteractiveBase.defaultProps,
        type: "XLINE",
        snap: false,
        shouldDisableSnap: (e: React.MouseEvent) => e.button === 2 || e.shiftKey,
        lines: [],
        appearance: {
            ...InteractiveBase.defaultProps.appearance,
            strokeDasharray: "Solid" as strokeDashTypes,
            r: 6,
        },
    };

    protected getInteractiveType(): string {
        return "lines";
    }

    public render() {
        const {
            appearance,
            currentPositionstrokeOpacity,
            currentPositionRadius = BaseLine.defaultProps.currentPositionRadius,
            currentPositionStroke,
            currentPositionStrokeWidth,
            enabled,
            hoverText,
            shouldDisableSnap,
            snap,
            snapTo,
            lines,
            trends,
            type,
        } = this.props;

        const { current, override } = this.state;
        const allLines = trends || lines || []; // Prefer trends for compatibility

        // For drawing preview - single line from click point
        // Apply constraints for the preview line (important for horizontal/vertical rays)
        const tempLine =
            isDefined(current) && isDefined(current.end) ? (
                <InteractiveStraightLine
                    type={type || "LINE"}
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
                {allLines.map((each, idx) => this.renderLineItem(each, idx, override, appearance, hoverText))}
                {tempLine}
                {enabled && (
                    <MouseLocationIndicator
                        enabled={enabled}
                        snap={snap || false}
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

    // Template method that child classes can override to render line items differently
    protected renderLineItem(line: any, index: number, override: any, appearance: any, hoverText: any): React.ReactNode {
        // Default implementation: single control point in middle
        const midX = (line.start[0] + line.end[0]) / 2;
        const midY = (line.start[1] + line.end[1]) / 2;
        
        return (
            <g key={index}>
                <InteractiveStraightLine
                    type={line.type || this.props.type}
                    x1Value={line.start[0]}
                    y1Value={line.start[1]}
                    x2Value={line.end[0]}
                    y2Value={line.end[1]}
                    strokeStyle={appearance.strokeStyle}
                    strokeWidth={appearance.strokeWidth}
                    strokeDasharray={appearance.strokeDasharray}
                    onClick={(e, moreProps) => this.handleLineClick(e, index, moreProps)}
                    selected={line.selected}
                    tolerance={10}
                    interactiveCursorClass="react-financial-charts-move-cursor"
                />
                {/* Single control point in middle */}
                {line.selected && (
                    <circle
                        cx={midX}
                        cy={midY}
                        r={appearance.r}
                        fill={appearance.edgeFill}
                        stroke={appearance.edgeStroke}
                        strokeWidth={appearance.edgeStrokeWidth}
                        style={{ cursor: "move" }}
                        onMouseDown={(e) => this.handleControlPointDragStart(e, index)}
                    />
                )}
            </g>
        );
    }

    protected readonly handleStart = (e: React.MouseEvent, xyValue: any, moreProps: any) => {
        const { current } = this.state;
        
        if (isNotDefined(current) || isNotDefined(current.start)) {
            this.mouseMoved = false;

            this.setState(
                {
                    current: {
                        start: xyValue,
                        end: null,
                    },
                } as Partial<BaseLineState>,
                () => {
                    const { onStart } = this.props;
                    if (onStart !== undefined) {
                        onStart(e, moreProps);
                    }
                },
            );
        }
    };

    protected readonly handleEnd = (e: React.MouseEvent, xyValue: any, moreProps: any) => {
        const { current } = this.state;
        const allLines = this.props.trends || this.props.lines || [];
        const { appearance, type } = this.props;

        if (isDefined(current) && isDefined(current.start)) {
            // Apply any constraints from child classes
            const constrainedEndValue = this.applyConstraints(current.start, xyValue);
            
            const newLines = [
                ...allLines.map((d) => ({ ...d, selected: false })),
                {
                    start: current.start,
                    end: constrainedEndValue,
                    selected: true,
                    appearance,
                    type,
                },
            ];
            
            this.setState(
                {
                    current: null,
                } as Partial<BaseLineState>,
                () => {
                    const { onComplete } = this.props;
                    if (onComplete !== undefined) {
                        onComplete(e, newLines, moreProps);
                    }
                },
            );
        }
    };

    protected readonly handleDrawLine = (_: React.MouseEvent, xyValue: any) => {
        const { current } = this.state;
        if (isDefined(current) && isDefined(current.start)) {
            this.mouseMoved = true;
            
            // Apply constraints during drawing
            const constrainedValue = this.applyConstraints(current.start, xyValue);
            
            this.setState({
                current: {
                    start: current.start,
                    end: constrainedValue,
                },
            } as Partial<BaseLineState>);
        }
    };

    // Virtual method for child classes to override constraints
    protected applyConstraints(startPoint: any, endPoint: any): any {
        return endPoint; // Base class: no constraints
    }

    protected readonly handleLineClick = (e: React.MouseEvent, index: number, moreProps: any) => {
        console.log('📌 Line clicked, index:', index);
        const allLines = this.props.trends || this.props.lines || [];
        const { onSelect } = this.props;
        
        if (onSelect) {
            // Don't manage state internally - send selection to parent
            const selectionData = [{ 
                index, 
                start: allLines[index].start, 
                end: allLines[index].end,
                selected: true 
            }];
            onSelect(e, selectionData, moreProps);
        }
    };

    protected readonly handleControlPointDragStart = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        console.log('🖱️ Control point drag start, index:', index);
        
        // Implementation for control point dragging
        const { lines } = this.props;
        if (!lines || !lines[index]) return;
        const line = lines[index];
        
        const handleDrag = (dragEvent: MouseEvent) => {
            // Get proper coordinates - this would need coordinate conversion
            const rect = (e.target as Element).closest('svg')?.getBoundingClientRect();
            if (!rect) return;
            
            const newX = dragEvent.clientX - rect.left;
            const newY = dragEvent.clientY - rect.top;
            
            // Apply constraints from child classes
            const constrainedPoint = this.applyConstraints(line.start, [newX, newY]);
            
            this.setState({
                override: {
                    index,
                    x1Value: constrainedPoint[0],
                    y1Value: constrainedPoint[1],
                    x2Value: constrainedPoint[0],
                    y2Value: constrainedPoint[1],
                },
            } as Partial<BaseLineState>);
        };

        const handleDragEnd = () => {
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', handleDragEnd);
            this.handleDragComplete(e as any, {} as any);
        };

        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', handleDragEnd);
    };

    // Implement abstract method from InteractiveBase
    protected updateItemsAfterDrag(override: any): any[] {
        const allLines = this.props.trends || this.props.lines || [];
        return allLines.map((each, idx) =>
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
    }

    // Drag handlers required by wrapper components
    protected readonly handleDragLine = (e: React.MouseEvent, index: number | undefined, moreProps: any) => {
        const allLines = this.props.trends || this.props.lines || [];

        if (index !== undefined) {
            // Check if moreProps contains coordinate updates from wrapper components
            // (e.g., EachHorizontalLineTrend passes { x1Value, y1Value, x2Value, y2Value })
            const hasCoordinates = typeof moreProps === 'object' && moreProps !== null &&
                                 ('x1Value' in moreProps || 'y1Value' in moreProps ||
                                  'x2Value' in moreProps || 'y2Value' in moreProps);

            if (hasCoordinates) {
                // Wrapper component is providing new coordinates - use them
                console.log('🖱️ Line drag with coordinates, index:', index, 'coords:', {
                    x1: moreProps.x1Value,
                    y1: moreProps.y1Value,
                    x2: moreProps.x2Value,
                    y2: moreProps.y2Value,
                });

                this.setState({
                    override: {
                        index,
                        x1Value: moreProps.x1Value,
                        y1Value: moreProps.y1Value,
                        x2Value: moreProps.x2Value,
                        y2Value: moreProps.y2Value,
                    },
                } as Partial<BaseLineState>);
            } else {
                // Legacy behavior - just set index
                console.log('🖱️ Line drag (legacy), index:', index);
                this.setState({
                    override: {
                        index,
                    },
                } as Partial<BaseLineState>);
            }
        }
    };

    protected readonly handleDragLineComplete = (e: React.MouseEvent, moreProps: any) => {
        console.log('🏁 Line drag complete');
        this.handleDragComplete(e, moreProps);
    };
}