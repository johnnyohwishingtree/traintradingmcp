import * as React from "react";
import { ascending as d3Ascending } from "d3-array";
import { noop, strokeDashTypes } from "../../core";
import { getXValue } from "../../core/utils/ChartDataUtil";
import { isHover, saveNodeType } from "../utils";
import { ClickableCircle, HoverTextNearMouse, InteractiveStraightLine, isHovering } from "../components";
import { InteractiveBo } from "./InteractiveBo";
import { interactiveFeaturesManager } from "../../InteractiveFeaturesManager";

export interface EachHorizontalLineTrendProps {
    readonly x1Value: any;
    readonly x2Value: any;
    readonly y1Value: any;
    readonly y2Value: any;
    readonly index?: number;
    readonly type:
        | "XLINE" // extends from -Infinity to +Infinity
        | "RAY" // extends to +/-Infinity in one direction
        | "LINE"; // extends between the set bounds
    readonly onDrag: (e: React.MouseEvent, index: number | undefined, moreProps: any) => void;
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    readonly onSelect: (e: React.MouseEvent, interactives: any[], moreProps: any) => void;
    readonly r: number;
    readonly strokeOpacity: number;
    readonly defaultClassName?: string;
    readonly selected?: boolean;
    readonly strokeStyle: string;
    readonly strokeWidth: number;
    readonly strokeDasharray: strokeDashTypes;
    readonly edgeStrokeWidth: number;
    readonly edgeStroke: string;
    readonly edgeInteractiveCursor: string;
    readonly lineInteractiveCursor: string;
    readonly edgeFill: string;
    readonly hoverText: {
        readonly enable: boolean;
        readonly fontFamily: string;
        readonly fontSize: number;
        readonly fill: string;
        readonly text: string;
        readonly selectedText: string;
        readonly bgFill: string;
        readonly bgOpacity: number;
        readonly bgWidth: number | string;
        readonly bgHeight: number | string;
    };
}

interface EachHorizontalLineTrendState {
    hover?: boolean;
}

export class EachHorizontalLineTrend extends React.Component<
    EachHorizontalLineTrendProps,
    EachHorizontalLineTrendState
> {
    private saveNodeType: any;

    public constructor(props: EachHorizontalLineTrendProps) {
        super(props);

        this.saveNodeType = saveNodeType.bind(this);
        this.state = {};
    }

    public render() {
        const {
            x1Value,
            y1Value,
            x2Value,
            y2Value,
            strokeStyle,
            strokeWidth,
            strokeOpacity,
            strokeDasharray,
            type,
            r,
            edgeFill,
            edgeStroke,
            edgeStrokeWidth,
            edgeInteractiveCursor,
            lineInteractiveCursor,
            selected,
            hoverText,
        } = this.props;

        const { hover } = this.state;

        const {
            enable: hoverTextEnabled,
            selectedText: hoverTextSelected,
            text: hoverTextUnselected,
            ...restHoverTextProps
        } = hoverText;

        // For horizontal lines, use the same Y coordinate for both points
        const horizontalY = y1Value;
        const midX = (x1Value + x2Value) / 2;

        // For RAY type, show control point at start (origin)
        // For XLINE type, show control point at midpoint
        const controlPointX = type === "RAY" ? x1Value : midX;

        // Use InteractiveBo utility for control point visibility
        const showControlPoints = InteractiveBo.shouldShowControlPoints(this);

        // Debug logging
        if (selected) {
            console.log("🎯 EachHorizontalLineTrend rendering SELECTED:", {
                type,
                selected,
                hover,
                controlPointX,
                horizontalY,
                x1Value,
                x2Value,
                y1Value,
                showCircle: selected || hover,
            });
        }

        return (
            <g>
                <InteractiveStraightLine
                    ref={this.saveNodeType("line")}
                    selected={selected}
                    onHover={this.handleHover}
                    onClick={this.handleClick}
                    onDragStart={this.handleDragStart}
                    onDrag={this.handleLineDrag}
                    onDragComplete={this.handleDragComplete}
                    strokeStyle={strokeStyle}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    interactiveCursorClass={lineInteractiveCursor}
                    type={type}
                    x1Value={x1Value}
                    y1Value={horizontalY}
                    x2Value={x2Value}
                    y2Value={horizontalY}
                />
                {/* Control point: at start for RAY, at middle for XLINE */}
                <ClickableCircle
                    ref={this.saveNodeType("controlPoint")}
                    show={showControlPoints}
                    cx={controlPointX}
                    cy={horizontalY}
                    r={r || 6}
                    fillStyle={edgeFill || "#FFFFFF"}
                    strokeStyle={edgeStroke || "#000000"}
                    strokeWidth={edgeStrokeWidth || 2}
                    interactiveCursorClass={edgeInteractiveCursor}
                    onDragStart={this.handleControlPointDragStart}
                    onDrag={this.handleControlPointDrag}
                    onDragComplete={this.handleDragComplete}
                />
                <HoverTextNearMouse
                    show={hoverTextEnabled && hover}
                    {...restHoverTextProps}
                    text={selected ? hoverTextSelected : hoverTextUnselected}
                />
            </g>
        );
    }

    // ✅ REFACTORED: Use InteractiveBo.handleHover
    private readonly handleHover = (_: React.MouseEvent, moreProps: any) => {
        InteractiveBo.handleHover(this, moreProps);

        // Report hover to features manager if selected (for contextual text overlay)
        const { selected, index, x1Value, x2Value, y1Value } = this.props;
        if (selected && moreProps.hovering && typeof index === 'number') {
            const { xScale, chartConfig: { yScale } } = moreProps;

            // Calculate screen bounds for horizontal line
            const screenX1 = xScale(x1Value);
            const screenX2 = xScale(x2Value);
            const screenY = yScale(y1Value);

            const left = Math.min(screenX1, screenX2);
            const right = Math.max(screenX1, screenX2);

            const bounds = {
                left,
                top: screenY - 10,
                right,
                bottom: screenY + 10,
                width: right - left,
                height: 20,
                x: left,
                y: screenY - 10,
            } as DOMRect;

            interactiveFeaturesManager.setHoveredComponent('horizontalline', index, bounds);
        } else if (!moreProps.hovering) {
            interactiveFeaturesManager.clearHoveredComponent();
        }
    };

    // ✅ REFACTORED: Use InteractiveBo.handleClick
    private readonly handleClick = (e: React.MouseEvent, moreProps: any) => {
        // Horizontal lines are always "hovered" if we get a click (simplified hover detection)
        InteractiveBo.handleClick(this, e, moreProps, () => true, this.getSelectionData);
    };

    // ✅ NEW: Extracted selection data logic for reuse
    private readonly getSelectionData = (): any[] => {
        const { index, x1Value, y1Value, x2Value, y2Value } = this.props;

        return [
            {
                index,
                start: [x1Value, y1Value],
                end: [x2Value, y2Value],
                selected: true,
            },
        ];
    };

    private readonly handleDragStart = () => {
        console.log("🖱️ Horizontal line drag start");
    };

    private readonly handleLineDrag = (e: React.MouseEvent, moreProps: any) => {
        // For horizontal lines, dragging moves the Y coordinate vertically
        // The X coordinates stay the same (infinite horizontal line)
        const { index, onDrag, x1Value, x2Value } = this.props;

        // Extract mouseXY and yScale from moreProps
        const {
            mouseXY,
            chartConfig: { yScale },
        } = moreProps;

        // Convert screen Y coordinate to data Y value
        const newYValue = yScale.invert(mouseXY[1]);

        // For XLINE type, keep the same X range, only move Y
        if (onDrag) {
            onDrag(e, index, {
                x1Value: x1Value,
                y1Value: newYValue,
                x2Value: x2Value,
                y2Value: newYValue,
            });
        }
    };

    private readonly handleMidpointDragBothAxes = (e: React.MouseEvent, moreProps: any) => {
        // For horizontal rays, allow moving both X and Y position while maintaining horizontal orientation
        const { index, onDrag, x1Value, x2Value } = this.props;

        // Extract mouseXY, xScale, and yScale from moreProps
        const {
            mouseXY,
            chartConfig: { yScale },
            xAccessor,
            plotData,
        } = moreProps;

        // Convert screen coordinates to data values
        const newYValue = yScale.invert(mouseXY[1]);

        // Find the closest data point for X coordinate
        const mouseX = mouseXY[0];
        let newXValue = x1Value; // Default to current position

        if (plotData && plotData.length > 0) {
            // Find the data point closest to the mouse X position
            const xScale = moreProps.xScale;
            if (xScale) {
                newXValue = xScale.invert(mouseX);
            }
        }

        // Calculate the delta to shift both x1 and x2
        const deltaX = newXValue - x1Value;

        // For RAY type, move both endpoints horizontally while keeping Y the same
        if (onDrag) {
            onDrag(e, index, {
                x1Value: x1Value + deltaX,
                y1Value: newYValue,
                x2Value: x2Value + deltaX,
                y2Value: newYValue,
            });
        }
    };

    private readonly handleMidpointDragStart = () => {
        console.log("🖱️ Horizontal line midpoint drag start");
    };

    private readonly handleMidpointDrag = (e: React.MouseEvent, moreProps: any) => {
        const { type } = this.props;

        // For RAY type, allow moving in both directions
        // For XLINE type (infinite horizontal line), only allow vertical movement
        if (type === "RAY") {
            this.handleMidpointDragBothAxes(e, moreProps);
        } else {
            // For XLINE, dragging the midpoint moves the entire line vertically only
            this.handleLineDrag(e, moreProps);
        }
    };

    private readonly handleControlPointDragStart = () => {
        console.log("🖱️ Control point drag start");
    };

    private readonly handleControlPointDrag = (e: React.MouseEvent, moreProps: any) => {
        const { type } = this.props;

        // For RAY type, allow moving in both directions
        // For XLINE type (infinite horizontal line), only allow vertical movement
        if (type === "RAY") {
            this.handleMidpointDragBothAxes(e, moreProps);
        } else {
            // For XLINE, dragging the control point moves the entire line vertically only
            this.handleLineDrag(e, moreProps);
        }
    };

    // ✅ REFACTORED: Use InteractiveBo.handleDragComplete
    private readonly handleDragComplete = (e: React.MouseEvent, moreProps: any) => {
        console.log("🏁 Horizontal line drag complete");

        InteractiveBo.handleDragComplete(this, e, moreProps, this.getSelectionData);
    };
}
