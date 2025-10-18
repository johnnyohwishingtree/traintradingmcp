import * as React from "react";
import { isDefined, noop } from "../../core";
import { ClickableCircle, HoverTextNearMouse, TriangleWithArea } from "../components";
import { getNewXY } from "./EachTrendLine";
import { InteractiveBo } from "./InteractiveBo";
import { interactiveFeaturesManager } from "../../InteractiveFeaturesManager";

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

        // Use InteractiveBo utility for control point visibility
        const showControlPoints = InteractiveBo.shouldShowControlPoints(this);

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
                {showControlPoints && (
                    <>
                        <ClickableCircle
                            show={true}
                            cx={point1[0]}
                            cy={point1[1]}
                            r={r}
                            fillStyle={anchor === "point1" ? strokeStyle : edgeFill}
                            strokeStyle={edgeStroke}
                            strokeWidth={edgeStrokeWidth}
                            onDragStart={InteractiveBo.createAnchorDragStartHandler(this, "point1")}
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
                            onDragStart={InteractiveBo.createAnchorDragStartHandler(this, "point2")}
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
                            onDragStart={InteractiveBo.createAnchorDragStartHandler(this, "point3")}
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

    // ✅ REFACTORED: Use InteractiveBo.handleHover
    private readonly handleHover = (e: React.MouseEvent, moreProps: any) => {
        InteractiveBo.handleHover(this, moreProps);

        // Report hover to features manager if selected (for contextual text overlay)
        const { selected, index, point1, point2, point3 } = this.props;
        if (selected && moreProps.hovering && typeof index === 'number') {
            const { xScale, chartConfig: { yScale } } = moreProps;

            // Calculate screen positions for all three points
            const p1 = [xScale(point1[0]), yScale(point1[1])];
            const p2 = [xScale(point2[0]), yScale(point2[1])];
            const p3 = [xScale(point3[0]), yScale(point3[1])];

            // Calculate bounding box
            const left = Math.min(p1[0], p2[0], p3[0]);
            const top = Math.min(p1[1], p2[1], p3[1]);
            const right = Math.max(p1[0], p2[0], p3[0]);
            const bottom = Math.max(p1[1], p2[1], p3[1]);

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

            interactiveFeaturesManager.setHoveredComponent('triangle', index, bounds);
        } else if (!moreProps.hovering) {
            interactiveFeaturesManager.clearHoveredComponent();
        }
    };

    // ✅ REFACTORED: Use InteractiveBo.handleClick
    private readonly handleTriangleClick = (e: React.MouseEvent, moreProps: any) => {
        InteractiveBo.handleClick(this, e, moreProps, this.checkIfHovered, this.getSelectionData);
    };

    // ✅ NEW: Extracted selection data logic for reuse
    private readonly getSelectionData = (): any[] => {
        const { index, point1, point2, point3 } = this.props;

        return [
            {
                index,
                point1,
                point2,
                point3,
                selected: true,
            },
        ];
    };

    // ✅ REFACTORED: Use InteractiveBo.isHoveringTriangle
    private readonly checkIfHovered = (moreProps: any) => {
        const { point1, point2, point3 } = this.props;

        return InteractiveBo.isHoveringTriangle(moreProps, [point1, point2, point3] as [number, number][], 20);
    };

    // ✅ REFACTORED: Use InteractiveBo.handleDragComplete
    private readonly handleDragComplete = (e: React.MouseEvent, moreProps: any) => {
        console.log("🏁 EachTrianglePattern handleDragComplete called");

        // Clear anchor state
        this.setState({ anchor: undefined });

        InteractiveBo.handleDragComplete(this, e, moreProps, this.getSelectionData);
    };

    // Triangle area drag - move entire triangle
    private readonly handleTriangleDragStart = () => {
        // No specific setup needed - TriangleWithArea handles the logic
    };

    private readonly handleTriangleDrag = (e: React.MouseEvent, newTriangleData: any) => {
        const { index, onDrag } = this.props;

        console.log("🔄 EachTrianglePattern.handleTriangleDrag called:", {
            index,
            hasOnDrag: !!onDrag,
            newTriangleData,
        });

        if (onDrag) {
            // TriangleWithArea passes the new triangle coordinates directly
            onDrag(e, index, newTriangleData);
        }
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
