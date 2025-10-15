import * as React from "react";
import { BaseLine, BaseLineProps } from "./BaseLine";
import { EachTrendLine } from "./wrapper/EachTrendLine";
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

    // Override to apply horizontal constraint: lock Y-axis, ray goes horizontally
    protected applyConstraints(startPoint: any, endPoint: any): any {
        if (!startPoint || !endPoint) return endPoint;
        
        // Keep Y coordinate fixed at startPoint, allow X to change for direction
        return [endPoint[0], startPoint[1]];
    }

    // Override rendering to show horizontal ray with price label
    protected renderLineItem(line: any, index: number, override: any, appearance: any, hoverText: any): React.ReactNode {
        const y1Value = line.start[1]; // Fixed Y coordinate
        const y2Value = line.start[1]; // Force same Y for horizontal ray
        const x1Value = line.start[0];
        const x2Value = line.end[0];
        
        const eachAppearance = isDefined(line.appearance)
            ? { ...appearance, ...line.appearance }
            : appearance;

        const hoverTextWithDefault = {
            ...HorizontalRay.defaultProps.hoverText,
            ...hoverText,
        };
        
        return (
            <g key={index}>
                <EachTrendLine
                    ref={this.saveNodeType(index)}
                    index={index}
                    type="RAY" // Ray type for infinite extension
                    x1Value={x1Value}
                    y1Value={y1Value}
                    x2Value={x2Value}
                    y2Value={y2Value} // Same as y1Value for horizontal
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
                    onDragComplete={this.handleDragLineComplete}
                    selected={line.selected}
                    edgeInteractiveCursor="react-financial-charts-move-cursor"
                    lineInteractiveCursor="react-financial-charts-move-cursor"
                />
                
                {/* Price label at the start point */}
                {line.selected && (
                    <g>
                        <rect
                            x={x1Value - 30}
                            y={y1Value - 15}
                            width={60}
                            height={20}
                            fill={eachAppearance.strokeStyle}
                            opacity={0.9}
                            rx={3}
                        />
                        <text
                            x={x1Value}
                            y={y1Value}
                            fill="white"
                            fontSize={11}
                            textAnchor="middle"
                            dy={4}
                        >
                            {y1Value.toFixed(2)}
                        </text>
                    </g>
                )}
            </g>
        );
    }
}