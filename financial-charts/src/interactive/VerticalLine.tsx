import * as React from "react";
import { BaseLine, BaseLineProps } from "./BaseLine";
import { InteractiveStraightLine } from "./components";

export interface VerticalLineProps extends BaseLineProps {}

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
        if (!startPoint || !endPoint) return endPoint;
        
        // Keep X coordinate fixed at startPoint, allow Y to change
        return [startPoint[0], endPoint[1]];
    }

    // Override rendering to show vertical line with single control point for Y-axis movement
    protected renderLineItem(line: any, index: number, override: any, appearance: any, hoverText: any): React.ReactNode {
        const x = line.start[0]; // Fixed X coordinate
        const y1 = Math.min(line.start[1], line.end[1]);
        const y2 = Math.max(line.start[1], line.end[1]);
        const midY = (y1 + y2) / 2;
        
        return (
            <g key={index}>
                <InteractiveStraightLine
                    type={line.type || "XLINE"}
                    x1Value={x}
                    y1Value={y1}
                    x2Value={x} // Same X for vertical line
                    y2Value={y2}
                    strokeStyle={appearance.strokeStyle}
                    strokeWidth={appearance.strokeWidth}
                    strokeDasharray={appearance.strokeDasharray}
                />
                {/* Single control point for Y-axis movement */}
                {line.selected && (
                    <circle
                        cx={x}
                        cy={midY}
                        r={appearance.r}
                        fill={appearance.edgeFill}
                        stroke={appearance.edgeStroke}
                        strokeWidth={appearance.edgeStrokeWidth}
                        style={{ cursor: "ns-resize" }} // Vertical resize cursor
                    />
                )}
            </g>
        );
    }

    // Override handleEnd for single-click infinite line placement
    protected readonly handleEnd = (e: React.MouseEvent, xyValue: any, moreProps: any) => {
        const { current } = this.state;
        const { lines, appearance } = this.props;

        if (current && current.start) {
            // For vertical infinite lines, complete immediately on first click
            const x = current.start[0]; // Fixed X coordinate
            const y = current.start[1]; // Y coordinate from click
            
            const newLines = [
                ...lines.map((d) => ({ ...d, selected: false })),
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
                    lines: newLines,
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