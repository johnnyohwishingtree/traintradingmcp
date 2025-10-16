import * as React from "react";
import { BaseLine, BaseLineProps } from "./BaseLine";
import { EachHorizontalLineTrend } from "./wrapper/EachHorizontalLineTrend";
import { getValueFromOverride } from "./utils";
import { isDefined } from "../core";

export interface HorizontalRayProps extends BaseLineProps {}

export class HorizontalRay extends BaseLine {
    public static defaultProps = {
        ...BaseLine.defaultProps,
        type: "RAY", // Ray extension (infinite in one direction)
        hoverText: {
            ...BaseLine.defaultProps.hoverText,
            text: "Click and drag to place horizontal ray",
        },
    };

    protected getInteractiveType(): string {
        return "horizontalRays";
    }

    // Override to apply horizontal constraint: lock Y-axis, allow X movement only
    protected applyConstraints(startPoint: any, endPoint: any): any {
        if (!startPoint || !endPoint) return endPoint;

        // Keep Y coordinate fixed at startPoint, allow X to change
        return [endPoint[0], startPoint[1]];
    }

    // Override rendering to use EachHorizontalLineTrend wrapper for proper interaction
    protected renderLineItem(line: any, index: number, override: any, appearance: any, hoverText: any): React.ReactNode {
        const y = line.start[1]; // Fixed Y coordinate for horizontal ray
        const x1 = Math.min(line.start[0], line.end[0]);
        const x2 = Math.max(line.start[0], line.end[0]);

        const eachAppearance = isDefined(line.appearance)
            ? { ...appearance, ...line.appearance }
            : appearance;

        const hoverTextWithDefault = {
            ...HorizontalRay.defaultProps.hoverText,
            ...hoverText,
        };

        return (
            <EachHorizontalLineTrend
                key={index}
                ref={this.saveNodeType(index)}
                index={index}
                type="RAY" // Ray type for infinite extension in one direction
                selected={line.selected}
                x1Value={getValueFromOverride(override, index, "x1Value", x1)}
                y1Value={getValueFromOverride(override, index, "y1Value", y)}
                x2Value={getValueFromOverride(override, index, "x2Value", x2)}
                y2Value={getValueFromOverride(override, index, "y2Value", y)} // Force same Y for horizontal
                strokeStyle={eachAppearance.strokeStyle}
                strokeWidth={eachAppearance.strokeWidth}
                strokeOpacity={eachAppearance.strokeOpacity}
                strokeDasharray={eachAppearance.strokeDasharray}
                edgeStroke={eachAppearance.edgeStroke}
                edgeFill={eachAppearance.edgeFill}
                edgeStrokeWidth={eachAppearance.edgeStrokeWidth}
                r={eachAppearance.r}
                hoverText={hoverTextWithDefault}
                onSelect={this.props.onSelect}
                onDrag={this.handleDragLine}
                onDragComplete={this.handleDragLineComplete}
                edgeInteractiveCursor="react-financial-charts-move-cursor"
                lineInteractiveCursor="react-financial-charts-move-cursor"
            />
        );
    }

    // Override handleEnd for single-click ray placement
    protected readonly handleEnd = (e: React.MouseEvent, xyValue: any, moreProps: any) => {
        const { current } = this.state;
        const allLines = this.props.trends || this.props.lines || [];
        const { appearance } = this.props;

        if (current && current.start) {
            // For horizontal rays, complete immediately on first click
            const x = current.start[0]; // X coordinate from click
            const y = current.start[1]; // Fixed Y coordinate

            const newLines = [
                ...allLines.map((d) => ({ ...d, selected: false })),
                {
                    start: [x, y],
                    end: [x + 100, y], // End point to the right for ray direction
                    selected: true,
                    appearance,
                    type: "RAY",
                },
            ];

            this.setState(
                {
                    current: null,
                },
                () => {
                    const { onComplete } = this.props;
                    if (onComplete !== undefined) {
                        onComplete(e, newLines, moreProps);
                    }
                },
            );
        }
    };
}
