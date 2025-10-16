/**
 * InteractiveBo - Business Object utilities for interactive wrapper components
 * Provides shared logic to eliminate duplication across wrapper components
 *
 * This is a copy of the BO utilities from standalone-chart, adapted for use in the library.
 * In the future, this could be the canonical implementation that standalone-chart imports from.
 */

import { ascending as d3Ascending } from "d3-array";
import { getXValue } from "../../core/utils/ChartDataUtil";

export class InteractiveBo {
    /**
     * Handle hover state updates
     * Eliminates duplication across EachTrendLine, EachTrianglePattern, etc.
     */
    public static handleHover(component: any, moreProps: any): void {
        if (component.state.hover !== moreProps.hovering) {
            component.setState({ hover: moreProps.hovering });
        }
    }

    /**
     * Handle click with hover detection
     * Eliminates duplication across all wrapper components
     */
    public static handleClick(
        component: any,
        e: React.MouseEvent,
        moreProps: any,
        isHoveredFn: (moreProps: any) => boolean,
        getSelectionDataFn: () => any[],
    ): void {
        const isActuallyHovered = isHoveredFn.call(component, moreProps);

        console.log("📌 Component clicked, isActuallyHovered:", isActuallyHovered);

        if (component.props.onSelect && isActuallyHovered) {
            component.props.onSelect(e, getSelectionDataFn.call(component), moreProps);
        }
    }

    /**
     * Handle drag complete + auto-select pattern
     * Eliminates duplication across all wrapper components
     */
    public static handleDragComplete(
        component: any,
        e: React.MouseEvent,
        moreProps: any,
        getSelectionDataFn: () => any[],
    ): void {
        // Clear anchor state (which edge is being dragged)
        component.setState({ anchor: undefined });

        // Call onDragComplete callback if provided
        if (component.props.onDragComplete) {
            component.props.onDragComplete(e, moreProps);
        }

        // Auto-select after drag completes
        if (component.props.onSelect) {
            console.log("  📌 Selecting element after drag");
            setTimeout(() => {
                component.props.onSelect!(e, getSelectionDataFn.call(component), moreProps);
            }, 50);
        }
    }

    /**
     * Calculate distance from point to line segment
     * Used for hover detection on line-based components
     */
    public static distanceToLineSegment(
        point: [number, number],
        lineStart: [number, number],
        lineEnd: [number, number],
    ): number {
        const [x, y] = point;
        const [x1, y1] = lineStart;
        const [x2, y2] = lineEnd;

        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        // If line is a point, return distance to that point
        if (lenSq === 0) {
            return Math.sqrt(A * A + B * B);
        }

        // Find closest point on line segment
        const param = Math.max(0, Math.min(1, dot / lenSq));
        const xx = x1 + param * C;
        const yy = y1 + param * D;

        // Calculate distance
        const dx = x - xx;
        const dy = y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Check if point is inside triangle using barycentric coordinates
     * Used for hover detection on triangle components
     */
    public static pointInTriangle(
        point: [number, number],
        v1: [number, number],
        v2: [number, number],
        v3: [number, number],
    ): boolean {
        const [x, y] = point;
        const [x1, y1] = v1;
        const [x2, y2] = v2;
        const [x3, y3] = v3;

        // Calculate barycentric coordinates
        const denominator = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);

        if (Math.abs(denominator) < 1e-10) {
            return false; // Degenerate triangle
        }

        const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denominator;
        const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denominator;
        const c = 1 - a - b;

        // Point is inside if all barycentric coordinates are non-negative
        return a >= 0 && b >= 0 && c >= 0;
    }

    /**
     * Transform screen coordinates to data coordinates
     * Used for drag operations to convert mouse position to chart data values
     */
    public static transformScreenToData(moreProps: any): [number, number] {
        const {
            xScale,
            chartConfig: { yScale },
            xAccessor,
            plotData,
            mouseXY,
        } = moreProps;

        // Get x value using xAccessor (handles date/time properly)
        const x = getXValue(xScale, xAccessor, mouseXY, plotData);

        // Get y value and clamp to domain
        const [small, big] = yScale.domain().slice().sort(d3Ascending);
        const y = yScale.invert(mouseXY[1]);
        const newY = Math.min(Math.max(y, small), big);

        return [x, newY];
    }

    /**
     * Check if point is near a line (with tolerance)
     * Convenience method that combines coordinate transformation and distance check
     */
    public static isHoveringLine(
        moreProps: any,
        lineStart: [number, number],
        lineEnd: [number, number],
        tolerance = 50,
    ): boolean {
        const {
            mouseXY,
            xScale,
            chartConfig: { yScale },
        } = moreProps;

        // Transform data coordinates to screen coordinates
        const x1Screen = xScale(lineStart[0]);
        const y1Screen = yScale(lineStart[1]);
        const x2Screen = xScale(lineEnd[0]);
        const y2Screen = yScale(lineEnd[1]);

        // Calculate distance
        const distance = this.distanceToLineSegment(mouseXY, [x1Screen, y1Screen], [x2Screen, y2Screen]);

        return distance <= tolerance;
    }

    /**
     * Check if point is near a triangle (inside or near edges)
     * Convenience method for triangle hover detection
     */
    public static isHoveringTriangle(moreProps: any, points: [number, number][], tolerance = 50): boolean {
        if (points.length !== 3) {
            return false;
        }

        const {
            mouseXY,
            xScale,
            chartConfig: { yScale },
        } = moreProps;

        // Transform data coordinates to screen coordinates
        const screenPoints: [number, number][] = points.map(([x, y]) => [xScale(x), yScale(y)]);

        // Check if inside triangle
        if (this.pointInTriangle(mouseXY, screenPoints[0], screenPoints[1], screenPoints[2])) {
            return true;
        }

        // Check if near any edge
        const edge1Distance = this.distanceToLineSegment(mouseXY, screenPoints[0], screenPoints[1]);
        const edge2Distance = this.distanceToLineSegment(mouseXY, screenPoints[1], screenPoints[2]);
        const edge3Distance = this.distanceToLineSegment(mouseXY, screenPoints[2], screenPoints[0]);

        return edge1Distance <= tolerance || edge2Distance <= tolerance || edge3Distance <= tolerance;
    }

    /**
     * Determine if control points should be visible
     * Standard pattern: show when selected OR hovering
     */
    public static shouldShowControlPoints(component: any): boolean {
        return component.props.selected || component.state.hover;
    }

    /**
     * Get standard control point appearance based on state
     */
    public static getControlPointStyle(component: any, isAnchor: boolean): any {
        const { strokeStyle, edgeFill, edgeStroke, edgeStrokeWidth, r } = component.props;

        return {
            r: r || 6,
            fillStyle: edgeFill || "#ffffff",
            strokeStyle: isAnchor ? strokeStyle : edgeStroke || "#2196f3",
            strokeWidth: edgeStrokeWidth || 2,
        };
    }

    /**
     * Create a drag start handler that sets anchor state
     * Eliminates duplication of handleEdge1DragStart, handleEdge2DragStart, etc.
     */
    public static createAnchorDragStartHandler(component: any, anchorName: string): () => void {
        return () => {
            component.setState({ anchor: anchorName });
        };
    }
}
