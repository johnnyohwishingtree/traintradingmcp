import * as React from "react";
import { ascending as d3Ascending } from "d3-array";
import { noop, strokeDashTypes } from "../../core";
import { getXValue } from "../../core/utils/ChartDataUtil";
import { isHover, saveNodeType } from "../utils";
import { ClickableCircle, HoverTextNearMouse, InteractiveStraightLine, isHovering } from "../components";

export interface EachTrendLineProps {
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
    readonly onEdge1Drag: any; // func
    readonly onEdge2Drag: any; // func
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

interface EachTrendLineState {
    anchor?: string;
    hover?: any;
}

export class EachTrendLine extends React.Component<EachTrendLineProps, EachTrendLineState> {
    public static defaultProps = {
        onDrag: noop,
        onEdge1Drag: noop,
        onEdge2Drag: noop,
        onSelect: noop,
        selected: false,
        edgeStroke: "#000000",
        edgeFill: "#FFFFFF",
        edgeStrokeWidth: 2,
        r: 5,
        strokeWidth: 1,
        strokeDasharray: "Solid",
        hoverText: {
            enable: false,
        },
    };

    private dragStart: any;
    // @ts-ignore
    private isHover: any;
    private saveNodeType: any;

    public constructor(props: EachTrendLineProps) {
        super(props);

        this.isHover = isHover.bind(this);
        this.saveNodeType = saveNodeType.bind(this);

        this.state = {
            hover: false,
        };
    }

    public render() {
        const {
            x1Value,
            y1Value,
            x2Value,
            y2Value,
            type,
            strokeStyle,
            strokeWidth,
            strokeDasharray,
            r,
            edgeStrokeWidth,
            edgeFill,
            edgeStroke,
            edgeInteractiveCursor,
            lineInteractiveCursor,
            hoverText,
            selected,
            onDragComplete,
        } = this.props;

        const {
            enable: hoverTextEnabled,
            selectedText: hoverTextSelected,
            text: hoverTextUnselected,
            ...restHoverTextProps
        } = hoverText;

        const { hover, anchor } = this.state;

        return (
            <g>
                <InteractiveStraightLine
                    ref={this.saveNodeType("line")}
                    selected={selected || hover}
                    onHover={this.handleHover}
                    onUnHover={this.handleHover}
                    onClick={this.handleClick}
                    x1Value={x1Value}
                    y1Value={y1Value}
                    x2Value={x2Value}
                    y2Value={y2Value}
                    type={type}
                    strokeStyle={strokeStyle}
                    strokeWidth={hover || selected ? strokeWidth + 1 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    interactiveCursorClass={lineInteractiveCursor}
                    onDragStart={this.handleLineDragStart}
                    onDrag={this.handleLineDrag}
                    onDragComplete={this.handleDragComplete}
                />
                <ClickableCircle
                    ref={this.saveNodeType("edge1")}
                    show={selected || hover}
                    cx={x1Value}
                    cy={y1Value}
                    r={r}
                    fillStyle={edgeFill}
                    strokeStyle={anchor === "edge1" ? strokeStyle : edgeStroke}
                    strokeWidth={edgeStrokeWidth}
                    interactiveCursorClass={edgeInteractiveCursor}
                    onDragStart={this.handleEdge1DragStart}
                    onDrag={this.handleEdge1Drag}
                    onDragComplete={this.handleDragComplete}
                />
                <ClickableCircle
                    ref={this.saveNodeType("edge2")}
                    show={selected || hover}
                    cx={x2Value}
                    cy={y2Value}
                    r={r}
                    fillStyle={edgeFill}
                    strokeStyle={anchor === "edge2" ? strokeStyle : edgeStroke}
                    strokeWidth={edgeStrokeWidth}
                    interactiveCursorClass={edgeInteractiveCursor}
                    onDragStart={this.handleEdge2DragStart}
                    onDrag={this.handleEdge2Drag}
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
        const { index, onSelect, x1Value, y1Value, x2Value, y2Value, type } = this.props;
        
        // Use the same hover detection logic as InteractiveStraightLine
        const isActuallyHovered = this.checkIfHovered(moreProps);
        
        console.log('📌 EachTrendLine clicked, index:', index, 'isActuallyHovered:', isActuallyHovered, 'coords:', {
            start: [x1Value, y1Value],
            end: [x2Value, y2Value]
        });
        
        // Only process the click if this line is actually being hovered
        if (onSelect && isActuallyHovered) {
            const selectionData = [{
                index,
                start: [x1Value, y1Value],
                end: [x2Value, y2Value],
                x1Value,
                y1Value,
                x2Value,
                y2Value,
                selected: true,
                type: this.props.type,
            }];
            
            onSelect(e, selectionData, moreProps);
        }
    };

    private readonly handleEdge2Drag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag, x1Value, y1Value } = this.props;

        const [x2Value, y2Value] = getNewXY(moreProps);

        onDrag(e, index, {
            x1Value,
            y1Value,
            x2Value,
            y2Value,
        });
    };

    private readonly handleEdge1Drag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag, x2Value, y2Value } = this.props;

        const [x1Value, y1Value] = getNewXY(moreProps);

        onDrag(e, index, {
            x1Value,
            y1Value,
            x2Value,
            y2Value,
        });
    };

    private readonly handleDragComplete = (e: React.MouseEvent, moreProps: any) => {
        console.log('🏁 EachTrendLine handleDragComplete called');
        
        this.setState({
            anchor: undefined,
        });

        const { onDragComplete, onSelect, index, x1Value, y1Value, x2Value, y2Value, type } = this.props;
        
        // First call onDragComplete to update the position
        if (onDragComplete !== undefined) {
            onDragComplete(e, moreProps);
        }
        
        // Then select this line after dragging
        if (onSelect !== undefined) {
            console.log('  📌 Selecting line after drag, index:', index);
            const selectionData = [{
                index,
                start: [x1Value, y1Value],
                end: [x2Value, y2Value],
                x1Value,
                y1Value,
                x2Value,
                y2Value,
                selected: true,
                type,
            }];
            
            // Use a small timeout to ensure drag complete finishes first
            setTimeout(() => {
                onSelect(e, selectionData, moreProps);
            }, 50);
        }
    };

    private readonly handleEdge2DragStart = () => {
        this.setState({
            anchor: "edge1",
        });
    };

    private readonly handleEdge1DragStart = () => {
        this.setState({
            anchor: "edge2",
        });
    };

    private readonly handleLineDrag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag } = this.props;

        const { x1Value, y1Value, x2Value, y2Value } = this.dragStart;

        const {
            xScale,
            chartConfig: { yScale },
            xAccessor,
            fullData,
        } = moreProps;
        const { startPos, mouseXY } = moreProps;

        const x1 = xScale(x1Value);
        const y1 = yScale(y1Value);
        const x2 = xScale(x2Value);
        const y2 = yScale(y2Value);

        const dx = startPos[0] - mouseXY[0];
        const dy = startPos[1] - mouseXY[1];

        const newX1Value = getXValue(xScale, xAccessor, [x1 - dx, y1 - dy], fullData);
        const newY1Value = yScale.invert(y1 - dy);
        const newX2Value = getXValue(xScale, xAccessor, [x2 - dx, y2 - dy], fullData);
        const newY2Value = yScale.invert(y2 - dy);

        onDrag(e, index, {
            x1Value: newX1Value,
            y1Value: newY1Value,
            x2Value: newX2Value,
            y2Value: newY2Value,
        });
    };

    private readonly handleLineDragStart = () => {
        const { x1Value, y1Value, x2Value, y2Value } = this.props;

        this.dragStart = {
            x1Value,
            y1Value,
            x2Value,
            y2Value,
        };
    };

    private readonly checkIfHovered = (moreProps: any) => {
        const { x1Value, x2Value, y1Value, y2Value, type, index } = this.props;
        const { mouseXY, xScale } = moreProps;
        const {
            chartConfig: { yScale },
        } = moreProps;

        const tolerance = 50; // Increased tolerance for easier selection

        // Convert line coordinates to screen coordinates
        const x1Screen = xScale(x1Value);
        const x2Screen = xScale(x2Value);
        const y1Screen = yScale(y1Value);
        const y2Screen = yScale(y2Value);

        const [mouseX, mouseY] = mouseXY;

        // Calculate distance from mouse to line segment
        // Using point-to-line-segment distance formula
        const A = mouseX - x1Screen;
        const B = mouseY - y1Screen;
        const C = x2Screen - x1Screen;
        const D = y2Screen - y1Screen;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        let param = -1;
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;
        if (param < 0) {
            xx = x1Screen;
            yy = y1Screen;
        } else if (param > 1) {
            xx = x2Screen;
            yy = y2Screen;
        } else {
            xx = x1Screen + param * C;
            yy = y1Screen + param * D;
        }

        const dx = mouseX - xx;
        const dy = mouseY - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const result = distance <= tolerance;
        
        console.log('🎯 Line hover check:', {
            index,
            mouseXY: [mouseX, mouseY],
            lineScreenCoords: [[x1Screen, y1Screen], [x2Screen, y2Screen]],
            closestPoint: [xx, yy],
            distance: distance.toFixed(1),
            tolerance,
            result
        });

        return result;
    };
}

export function getNewXY(moreProps: any) {
    const {
        xScale,
        chartConfig: { yScale },
        xAccessor,
        plotData,
        mouseXY,
    } = moreProps;
    const mouseY = mouseXY[1];

    const x = getXValue(xScale, xAccessor, mouseXY, plotData);

    const [small, big] = yScale.domain().slice().sort(d3Ascending);
    const y = yScale.invert(mouseY);
    const newY = Math.min(Math.max(y, small), big);

    return [x, newY];
}
