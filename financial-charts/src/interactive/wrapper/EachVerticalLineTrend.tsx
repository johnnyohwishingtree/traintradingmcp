import * as React from "react";
import { ascending as d3Ascending } from "d3-array";
import { noop, strokeDashTypes } from "../../core";
import { getXValue } from "../../core/utils/ChartDataUtil";
import { isHover, saveNodeType } from "../utils";
import { ClickableCircle, HoverTextNearMouse, InteractiveStraightLine, isHovering } from "../components";

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
                {/* Single control point in the middle for vertical movement */}
                <ClickableCircle
                    ref={this.saveNodeType("midpoint")}
                    show={selected || hover}
                    cx={verticalX}
                    cy={midY}
                    r={r}
                    fillStyle={edgeFill}
                    strokeStyle={edgeStroke}
                    strokeWidth={edgeStrokeWidth}
                    interactiveCursorClass={edgeInteractiveCursor}
                    onDragStart={this.handleMidpointDragStart}
                    onDrag={this.handleMidpointDrag}
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

    private readonly handleHover = (_: React.MouseEvent, moreProps: any) => {
        if (this.state.hover !== moreProps.hovering) {
            this.setState({
                hover: moreProps.hovering,
            });
        }
    };

    private readonly handleClick = (e: React.MouseEvent, moreProps: any) => {
        const { index, onSelect, x1Value, y1Value, x2Value, y2Value } = this.props;
        
        console.log('📌 EachVerticalLineTrend clicked, index:', index);
        
        if (onSelect) {
            const selectionData = [{
                index,
                start: [x1Value, y1Value],
                end: [x2Value, y2Value],
                selected: true,
            }];
            onSelect(e, selectionData, moreProps);
        }
    };

    private readonly handleDragStart = () => {
        console.log('🖱️ Vertical line drag start');
    };

    private readonly handleLineDrag = (e: React.MouseEvent, moreProps: any) => {
        // For vertical lines, only allow Y movement - dragging the line moves it vertically
        const { index, onDrag, x1Value } = this.props;
        const { mouseXY } = moreProps;
        
        // Keep X coordinate fixed, use mouse Y
        const newX = x1Value; // Fixed X coordinate for vertical line
        const deltaY = mouseXY[1];
        
        if (onDrag) {
            onDrag(e, index, {
                x1Value: newX,
                y1Value: deltaY - 50, // Offset for line height
                x2Value: newX,
                y2Value: deltaY + 50,
            });
        }
    };

    private readonly handleMidpointDragStart = () => {
        console.log('🖱️ Vertical line midpoint drag start');
    };

    private readonly handleMidpointDrag = (e: React.MouseEvent, moreProps: any) => {
        // For vertical lines, dragging the midpoint moves the entire line vertically
        this.handleLineDrag(e, moreProps);
    };

    private readonly handleDragComplete = (e: React.MouseEvent, moreProps: any) => {
        console.log('🏁 Vertical line drag complete');
        const { onDragComplete } = this.props;
        if (onDragComplete) {
            onDragComplete(e, moreProps);
        }
    };
}