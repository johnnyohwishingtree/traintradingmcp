import * as React from "react";
import { ascending as d3Ascending } from "d3-array";
import { noop, strokeDashTypes } from "../../core";
import { getXValue } from "../../core/utils/ChartDataUtil";
import { isHover, saveNodeType } from "../utils";
import { ClickableCircle, HoverTextNearMouse, InteractiveStraightLine, isHovering } from "../components";
import { InteractiveBo } from "./InteractiveBo";

export interface EachVerticalLineTrendProps {
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

interface EachVerticalLineTrendState {
    hover?: boolean;
}

export class EachVerticalLineTrend extends React.Component<EachVerticalLineTrendProps, EachVerticalLineTrendState> {
    private saveNodeType: any;

    public constructor(props: EachVerticalLineTrendProps) {
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

        // For vertical lines, use the same X coordinate for both points
        const verticalX = x1Value;
        const midY = (y1Value + y2Value) / 2;

        // For RAY type, show control point at start (origin)
        // For XLINE type, show control point at midpoint
        const controlPointY = type === "RAY" ? y1Value : midY;

        // Use InteractiveBo utility for control point visibility
        const showControlPoints = InteractiveBo.shouldShowControlPoints(this);

        // Debug logging
        if (selected) {
            console.log("🎯 EachVerticalLineTrend rendering SELECTED:", {
                type,
                selected,
                hover,
                verticalX,
                controlPointY,
                y1Value,
                y2Value,
                x1Value,
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
                    x1Value={verticalX}
                    y1Value={y1Value}
                    x2Value={verticalX}
                    y2Value={y2Value}
                />
                {/* Control point: at start for RAY, at middle for XLINE */}
                <ClickableCircle
                    ref={this.saveNodeType("controlPoint")}
                    show={showControlPoints}
                    cx={verticalX}
                    cy={controlPointY}
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
    };

    // ✅ REFACTORED: Use InteractiveBo.handleClick
    private readonly handleClick = (e: React.MouseEvent, moreProps: any) => {
        // Vertical lines are always "hovered" if we get a click (simplified hover detection)
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
        console.log("🖱️ Vertical line drag start");
    };

    private readonly handleLineDrag = (e: React.MouseEvent, moreProps: any) => {
        // For vertical lines, dragging moves the X coordinate horizontally
        // The Y coordinates stay the same (infinite vertical line)
        const { index, onDrag, y1Value, y2Value } = this.props;

        // Extract mouseXY and xScale from moreProps
        const { mouseXY, xScale } = moreProps;

        // Convert screen X coordinate to data X value
        const newXValue = xScale.invert(mouseXY[0]);

        // For XLINE type, keep the same Y range, only move X
        if (onDrag) {
            onDrag(e, index, {
                x1Value: newXValue,
                y1Value: y1Value,
                x2Value: newXValue,
                y2Value: y2Value,
            });
        }
    };

    private readonly handleMidpointDragBothAxes = (e: React.MouseEvent, moreProps: any) => {
        // For vertical rays, allow moving both X and Y position while maintaining vertical orientation
        const { index, onDrag, y1Value, y2Value } = this.props;

        // Extract mouseXY, xScale, and yScale from moreProps
        const {
            mouseXY,
            xScale,
            chartConfig: { yScale },
        } = moreProps;

        // Convert screen coordinates to data values
        const newXValue = xScale.invert(mouseXY[0]);
        const newYValue = yScale.invert(mouseXY[1]);

        // Calculate the delta to shift both y1 and y2
        const deltaY = newYValue - y1Value;

        // For RAY type, move both endpoints vertically while keeping X the same
        if (onDrag) {
            onDrag(e, index, {
                x1Value: newXValue,
                y1Value: y1Value + deltaY,
                x2Value: newXValue,
                y2Value: y2Value + deltaY,
            });
        }
    };

    private readonly handleMidpointDragStart = () => {
        console.log("🖱️ Vertical line midpoint drag start");
    };

    private readonly handleMidpointDrag = (e: React.MouseEvent, moreProps: any) => {
        const { type } = this.props;

        // For RAY type, allow moving in both directions
        // For XLINE type (infinite vertical line), only allow horizontal movement
        if (type === "RAY") {
            this.handleMidpointDragBothAxes(e, moreProps);
        } else {
            // For XLINE, dragging the midpoint moves the entire line horizontally only
            this.handleLineDrag(e, moreProps);
        }
    };

    private readonly handleControlPointDragStart = () => {
        console.log("🖱️ Control point drag start");
    };

    private readonly handleControlPointDrag = (e: React.MouseEvent, moreProps: any) => {
        const { type } = this.props;

        // For RAY type, allow moving in both directions
        // For XLINE type (infinite vertical line), only allow horizontal movement
        if (type === "RAY") {
            this.handleMidpointDragBothAxes(e, moreProps);
        } else {
            // For XLINE, dragging the control point moves the entire line horizontally only
            this.handleLineDrag(e, moreProps);
        }
    };

    // ✅ REFACTORED: Use InteractiveBo.handleDragComplete
    private readonly handleDragComplete = (e: React.MouseEvent, moreProps: any) => {
        console.log("🏁 Vertical line drag complete");

        InteractiveBo.handleDragComplete(this, e, moreProps, this.getSelectionData);
    };
}
