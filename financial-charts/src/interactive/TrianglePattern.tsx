import * as React from "react";
import { isDefined, isNotDefined, noop, GenericChartComponent, getMouseCanvas } from "../core";
import { HoverTextNearMouse, MouseLocationIndicator } from "./components";
import { isHoverForInteractiveType, saveNodeType, terminate } from "./utils";
import { EachTrianglePattern } from "./wrapper";

export interface TrianglePatternProps {
    readonly enabled: boolean;
    readonly onStart?: (moreProps: any) => void;
    readonly onComplete?: (e: React.MouseEvent, newTriangles: any[], moreProps: any) => void;
    readonly onDragComplete?: (e: React.MouseEvent, newTriangles: any[], moreProps: any) => void;
    readonly onSelect?: (e: React.MouseEvent, interactives: any[], moreProps: any) => void;
    readonly currentPositionStroke?: string;
    readonly currentPositionStrokeWidth?: number;
    readonly currentPositionOpacity?: number;
    readonly currentPositionRadius?: number;
    readonly hoverText: object;
    readonly triangles: any[];
    readonly appearance: {
        readonly strokeStyle: string;
        readonly strokeWidth: number;
        readonly fillStyle: string;
        readonly fillOpacity: number;
        readonly edgeStroke: string;
        readonly edgeFill: string;
        readonly edgeStrokeWidth: number;
        readonly r: number;
    };
}

interface TrianglePatternState {
    current?: any;
    override?: any;
}

export class TrianglePattern extends React.Component<TrianglePatternProps, TrianglePatternState> {
    public static defaultProps = {
        onStart: noop,
        onSelect: noop,
        currentPositionStroke: "#000000",
        currentPositionOpacity: 1,
        currentPositionStrokeWidth: 3,
        currentPositionRadius: 4,
        hoverText: {
            ...HoverTextNearMouse.defaultProps,
            enable: true,
            bgHeight: "auto",
            bgWidth: "auto",
            text: "Click to select pattern",
            selectedText: "",
        },
        triangles: [],
        appearance: {
            strokeStyle: "#1f77b4",
            strokeWidth: 2,
            fillStyle: "#1f77b4",
            fillOpacity: 0.1,
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

    public constructor(props: TrianglePatternProps) {
        super(props);

        this.terminate = terminate.bind(this);
        this.saveNodeType = saveNodeType.bind(this);
        this.getSelectionState = isHoverForInteractiveType("triangles").bind(this);

        this.state = {};
    }

    public render() {
        const {
            appearance,
            currentPositionOpacity,
            currentPositionRadius = TrianglePattern.defaultProps.currentPositionRadius,
            currentPositionStroke,
            currentPositionStrokeWidth,
            enabled,
            hoverText,
            triangles,
        } = this.props;

        const { current, override } = this.state;

        return (
            <g>
                {triangles.map((each, idx) => {
                    const eachAppearance = isDefined(each.appearance)
                        ? { ...appearance, ...each.appearance }
                        : appearance;

                    const hoverTextWithDefault = {
                        ...TrianglePattern.defaultProps.hoverText,
                        ...hoverText,
                    };

                    // Apply override during drag for real-time rendering
                    const isBeingDragged = override && override.index === idx;
                    const triangleData = isBeingDragged 
                        ? {
                            ...each,
                            point1: override.point1,
                            point2: override.point2,
                            point3: override.point3,
                          }
                        : each;

                    return (
                        <EachTrianglePattern
                            key={idx}
                            ref={this.saveNodeType(idx)}
                            index={idx}
                            selected={triangleData.selected}
                            point1={triangleData.point1}
                            point2={triangleData.point2}
                            point3={triangleData.point3}
                            strokeStyle={eachAppearance.strokeStyle}
                            strokeWidth={eachAppearance.strokeWidth}
                            fillStyle={eachAppearance.fillStyle}
                            fillOpacity={eachAppearance.fillOpacity}
                            edgeStroke={eachAppearance.edgeStroke}
                            edgeFill={eachAppearance.edgeFill}
                            edgeStrokeWidth={eachAppearance.edgeStrokeWidth}
                            r={eachAppearance.r}
                            hoverText={hoverTextWithDefault}
                            onSelect={this.props.onSelect}
                            onDrag={this.handleDragTriangle}
                            onDragComplete={this.handleDragTriangleComplete}
                        />
                    );
                })}
                
                {/* Current drawing preview using GenericChartComponent */}
                {isDefined(current) && (
                    <GenericChartComponent
                        canvasToDraw={getMouseCanvas}
                        canvasDraw={(ctx: CanvasRenderingContext2D, moreProps: any) => this.drawCurrentTriangleOnCanvas(ctx, moreProps, current, appearance)}
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
                        onMouseMove={this.handleDrawTriangle}
                    />
                )}
            </g>
        );
    }

    private readonly drawCurrentTriangleOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any, current: any, appearance: any) => {
        const { point1, point2, point3, tempPoint2, tempPoint3 } = current;
        
        if (!isDefined(point1)) {
            return;
        }

        const {
            xScale,
            chartConfig: { yScale },
        } = moreProps;

        // Convert first point to screen coordinates
        const x1 = xScale(point1[0]);
        const y1 = yScale(point1[1]);
        
        // Stage 1: Just point1 - show a dot
        if (isNotDefined(point2) && isNotDefined(tempPoint2)) {
            ctx.fillStyle = appearance.strokeStyle;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(x1, y1, 4, 0, 2 * Math.PI);
            ctx.fill();
            return;
        }
        
        // Stage 2: point1 and tempPoint2 (or point2) - show a line
        const point2Coords = isDefined(point2) ? point2 : tempPoint2;
        if (isDefined(point2Coords) && (isNotDefined(point3) && isNotDefined(tempPoint3))) {
            const x2 = xScale(point2Coords[0]);
            const y2 = yScale(point2Coords[1]);
            
            // Draw line
            ctx.strokeStyle = appearance.strokeStyle;
            ctx.lineWidth = appearance.strokeWidth;
            ctx.setLineDash([5, 5]);
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            
            // Draw points
            ctx.setLineDash([]);
            ctx.fillStyle = appearance.strokeStyle;
            ctx.beginPath();
            ctx.arc(x1, y1, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x2, y2, 4, 0, 2 * Math.PI);
            ctx.fill();
            return;
        }
        
        // Stage 3: All three points - show triangle preview
        const point3Coords = isDefined(point3) ? point3 : tempPoint3;
        if (isDefined(point2Coords) && isDefined(point3Coords)) {
            const x2 = xScale(point2Coords[0]);
            const y2 = yScale(point2Coords[1]);
            const x3 = xScale(point3Coords[0]);
            const y3 = yScale(point3Coords[1]);
            
            // Draw triangle fill
            ctx.fillStyle = appearance.fillStyle;
            ctx.globalAlpha = appearance.fillOpacity * 0.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.closePath();
            ctx.fill();
            
            // Draw triangle outline
            ctx.strokeStyle = appearance.strokeStyle;
            ctx.lineWidth = appearance.strokeWidth;
            ctx.setLineDash([5, 5]);
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.closePath();
            ctx.stroke();
            
            // Draw points
            ctx.setLineDash([]);
            ctx.fillStyle = appearance.strokeStyle;
            ctx.globalAlpha = 0.7;
            [x1, x2, x3].forEach((x, i) => {
                const y = [y1, y2, y3][i];
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
    };

    private readonly handleEnd = (e: React.MouseEvent, xyValue: any, moreProps: any) => {
        const { current } = this.state;
        const { triangles, appearance } = this.props;

        console.log('🔺 Triangle handleEnd called', { current, xyValue, mouseMoved: this.mouseMoved });

        if (isDefined(current)) {
            if (isNotDefined(current.point2)) {
                // Setting second point - only if there was movement or different coordinates
                const startX = current.point1[0];
                const startY = current.point1[1];
                const endX = xyValue[0];
                const endY = xyValue[1];
                const differentPosition = Math.abs(startX - endX) > 1 || Math.abs(startY - endY) > 1;
                
                console.log('  📏 Point2 check:', { startX, startY, endX, endY, differentPosition, mouseMoved: this.mouseMoved });
                
                if (this.mouseMoved || differentPosition) {
                    console.log('  📍 Setting point2');
                    this.setState({
                        current: {
                            ...current,
                            point2: xyValue,
                        },
                    });
                } else {
                    console.log('  ❌ Not setting point2 - no movement detected');
                }
            } else if (isNotDefined(current.point3)) {
                // Setting third point - complete the triangle
                const startX = current.point2[0];
                const startY = current.point2[1];
                const endX = xyValue[0];
                const endY = xyValue[1];
                const differentPosition = Math.abs(startX - endX) > 1 || Math.abs(startY - endY) > 1;
                
                console.log('  📏 Point3 check:', { startX, startY, endX, endY, differentPosition, mouseMoved: this.mouseMoved });
                
                if (this.mouseMoved || differentPosition) {
                    console.log('  📍 Completing triangle with point3');
                    const newTriangles = [
                        ...triangles.map((d) => ({ ...d, selected: false })),
                        {
                            point1: current.point1,
                            point2: current.point2,
                            point3: xyValue,
                            selected: true,
                            appearance,
                        },
                    ];
                    
                    this.setState(
                        {
                            current: null,
                        },
                        () => {
                            const { onComplete } = this.props;
                            if (onComplete !== undefined) {
                                onComplete(e, newTriangles, moreProps);
                            }
                        },
                    );
                } else {
                    console.log('  ❌ Not completing triangle - no movement detected');
                }
            }
        }
    };

    private readonly handleStart = (e: React.MouseEvent, xyValue: any, moreProps: any) => {
        const { current } = this.state;
        
        console.log('🔺 Triangle handleStart called', { current, xyValue, moreProps: moreProps ? 'exists' : 'missing' });
        console.log('  📍 Raw xyValue coordinates:', xyValue);
        console.log('  📊 MoreProps keys:', moreProps ? Object.keys(moreProps) : 'N/A');

        if (isNotDefined(current) || isNotDefined(current.point1)) {
            console.log('  📍 Setting point1');
            this.mouseMoved = false;

            this.setState(
                {
                    current: {
                        point1: xyValue,
                        point2: null,
                        point3: null,
                    },
                },
                () => {
                    const { onStart } = this.props;
                    if (onStart !== undefined) {
                        onStart(moreProps);
                    }
                },
            );
        }
    };

    private readonly handleDrawTriangle = (_: React.MouseEvent, xyValue: any) => {
        const { current } = this.state;
        
        if (isDefined(current)) {
            this.mouseMoved = true;
            
            if (isDefined(current.point1) && isNotDefined(current.point2)) {
                // Drawing line from point1 to current mouse position
                this.setState({
                    current: {
                        ...current,
                        tempPoint2: xyValue,
                    },
                });
            } else if (isDefined(current.point2) && isNotDefined(current.point3)) {
                // Drawing triangle preview with all three points
                this.setState({
                    current: {
                        ...current,
                        tempPoint3: xyValue,
                    },
                });
            }
        }
    };

    private readonly handleDragTriangleComplete = (e: React.MouseEvent, moreProps: any) => {
        const { override } = this.state;
        if (isDefined(override)) {
            const { triangles } = this.props;
            const newTriangles = triangles.map((each, idx) =>
                idx === override.index
                    ? {
                          ...each,
                          point1: override.point1,
                          point2: override.point2,
                          point3: override.point3,
                          selected: true,
                      }
                    : {
                          ...each,
                          selected: false,
                      },
            );

            this.setState(
                {
                    override: null,
                },
                () => {
                    const { onDragComplete } = this.props;
                    if (onDragComplete !== undefined) {
                        console.log('🔺 TrianglePattern calling onDragComplete with:', newTriangles.length, 'triangles');
                        onDragComplete(e, newTriangles, moreProps);
                    }
                },
            );
        }
    };

    private readonly handleDragTriangle = (_: React.MouseEvent, index: number | undefined, newValues: any) => {
        this.setState({
            override: {
                index,
                ...newValues,
            },
        });
    };
}