import * as React from "react";
import { isDefined, getMouseCanvas, GenericChartComponent } from "../../core";

export interface TriangleWithAreaProps {
    readonly point1?: number[];
    readonly point2?: number[];
    readonly point3?: number[];
    readonly interactiveCursorClass?: string;
    readonly strokeStyle: string;
    readonly strokeWidth: number;
    readonly fillStyle: string;
    readonly fillOpacity: number;
    readonly onDragStart?: (e: React.MouseEvent, moreProps: any) => void;
    readonly onDrag?: (e: React.MouseEvent, moreProps: any) => void;
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    readonly onHover?: (e: React.MouseEvent, moreProps: any) => void;
    readonly onUnHover?: (e: React.MouseEvent, moreProps: any) => void;
    readonly onClick?: (e: React.MouseEvent, moreProps: any) => void;
    readonly defaultClassName?: string;
    readonly tolerance: number;
    readonly selected: boolean;
}

interface TriangleWithAreaState {
    dragStartPos?: [number, number];
    originalPoints?: {
        point1: [number, number];
        point2: [number, number];
        point3: [number, number];
    };
}

export class TriangleWithArea extends React.Component<TriangleWithAreaProps, TriangleWithAreaState> {
    public static defaultProps = {
        strokeWidth: 1,
        tolerance: 20,
        selected: false,
        fillOpacity: 0.1,
    };

    public constructor(props: TriangleWithAreaProps) {
        super(props);
        this.state = {};
    }

    public render() {
        const { selected, interactiveCursorClass } = this.props;
        const { onDragStart, onDrag, onDragComplete, onHover, onUnHover, onClick } = this.props;

        return (
            <GenericChartComponent
                isHover={this.isHover}
                canvasToDraw={getMouseCanvas}
                canvasDraw={this.drawOnCanvas}
                interactiveCursorClass={interactiveCursorClass}
                selected={selected}
                onDragStart={this.handleDragStart}
                onDrag={this.handleDrag}
                onDragComplete={this.handleDragComplete}
                onHover={onHover}
                onUnHover={onUnHover}
                onClick={onClick}
                drawOn={["mousemove", "mouseleave", "pan", "drag"]}
            />
        );
    }

    private readonly isHover = (moreProps: any) => {
        const { tolerance, onHover } = this.props;
        if (onHover !== undefined) {
            const isTriangleHovered = this.isHoveringOverTriangle(moreProps);
            return isTriangleHovered;
        }
        return false;
    };

    private readonly drawOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { point1, point2, point3, strokeStyle, strokeWidth, fillStyle, fillOpacity, selected } = this.props;

        if (!isDefined(point1) || !isDefined(point2) || !isDefined(point3)) {
            return;
        }

        const {
            xScale,
            chartConfig: { yScale },
        } = moreProps;

        // Convert data coordinates to screen coordinates
        const x1 = xScale(point1[0]);
        const y1 = yScale(point1[1]);
        const x2 = xScale(point2[0]);
        const y2 = yScale(point2[1]);
        const x3 = xScale(point3[0]);
        const y3 = yScale(point3[1]);

        // Draw triangle fill
        ctx.fillStyle = fillStyle;
        ctx.globalAlpha = selected ? fillOpacity + 0.1 : fillOpacity;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fill();

        // Draw triangle outline
        ctx.globalAlpha = 1;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = selected ? strokeWidth + 1 : strokeWidth;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.stroke();
    };

    private readonly isHoveringOverTriangle = (moreProps: any) => {
        const { point1, point2, point3, tolerance } = this.props;
        const { mouseXY, xScale } = moreProps;
        const {
            chartConfig: { yScale },
        } = moreProps;

        if (!point1 || !point2 || !point3) {
            return false;
        }

        const [mouseX, mouseY] = mouseXY;

        // Convert triangle vertices to screen coordinates
        const x1 = xScale(point1[0]);
        const y1 = yScale(point1[1]);
        const x2 = xScale(point2[0]);
        const y2 = yScale(point2[1]);
        const x3 = xScale(point3[0]);
        const y3 = yScale(point3[1]);

        // Check if point is inside triangle using barycentric coordinates
        const denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
        if (Math.abs(denom) < 1e-10) {
            return false;
        } // Degenerate triangle

        const a = ((y2 - y3) * (mouseX - x3) + (x3 - x2) * (mouseY - y3)) / denom;
        const b = ((y3 - y1) * (mouseX - x3) + (x1 - x3) * (mouseY - y3)) / denom;
        const c = 1 - a - b;

        const isInside = a >= 0 && b >= 0 && c >= 0 && a <= 1 && b <= 1 && c <= 1;

        // Also check if point is near triangle edges (for easier selection)
        const distanceToEdge1 = this.pointToLineDistance(mouseX, mouseY, x1, y1, x2, y2);
        const distanceToEdge2 = this.pointToLineDistance(mouseX, mouseY, x2, y2, x3, y3);
        const distanceToEdge3 = this.pointToLineDistance(mouseX, mouseY, x3, y3, x1, y1);

        const nearEdge = distanceToEdge1 <= tolerance || distanceToEdge2 <= tolerance || distanceToEdge3 <= tolerance;

        return isInside || nearEdge;
    };

    private readonly pointToLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        if (lenSq === 0) {
            return Math.sqrt(A * A + B * B);
        }

        let param = dot / lenSq;
        param = Math.max(0, Math.min(1, param));

        const xx = x1 + param * C;
        const yy = y1 + param * D;

        const dx = px - xx;
        const dy = py - yy;

        return Math.sqrt(dx * dx + dy * dy);
    };

    private readonly handleDragStart = (e: React.MouseEvent, moreProps: any) => {
        const { point1, point2, point3, onDragStart } = this.props;
        const {
            mouseXY,
            xScale,
            chartConfig: { yScale },
        } = moreProps;

        // Store drag start position in data coordinates
        const dragStartX = xScale.invert(mouseXY[0]);
        const dragStartY = yScale.invert(mouseXY[1]);

        this.setState({
            dragStartPos: [dragStartX, dragStartY],
            originalPoints: {
                point1: [point1![0], point1![1]],
                point2: [point2![0], point2![1]],
                point3: [point3![0], point3![1]],
            },
        });

        if (onDragStart) {
            onDragStart(e, moreProps);
        }
    };

    private readonly handleDrag = (e: React.MouseEvent, moreProps: any) => {
        const { onDrag } = this.props;
        const { dragStartPos, originalPoints } = this.state;

        if (!dragStartPos || !originalPoints || !onDrag) {
            return;
        }

        const {
            mouseXY,
            xScale,
            chartConfig: { yScale },
        } = moreProps;

        // Calculate current mouse position in data coordinates
        const currentX = xScale.invert(mouseXY[0]);
        const currentY = yScale.invert(mouseXY[1]);

        // Calculate delta from start position
        const deltaX = currentX - dragStartPos[0];
        const deltaY = currentY - dragStartPos[1];

        // Move all three points by the same delta (optimize object creation)
        const newTriangleData = {
            point1: [originalPoints.point1[0] + deltaX, originalPoints.point1[1] + deltaY],
            point2: [originalPoints.point2[0] + deltaX, originalPoints.point2[1] + deltaY],
            point3: [originalPoints.point3[0] + deltaX, originalPoints.point3[1] + deltaY],
        };

        console.log("🔄 TriangleWithArea.handleDrag calling onDrag:", newTriangleData);
        onDrag(e, newTriangleData);
    };

    private readonly handleDragComplete = (e: React.MouseEvent, moreProps: any) => {
        const { onDragComplete } = this.props;

        // Clear drag state
        this.setState({
            dragStartPos: undefined,
            originalPoints: undefined,
        });

        if (onDragComplete) {
            onDragComplete(e, moreProps);
        }
    };
}
