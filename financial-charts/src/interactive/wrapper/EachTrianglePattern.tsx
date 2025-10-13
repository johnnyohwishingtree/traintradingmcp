import * as React from "react";
import { isDefined, noop } from "../../core";
import { ClickableCircle, HoverTextNearMouse, TriangleWithArea } from "../components";
import { getNewXY } from "./EachTrendLine";

interface EachTrianglePatternProps {
    readonly index: number;
    readonly selected: boolean;
    readonly point1: number[];
    readonly point2: number[];
    readonly point3: number[];
    readonly strokeStyle: string;
    readonly strokeWidth: number;
    readonly fillStyle: string;
    readonly fillOpacity: number;
    readonly edgeStroke: string;
    readonly edgeFill: string;
    readonly edgeStrokeWidth: number;
    readonly r: number;
    readonly hoverText: any;
    readonly onSelect?: (e: React.MouseEvent, interactives: any[], moreProps: any) => void;
    readonly onDrag?: (e: React.MouseEvent, index: number, newValues: any) => void;
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
}

interface EachTrianglePatternState {
    hover: boolean;
    anchor?: "point1" | "point2" | "point3";
}

export class EachTrianglePattern extends React.Component<EachTrianglePatternProps, EachTrianglePatternState> {
    public static defaultProps = {
        selected: false,
        onDrag: noop,
    };

    public constructor(props: EachTrianglePatternProps) {
        super(props);

        this.state = {
            hover: false,
        };
    }

    public render() {
        const {
            point1,
            point2,
            point3,
            strokeStyle,
            strokeWidth,
            fillStyle,
            fillOpacity,
            edgeStroke,
            edgeFill,
            edgeStrokeWidth,
            r,
            selected,
            hoverText,
            onDragComplete,
        } = this.props;

        const { hover, anchor } = this.state;

        if (!isDefined(point1) || !isDefined(point2) || !isDefined(point3)) {
            return null;
        }

        const hoverTextEnabled = isDefined(hoverText) && hoverText.enable;
        const hoverTextUnselected = isDefined(hoverText) && hoverText.text;
        const hoverTextSelected = isDefined(hoverText) && hoverText.selectedText;

        return (
            <g>
                {/* Triangle area with drag support - modeled after ChannelWithArea */}
                <TriangleWithArea
                    point1={point1}
                    point2={point2}
                    point3={point3}
                    strokeStyle={strokeStyle}
                    strokeWidth={strokeWidth}
                    fillStyle={fillStyle}
                    fillOpacity={fillOpacity}
                    selected={selected || hover}
                    tolerance={4}
                    interactiveCursorClass="react-financial-charts-move-cursor"
                    onDragStart={this.handleTriangleDragStart}
                    onDrag={this.handleTriangleDrag}
                    onDragComplete={this.handleDragComplete}
                    onHover={this.handleHover}
                    onUnHover={this.handleHover}
                    onClick={this.handleTriangleClick}
                />

                {/* Control points (circles) - use data coordinates directly */}
                {(selected || hover) && (
                    <>
                        <ClickableCircle
                            show={true}
                            cx={point1[0]}
                            cy={point1[1]}
                            r={r}
                            fillStyle={anchor === "point1" ? strokeStyle : edgeFill}
                            strokeStyle={edgeStroke}
                            strokeWidth={edgeStrokeWidth}
                            onDragStart={this.handlePoint1DragStart}
                            onDrag={this.handlePoint1Drag}
                            onDragComplete={this.handleDragComplete}
                        />
                        <ClickableCircle
                            show={true}
                            cx={point2[0]}
                            cy={point2[1]}
                            r={r}
                            fillStyle={anchor === "point2" ? strokeStyle : edgeFill}
                            strokeStyle={edgeStroke}
                            strokeWidth={edgeStrokeWidth}
                            onDragStart={this.handlePoint2DragStart}
                            onDrag={this.handlePoint2Drag}
                            onDragComplete={this.handleDragComplete}
                        />
                        <ClickableCircle
                            show={true}
                            cx={point3[0]}
                            cy={point3[1]}
                            r={r}
                            fillStyle={anchor === "point3" ? strokeStyle : edgeFill}
                            strokeStyle={edgeStroke}
                            strokeWidth={edgeStrokeWidth}
                            onDragStart={this.handlePoint3DragStart}
                            onDrag={this.handlePoint3Drag}
                            onDragComplete={this.handleDragComplete}
                        />
                    </>
                )}

                <HoverTextNearMouse
                    show={hoverTextEnabled && hover}
                    {...hoverText}
                    text={selected ? hoverTextSelected : hoverTextUnselected}
                />
            </g>
        );
    }

    private readonly handleHover = (e: React.MouseEvent, moreProps: any) => {
        if (this.state.hover !== moreProps.hovering) {
            this.setState({
                hover: moreProps.hovering,
            });
        }
    };

    private readonly handleTriangleClick = (e: React.MouseEvent, moreProps: any) => {
        const { index, onSelect, point1, point2, point3 } = this.props;
        
        // Use proper hover detection like TrendLine
        const isActuallyHovered = this.checkIfHovered(moreProps);
        
        console.log('🔺 EachTrianglePattern clicked, index:', index, 'isActuallyHovered:', isActuallyHovered, 'coordinates:', {
            point1, point2, point3
        });
        
        // Only process the click if this triangle is actually being hovered
        if (onSelect && isActuallyHovered) {
            const selectionData = [{
                index,
                point1,
                point2,
                point3,
                selected: true,
            }];
            
            onSelect(e, selectionData, moreProps);
        }
    };

    private readonly checkIfHovered = (moreProps: any) => {
        const { point1, point2, point3, index } = this.props;
        const { mouseXY, xScale } = moreProps;
        const {
            chartConfig: { yScale },
        } = moreProps;

        const tolerance = 20; // Triangle area tolerance

        // Convert triangle coordinates to screen coordinates
        const p1 = [xScale(point1[0]), yScale(point1[1])];
        const p2 = [xScale(point2[0]), yScale(point2[1])];
        const p3 = [xScale(point3[0]), yScale(point3[1])];

        const [mouseX, mouseY] = mouseXY;

        // Check if point is inside triangle using barycentric coordinates
        const isInsideTriangle = this.pointInTriangle([mouseX, mouseY], p1, p2, p3);
        
        if (isInsideTriangle) {
            console.log(`🔺 EachTrianglePattern[${index}] hover detected inside triangle area`);
            return true;
        }

        // Check if mouse is near any triangle edge
        const edgeDistance1 = this.distanceToLineSegment([mouseX, mouseY], p1, p2);
        const edgeDistance2 = this.distanceToLineSegment([mouseX, mouseY], p2, p3);
        const edgeDistance3 = this.distanceToLineSegment([mouseX, mouseY], p3, p1);
        
        const minDistance = Math.min(edgeDistance1, edgeDistance2, edgeDistance3);
        
        if (minDistance <= tolerance) {
            console.log(`🔺 EachTrianglePattern[${index}] hover detected on edge, distance: ${minDistance}`);
            return true;
        }

        return false;
    };

    private pointInTriangle(point: number[], v1: number[], v2: number[], v3: number[]): boolean {
        const [x, y] = point;
        const [x1, y1] = v1;
        const [x2, y2] = v2;
        const [x3, y3] = v3;

        const denominator = ((y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3));
        if (Math.abs(denominator) < 1e-10) return false;

        const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denominator;
        const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denominator;
        const c = 1 - a - b;

        return a >= 0 && b >= 0 && c >= 0;
    }

    private distanceToLineSegment(point: number[], lineStart: number[], lineEnd: number[]): number {
        const [x, y] = point;
        const [x1, y1] = lineStart;
        const [x2, y2] = lineEnd;

        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) {
            return Math.sqrt(A * A + B * B);
        }

        const param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private readonly handleDragComplete = (e: React.MouseEvent, moreProps: any) => {
        console.log('🏁 EachTrianglePattern handleDragComplete called');
        
        const { onDragComplete, onSelect, index, point1, point2, point3 } = this.props;
        
        // First call onDragComplete to update the position
        if (onDragComplete !== undefined) {
            onDragComplete(e, moreProps);
        }
        
        // Then select this triangle after dragging
        if (onSelect !== undefined) {
            console.log('  🔺 Selecting triangle after drag, index:', index);
            const selectionData = [{
                index,
                point1,
                point2,
                point3,
                selected: true,
            }];
            
            // Use a small timeout to ensure drag complete finishes first
            setTimeout(() => {
                onSelect(e, selectionData, moreProps);
            }, 50);
        }
    };

    // Triangle area drag - move entire triangle
    private readonly handleTriangleDragStart = () => {
        // No specific setup needed - TriangleWithArea handles the logic
    };

    private readonly handleTriangleDrag = (e: React.MouseEvent, newTriangleData: any) => {
        const { index, onDrag } = this.props;

        console.log('🔄 EachTrianglePattern.handleTriangleDrag called:', { index, hasOnDrag: !!onDrag, newTriangleData });

        if (onDrag) {
            // TriangleWithArea passes the new triangle coordinates directly
            onDrag(e, index, newTriangleData);
        }
    };

    private readonly handlePoint1DragStart = () => {
        this.setState({
            anchor: "point1",
        });
    };

    private readonly handlePoint2DragStart = () => {
        this.setState({
            anchor: "point2",
        });
    };

    private readonly handlePoint3DragStart = () => {
        this.setState({
            anchor: "point3",
        });
    };

    private readonly handlePoint1Drag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag, point2, point3 } = this.props;
        const [newX, newY] = getNewXY(moreProps);

        if (onDrag) {
            onDrag(e, index, {
                point1: [newX, newY],
                point2,
                point3,
            });
        }
    };

    private readonly handlePoint2Drag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag, point1, point3 } = this.props;
        const [newX, newY] = getNewXY(moreProps);

        if (onDrag) {
            onDrag(e, index, {
                point1,
                point2: [newX, newY],
                point3,
            });
        }
    };

    private readonly handlePoint3Drag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag, point1, point2 } = this.props;
        const [newX, newY] = getNewXY(moreProps);

        if (onDrag) {
            onDrag(e, index, {
                point1,
                point2,
                point3: [newX, newY],
            });
        }
    };

}