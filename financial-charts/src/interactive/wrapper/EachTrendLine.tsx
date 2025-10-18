import * as React from "react";
import { ascending as d3Ascending } from "d3-array";
import { noop, strokeDashTypes, GenericChartComponent, getMouseCanvas } from "../../core";
import { getXValue } from "../../core/utils/ChartDataUtil";
import { isHover, saveNodeType } from "../utils";
import { AddTextButton, ClickableCircle, HoverTextNearMouse, InlineTextEditor, InteractiveStraightLine, isHovering } from "../components";
import { InteractiveBo } from "./InteractiveBo";
import { interactiveFeaturesManager } from "../../InteractiveFeaturesManager";

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
    readonly text?: string; // Optional text label attached to this trendline
    readonly onDrag: (e: React.MouseEvent, index: number | undefined, moreProps: any) => void;
    readonly onEdge1Drag: any; // func
    readonly onEdge2Drag: any; // func
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    readonly onSelect: (e: React.MouseEvent, interactives: any[], moreProps: any) => void;
    readonly onAddTextClick?: (e: React.MouseEvent, index: number | undefined) => void;
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
    editing?: boolean; // Local editing state - true when inline editor is shown
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
    private hoverClearTimeout: any = null;

    public constructor(props: EachTrendLineProps) {
        super(props);

        this.isHover = isHover.bind(this);
        this.saveNodeType = saveNodeType.bind(this);

        this.state = {
            hover: false,
            editing: false,
        };
    }

    public componentWillUnmount() {
        // Clean up timeout on unmount
        if (this.hoverClearTimeout) {
            clearTimeout(this.hoverClearTimeout);
        }
    }

    public render() {
        const {
            x1Value,
            y1Value,
            x2Value,
            y2Value,
            type,
            text,
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

        const { hover, anchor, editing } = this.state;

        // Use InteractiveBo utility for control point visibility
        const showControlPoints = InteractiveBo.shouldShowControlPoints(this);

        // Calculate midpoint for text label
        const midX = (x1Value + x2Value) / 2;
        const midY = (y1Value + y2Value) / 2;

        // Debug: Log button visibility conditions
        console.log('🔍 AddTextButton visibility:', {
            showControlPoints,
            selected,
            hover,
            text,
            editing,
            shouldShow: showControlPoints && !text
        });

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
                    show={showControlPoints}
                    cx={x1Value}
                    cy={y1Value}
                    r={r}
                    fillStyle={edgeFill}
                    strokeStyle={anchor === "edge1" ? strokeStyle : edgeStroke}
                    strokeWidth={edgeStrokeWidth}
                    interactiveCursorClass={edgeInteractiveCursor}
                    onDragStart={InteractiveBo.createAnchorDragStartHandler(this, "edge2")}
                    onDrag={this.handleEdge1Drag}
                    onDragComplete={this.handleDragComplete}
                />
                <ClickableCircle
                    ref={this.saveNodeType("edge2")}
                    show={showControlPoints}
                    cx={x2Value}
                    cy={y2Value}
                    r={r}
                    fillStyle={edgeFill}
                    strokeStyle={anchor === "edge2" ? strokeStyle : edgeStroke}
                    strokeWidth={edgeStrokeWidth}
                    interactiveCursorClass={edgeInteractiveCursor}
                    onDragStart={InteractiveBo.createAnchorDragStartHandler(this, "edge1")}
                    onDrag={this.handleEdge2Drag}
                    onDragComplete={this.handleDragComplete}
                />
                {/* Text label - appears at midpoint when text exists (hidden when editing) */}
                {text && !editing && (
                    <GenericChartComponent
                        selected
                        isHover={this.isHoverText}
                        onClick={this.handleTextClick}
                        svgDraw={({ xScale, chartConfig: { yScale } }: any) => {
                            const x = xScale(midX);
                            const y = yScale(midY);

                            // Use EXACT same positioning as AddTextButton
                            const offsetY = -40;
                            const buttonY = y + offsetY;

                            return (
                                <text
                                    x={x}
                                    y={buttonY + 16}
                                    fill={selected ? '#22c55e' : '#888'}
                                    fontSize="14px"
                                    fontWeight="600"
                                    fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    style={{ cursor: 'pointer' }}
                                >
                                    {text}
                                </text>
                            );
                        }}
                        drawOn={["pan"]}
                    />
                )}
                {/* Inline text editor - appears when editing */}
                <InlineTextEditor
                    show={editing || false}
                    cx={midX}
                    cy={midY}
                    value={text || ''}
                    onSave={this.handleInlineTextSave}
                    onCancel={this.handleInlineTextCancel}
                />
                {/* Add text button - appears at midpoint when control points visible (no text exists yet and not editing) */}
                <AddTextButton
                    show={showControlPoints && !text && !editing}
                    cx={midX}
                    cy={midY}
                    onClick={this.handleAddTextClick}
                />
                <HoverTextNearMouse
                    show={hoverTextEnabled && hover}
                    {...restHoverTextProps}
                    text={selected ? hoverTextSelected : hoverTextUnselected}
                />
            </g>
        );
    }

    // ✅ REFACTORED: Use InteractiveBo.handleHover with button grace period
    private readonly handleHover = (_: React.MouseEvent, moreProps: any) => {
        const { selected } = this.props;

        // Check if mouse is over the button area (same logic as AddTextButton.isHover)
        const isOverButton = selected ? this.isMouseOverButton(moreProps) : false;

        // Check if hovering over the trendline itself
        const isHoveringLine = this.checkIfHovered(moreProps);

        // Clear any pending hover clear timeout
        if (this.hoverClearTimeout) {
            clearTimeout(this.hoverClearTimeout);
            this.hoverClearTimeout = null;
        }

        // If mouse is over button or line, maintain hover state
        if (isOverButton || isHoveringLine) {
            if (this.state.hover !== true) {
                this.setState({ hover: true });
            }
        } else {
            // Add a grace period before clearing hover state
            // This gives users time to move from the line to the button
            this.hoverClearTimeout = setTimeout(() => {
                // Double-check after grace period - only clear if still not hovering
                const stillHovering = this.checkIfHovered(moreProps);
                const stillOverButton = selected ? this.isMouseOverButton(moreProps) : false;

                if (!stillHovering && !stillOverButton) {
                    this.setState({ hover: false });
                }
                this.hoverClearTimeout = null;
            }, 300); // 300ms grace period for mouse movement
        }

        // Report hover to features manager if selected (for contextual text overlay)
        const { index } = this.props;
        if (selected && (isHoveringLine || isOverButton) && typeof index === 'number') {
            const { xScale, chartConfig: { yScale } } = moreProps;
            const { x1Value, y1Value, x2Value, y2Value } = this.props;

            // Calculate screen bounds from the line's coordinates
            const x1 = xScale(x1Value);
            const y1 = yScale(y1Value);
            const x2 = xScale(x2Value);
            const y2 = yScale(y2Value);

            // Create a DOMRect-like object for the line
            const left = Math.min(x1, x2);
            const top = Math.min(y1, y2);
            const right = Math.max(x1, x2);
            const bottom = Math.max(y1, y2);

            const bounds = {
                left,
                top,
                right,
                bottom,
                width: right - left,
                height: bottom - top,
                x: left,
                y: top,
            } as DOMRect;

            interactiveFeaturesManager.setHoveredComponent('trendline', index, bounds);
        } else if (!isHoveringLine && !isOverButton) {
            interactiveFeaturesManager.clearHoveredComponent();
        }
    };

    // ✅ REFACTORED: Use InteractiveBo.handleClick with AddTextButton detection
    private readonly handleClick = (e: React.MouseEvent, moreProps: any) => {
        const target = e.target as HTMLElement;
        console.log('🎯 EachTrendLine handleClick called', {
            eventType: e.type,
            target: target?.tagName,
            className: target?.className
        });

        // First check if the click is on the AddTextButton area
        if (this.isMouseOverButton(moreProps)) {
            console.log('🎯 Click detected on AddTextButton area - redirecting to button handler');
            this.handleAddTextClick(e, moreProps);
            e.stopPropagation(); // Prevent chart area deselection
            return; // Don't process as trendline click
        }
        
        // Otherwise, handle as normal trendline click
        InteractiveBo.handleClick(this, e, moreProps, this.checkIfHovered, this.getSelectionData);
        
        // Stop propagation to prevent chart area deselection
        e.stopPropagation();
    };

    // ✅ NEW: Extracted selection data logic for reuse
    private readonly getSelectionData = (): any[] => {
        const { index, x1Value, y1Value, x2Value, y2Value, type } = this.props;

        return [
            {
                index,
                start: [x1Value, y1Value],
                end: [x2Value, y2Value],
                x1Value,
                y1Value,
                x2Value,
                y2Value,
                selected: true,
                type,
            },
        ];
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

    // ✅ REFACTORED: Use InteractiveBo.handleDragComplete
    private readonly handleDragComplete = (e: React.MouseEvent, moreProps: any) => {
        console.log("🏁 EachTrendLine handleDragComplete called");

        InteractiveBo.handleDragComplete(this, e, moreProps, this.getSelectionData);
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

    // ✅ REFACTORED: Use InteractiveBo.isHoveringLine
    private readonly checkIfHovered = (moreProps: any) => {
        const { x1Value, y1Value, x2Value, y2Value } = this.props;

        return InteractiveBo.isHoveringLine(moreProps, [x1Value, y1Value], [x2Value, y2Value], 50);
    };

    private readonly handleAddTextClick = (e: React.MouseEvent, moreProps: any) => {
        const { onAddTextClick, index } = this.props;

        console.log('📝 EachTrendLine handleAddTextClick called', {
            hasOnAddTextClick: !!onAddTextClick,
            index,
            eventType: e.type
        });

        // If onAddTextClick exists, call it to let App.tsx set default text
        if (onAddTextClick) {
            console.log('📝 Add text button clicked for trendline', index);
            e.stopPropagation(); // Prevent event bubbling
            onAddTextClick(e, index);
        }

        // Show the inline editor
        this.setState({ editing: true });
    };

    // Helper method to check if mouse is over the AddTextButton area
    // This uses the same logic as AddTextButton.isHover to keep label visible
    private readonly isMouseOverButton = (moreProps: any): boolean => {
        const { x1Value, y1Value, x2Value, y2Value } = this.props;
        const { mouseXY, xScale, chartConfig: { yScale } } = moreProps;

        // Label is positioned at midpoint of trendline
        const cx = (x1Value + x2Value) / 2;
        const cy = (y1Value + y2Value) / 2;

        // Convert data coordinates to screen coordinates
        const x = xScale(cx);
        const y = yScale(cy);

        // Text label dimensions (from AddTextButton.tsx)
        const textWidth = 70; // Approximate width of "+ Add text"
        const textHeight = 20;
        const offsetY = -40;

        const textX = x - textWidth / 2;
        const textY = y + offsetY;

        const [mx, my] = mouseXY;

        const isOverButton = (
            textX < mx && mx < textX + textWidth &&
            textY < my && my < textY + textHeight
        );

        console.log('🎯 Label click detection:', {
            textBounds: { x: textX, y: textY, width: textWidth, height: textHeight },
            mouseXY: [mx, my],
            isOverButton
        });

        return isOverButton;
    };

    // Helper method to check if mouse is over the text label area
    private readonly isHoverText = (moreProps: any): boolean => {
        const { x1Value, y1Value, x2Value, y2Value, text } = this.props;

        if (!text) {
            return false;
        }

        const { mouseXY, xScale, chartConfig: { yScale } } = moreProps;

        // Text is positioned using EXACT same logic as AddTextButton
        const midX = (x1Value + x2Value) / 2;
        const midY = (y1Value + y2Value) / 2;

        const x = xScale(midX);
        const y = yScale(midY);

        // Match AddTextButton positioning
        const offsetY = -40;
        const buttonY = y + offsetY;
        const textY = buttonY + 16;

        // Create a more generous hit area around the text
        const textWidth = Math.max(text.length * 10, 60); // More generous width
        const textHeight = 30; // More generous height

        const [mx, my] = mouseXY;

        const isOverText = (
            x - textWidth / 2 < mx && mx < x + textWidth / 2 &&
            textY - textHeight / 2 < my && my < textY + textHeight / 2
        );

        console.log('📝 Text hover detection:', {
            text,
            textBounds: { x: x - textWidth / 2, y: textY - textHeight / 2, width: textWidth, height: textHeight },
            mouseXY: [mx, my],
            isOverText
        });

        return isOverText;
    };

    // Handle clicking on text label to edit it
    private readonly handleTextClick = (e: React.MouseEvent, moreProps: any) => {
        console.log('📝 EachTrendLine handleTextClick called - opening editor');

        e.stopPropagation(); // Prevent event bubbling and chart area deselection

        // Show the inline editor
        this.setState({ editing: true });
    };

    // Draw text label on canvas at midpoint of trendline
    private readonly drawTextOnCanvas = (ctx: CanvasRenderingContext2D, moreProps: any) => {
        const { text, selected, x1Value, y1Value, x2Value, y2Value } = this.props;
        const { xScale, chartConfig: { yScale } } = moreProps;

        if (!text) {
            return;
        }

        // Calculate midpoint in screen coordinates
        const midX = (x1Value + x2Value) / 2;
        const midY = (y1Value + y2Value) / 2;
        const x = xScale(midX);
        const y = yScale(midY);

        // Draw text label
        ctx.fillStyle = selected ? '#22c55e' : '#888';
        ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y - 50);
    };

    // Handle inline text editor save
    private readonly handleInlineTextSave = (text: string) => {
        const { onAddTextClick, index } = this.props;
        console.log('💾 Saving inline text:', { text, index });

        // Close the editor
        this.setState({ editing: false });

        // If text is empty, we could clear the text field
        // But for now, we'll just update it through the onAddTextClick handler
        // which App.tsx will use to update the trendline state
        if (onAddTextClick && text.trim()) {
            // Create a fake event with the text attached
            const fakeEvent = new MouseEvent('click') as any;
            fakeEvent.newText = text.trim();
            onAddTextClick(fakeEvent, index);
        }
    };

    // Handle inline text editor cancel
    private readonly handleInlineTextCancel = () => {
        console.log('❌ Canceling inline text edit');

        // Just close the editor without saving
        this.setState({ editing: false });
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
