import * as React from "react";
import { BaseLine, BaseLineProps } from "./BaseLine";
import { EachVerticalLineTrend } from "./wrapper/EachVerticalLineTrend";
import { getValueFromOverride } from "./utils";
import { isDefined } from "../core";

export type VerticalLineProps = BaseLineProps;

export class VerticalLine extends BaseLine {
    public static defaultProps = {
        ...BaseLine.defaultProps,
        type: "XLINE", // Infinite extension
        hoverText: {
            ...BaseLine.defaultProps.hoverText,
            text: "Click to place vertical line",
        },
    };

    protected getInteractiveType(): string {
        return "verticalLines";
    }

    // Override to apply vertical constraint: lock X-axis, allow Y movement only
    protected applyConstraints(startPoint: any, endPoint: any): any {
        if (!startPoint || !endPoint) {
            return endPoint;
        }

        // Keep X coordinate fixed at startPoint, allow Y to change
        return [startPoint[0], endPoint[1]];
    }

    // Override rendering to use EachVerticalLineTrend wrapper for proper interaction
    protected renderLineItem(
        line: any,
        index: number,
        override: any,
        appearance: any,
        hoverText: any,
    ): React.ReactNode {
        const x = line.start[0]; // Fixed X coordinate for vertical line
        const y1 = Math.min(line.start[1], line.end[1]);
        const y2 = Math.max(line.start[1], line.end[1]);

        const eachAppearance = isDefined(line.appearance) ? { ...appearance, ...line.appearance } : appearance;

        const hoverTextWithDefault = {
            ...VerticalLine.defaultProps.hoverText,
            ...hoverText,
        };

        return (
            <EachVerticalLineTrend
                key={index}
                ref={this.saveNodeType(index)}
                index={index}
                type={line.type || "XLINE"}
                selected={line.selected}
                x1Value={getValueFromOverride(override, index, "x1Value", x)}
                y1Value={getValueFromOverride(override, index, "y1Value", y1)}
                x2Value={getValueFromOverride(override, index, "x2Value", x)} // Force same X for vertical
                y2Value={getValueFromOverride(override, index, "y2Value", y2)}
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

    // Override handleEnd for single-click infinite line placement
    protected readonly handleEnd = (e: React.MouseEvent, xyValue: any, moreProps: any) => {
        const { current } = this.state;
        const allLines = this.props.trends || this.props.lines || [];
        const { appearance } = this.props;

        if (current && current.start) {
            // For vertical infinite lines, complete immediately on first click
            const x = current.start[0]; // Fixed X coordinate
            const y = current.start[1]; // Y coordinate from click

            const newLines = [
                ...allLines.map((d) => ({ ...d, selected: false })),
                {
                    start: [x, y],
                    end: [x, y + 1], // Minimal end point for vertical infinite line
                    selected: true,
                    appearance,
                    type: "XLINE",
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
