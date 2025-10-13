import * as React from "react";
import { isDefined, noop } from "../../core";
import { getXValue } from "../../core/utils/ChartDataUtil";
import { isHover, saveNodeType } from "../utils";
import { ChannelWithArea, ClickableCircle, HoverTextNearMouse } from "../components";

export interface EachEquidistantChannelProps {
    readonly startXY: number[];
    readonly endXY: number[];
    readonly dy?: number;
    readonly interactive: boolean;
    readonly selected: boolean;
    readonly hoverText: {
        readonly enable: boolean;
        readonly fontFamily: string;
        readonly fontSize: number;
        readonly fill: string;
        readonly text: string;
        readonly bgFill: string;
        readonly bgOpacity: number;
        readonly bgWidth: number | string;
        readonly bgHeight: number | string;
    };
    readonly appearance: {
        readonly stroke: string;
        readonly strokeWidth: number;
        readonly fill: string;
        readonly fillOpacity?: number;
        readonly edgeStroke: string;
        readonly edgeFill: string;
        readonly edgeFill2: string;
        readonly edgeStrokeWidth: number;
        readonly r: number;
    };
    readonly index?: number;
    readonly onDrag: (e: React.MouseEvent, index: number | undefined, moreProps: any) => void;
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    readonly onSelect?: (e: React.MouseEvent, interactives: any[], moreProps: any) => void;
}

interface EachEquidistantChannelState {
    hover: boolean;
}

export class EachEquidistantChannel extends React.Component<EachEquidistantChannelProps, EachEquidistantChannelState> {
    public static defaultProps = {
        yDisplayFormat: (d: number) => d.toFixed(2),
        interactive: true,
        selected: false,
        onDrag: noop,
        onSelect: noop,
        hoverText: {
            enable: false,
        },
    };

    private dragStart: any;
    // @ts-ignore
    private isHover: any;
    private saveNodeType: any;

    public constructor(props: EachEquidistantChannelProps) {
        super(props);

        this.isHover = isHover.bind(this);
        this.saveNodeType = saveNodeType.bind(this);

        this.state = {
            hover: false,
        };
    }

    public render() {
        const { startXY, endXY, dy } = this.props;
        const { interactive, hoverText, appearance } = this.props;
        const { edgeFill, edgeFill2, stroke, strokeWidth, fill, fillOpacity } = appearance;
        const { selected } = this.props;
        const { onDragComplete } = this.props;
        const { hover } = this.state;
        const { enable: hoverTextEnabled, ...restHoverTextProps } = hoverText;

        const hoverHandler = interactive ? { onHover: this.handleHover, onUnHover: this.handleHover } : {};

        // Convert fill color to rgba with opacity
        const fillStyleWithOpacity = this.convertToRgba(fill, fillOpacity || 0.1);

        const line1Edge =
            isDefined(startXY) && isDefined(endXY) ? (
                <g>
                    {this.getEdgeCircle({
                        xy: startXY,
                        dragHandler: this.handleLine1Edge1Drag,
                        cursor: "react-financial-charts-move-cursor",
                        fill: edgeFill,
                        edge: "line1edge1",
                    })}
                    {this.getEdgeCircle({
                        xy: endXY,
                        dragHandler: this.handleLine1Edge2Drag,
                        cursor: "react-financial-charts-move-cursor",
                        fill: edgeFill,
                        edge: "line1edge2",
                    })}
                </g>
            ) : null;
        const line2Edge =
            dy !== undefined && isDefined(dy) ? (
                <g>
                    {this.getEdgeCircle({
                        xy: [startXY[0], startXY[1] + dy],
                        dragHandler: this.handleChannelHeightChange,
                        cursor: "react-financial-charts-ns-resize-cursor",
                        fill: edgeFill2,
                        edge: "line2edge1",
                    })}
                    {this.getEdgeCircle({
                        xy: [endXY[0], endXY[1] + dy],
                        dragHandler: this.handleChannelHeightChange,
                        cursor: "react-financial-charts-ns-resize-cursor",
                        fill: edgeFill2,
                        edge: "line2edge2",
                    })}
                </g>
            ) : null;

        return (
            <g>
                <ChannelWithArea
                    ref={this.saveNodeType("channel")}
                    selected={selected || hover}
                    {...hoverHandler}
                    startXY={startXY}
                    endXY={endXY}
                    dy={dy}
                    strokeStyle={stroke}
                    strokeWidth={hover || selected ? strokeWidth + 1 : strokeWidth}
                    fillStyle={fillStyleWithOpacity}
                    interactiveCursorClass="react-financial-charts-move-cursor"
                    onDragStart={this.handleDragStart}
                    onDrag={this.handleChannelDrag}
                    onDragComplete={this.handleDragComplete}
                    onClick={this.handleClick}
                />
                {line1Edge}
                {line2Edge}
                <HoverTextNearMouse show={hoverTextEnabled && hover && !selected} {...restHoverTextProps} />
            </g>
        );
    }

    private readonly getEdgeCircle = ({ xy, dragHandler, cursor, fill, edge }: any) => {
        const { hover } = this.state;
        const { appearance } = this.props;
        const { edgeStroke, edgeStrokeWidth, r } = appearance;
        const { selected } = this.props;
        const { onDragComplete } = this.props;

        return (
            <ClickableCircle
                ref={this.saveNodeType(edge)}
                show={selected || hover}
                cx={xy[0]}
                cy={xy[1]}
                r={r}
                fillStyle={fill}
                strokeStyle={edgeStroke}
                strokeWidth={edgeStrokeWidth}
                interactiveCursorClass={cursor}
                onDragStart={this.handleDragStart}
                onDrag={dragHandler}
                onDragComplete={this.handleDragComplete}
            />
        );
    };

    private readonly handleChannelHeightChange = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag } = this.props;

        const { startXY, endXY } = this.dragStart;

        const {
            chartConfig: { yScale },
        } = moreProps;
        const { startPos, mouseXY } = moreProps;

        const y2 = yScale(endXY[1]);

        const dy = startPos[1] - mouseXY[1];

        const newY2Value = yScale.invert(y2 - dy);

        const newDy = newY2Value - endXY[1] + this.dragStart.dy;

        onDrag(e, index, {
            startXY,
            endXY,
            dy: newDy,
        });
    };

    private readonly handleLine1Edge2Drag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag } = this.props;
        const { endXY } = this.dragStart;

        const {
            startPos,
            mouseXY,
            xAccessor,
            xScale,
            fullData,
            chartConfig: { yScale },
        } = moreProps;

        const dx = startPos[0] - mouseXY[0];
        const dy = startPos[1] - mouseXY[1];

        const x1 = xScale(endXY[0]);
        const y1 = yScale(endXY[1]);

        const newX1Value = getXValue(xScale, xAccessor, [x1 - dx, y1 - dy], fullData);
        const newY1Value = yScale.invert(y1 - dy);

        onDrag(e, index, {
            startXY: this.dragStart.startXY,
            endXY: [newX1Value, newY1Value],
            dy: this.dragStart.dy,
        });
    };

    private readonly handleLine1Edge1Drag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag } = this.props;
        const { startXY } = this.dragStart;

        const {
            startPos,
            mouseXY,
            xAccessor,
            xScale,
            fullData,
            chartConfig: { yScale },
        } = moreProps;

        const dx = startPos[0] - mouseXY[0];
        const dy = startPos[1] - mouseXY[1];

        const x1 = xScale(startXY[0]);
        const y1 = yScale(startXY[1]);

        const newX1Value = getXValue(xScale, xAccessor, [x1 - dx, y1 - dy], fullData);
        const newY1Value = yScale.invert(y1 - dy);

        onDrag(e, index, {
            startXY: [newX1Value, newY1Value],
            endXY: this.dragStart.endXY,
            dy: this.dragStart.dy,
        });
    };

    private readonly handleChannelDrag = (e: React.MouseEvent, moreProps: any) => {
        const { index, onDrag } = this.props;

        const { startXY, endXY } = this.dragStart;

        const {
            xScale,
            chartConfig: { yScale },
            xAccessor,
            fullData,
        } = moreProps;
        const { startPos, mouseXY } = moreProps;

        const x1 = xScale(startXY[0]);
        const y1 = yScale(startXY[1]);
        const x2 = xScale(endXY[0]);
        const y2 = yScale(endXY[1]);

        const dx = startPos[0] - mouseXY[0];
        const dy = startPos[1] - mouseXY[1];

        const newX1Value = getXValue(xScale, xAccessor, [x1 - dx, y1 - dy], fullData);
        const newY1Value = yScale.invert(y1 - dy);
        const newX2Value = getXValue(xScale, xAccessor, [x2 - dx, y2 - dy], fullData);
        const newY2Value = yScale.invert(y2 - dy);

        onDrag(e, index, {
            startXY: [newX1Value, newY1Value],
            endXY: [newX2Value, newY2Value],
            dy: this.dragStart.dy,
        });
    };

    private readonly handleDragStart = () => {
        const { startXY, endXY, dy } = this.props;

        this.dragStart = {
            startXY,
            endXY,
            dy,
        };
    };

    private readonly handleHover = (_: React.MouseEvent, moreProps: any) => {
        if (this.state.hover !== moreProps.hovering) {
            this.setState({
                hover: moreProps.hovering,
            });
        }
    };

    private readonly handleClick = (e: React.MouseEvent, moreProps: any) => {
        const { index, onSelect, startXY, endXY, dy } = this.props;
        
        // Use proper hover detection like TrendLine
        const isActuallyHovered = this.checkIfHovered(moreProps);
        
        console.log('📊 EachEquidistantChannel clicked, index:', index, 'isActuallyHovered:', isActuallyHovered, 'coordinates:', {
            startXY, endXY, dy
        });
        
        // Only process the click if this channel is actually being hovered
        if (onSelect && isActuallyHovered) {
            const selectionData = [{
                index,
                startXY,
                endXY,
                dy,
                selected: true,
            }];
            
            onSelect(e, selectionData, moreProps);
        }
    };

    private readonly checkIfHovered = (moreProps: any) => {
        const { startXY, endXY, dy, index } = this.props;
        const { mouseXY, xScale } = moreProps;
        const {
            chartConfig: { yScale },
        } = moreProps;

        const tolerance = 30; // Channel area tolerance

        // Convert channel coordinates to screen coordinates
        const startScreen = [xScale(startXY[0]), yScale(startXY[1])];
        const endScreen = [xScale(endXY[0]), yScale(endXY[1])];
        
        // Calculate the parallel line offset
        const dyScreen = dy ? yScale(endXY[1] + dy) - yScale(endXY[1]) : 0;
        
        const [mouseX, mouseY] = mouseXY;

        // Check if mouse is inside channel area (simplified rectangular check)
        const minX = Math.min(startScreen[0], endScreen[0]) - tolerance;
        const maxX = Math.max(startScreen[0], endScreen[0]) + tolerance;
        const minY = Math.min(startScreen[1], endScreen[1] + dyScreen) - tolerance;
        const maxY = Math.max(startScreen[1], endScreen[1] + dyScreen) + tolerance;

        if (mouseX >= minX && mouseX <= maxX && mouseY >= minY && mouseY <= maxY) {
            console.log(`📊 EachEquidistantChannel[${index}] hover detected in channel area`);
            return true;
        }

        // Check if mouse is near channel edges
        const edge1Distance = this.distanceToLineSegment([mouseX, mouseY], startScreen, endScreen);
        const edge2Distance = this.distanceToLineSegment([mouseX, mouseY], 
            [startScreen[0], startScreen[1] + dyScreen], 
            [endScreen[0], endScreen[1] + dyScreen]
        );
        
        const minDistance = Math.min(edge1Distance, edge2Distance);
        
        if (minDistance <= tolerance) {
            console.log(`📊 EachEquidistantChannel[${index}] hover detected on edge, distance: ${minDistance}`);
            return true;
        }

        return false;
    };

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
        console.log('🏁 EachEquidistantChannel handleDragComplete called');
        
        const { onDragComplete, onSelect, index, startXY, endXY, dy } = this.props;
        
        // First call onDragComplete to update the position
        if (onDragComplete !== undefined) {
            onDragComplete(e, moreProps);
        }
        
        // Then select this channel after dragging
        if (onSelect !== undefined) {
            console.log('  📊 Selecting channel after drag, index:', index);
            const selectionData = [{
                index,
                startXY,
                endXY,
                dy,
                selected: true,
            }];
            
            // Use a small timeout to ensure drag complete finishes first
            setTimeout(() => {
                onSelect(e, selectionData, moreProps);
            }, 50);
        }
    };

    private readonly convertToRgba = (color: string, opacity: number): string => {
        // Handle hex colors like #9c27b0
        if (color.startsWith('#')) {
            const hex = color.substring(1);
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        
        // Handle rgb colors
        if (color.startsWith('rgb(')) {
            return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
        }
        
        // Handle named colors or other formats - fallback to original
        return color;
    };
}
