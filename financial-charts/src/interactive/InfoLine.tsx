import * as React from "react";
import { TrendLine, TrendLineProps } from "./TrendLine";
import { InteractiveStraightLine } from "./components";
import { isDefined } from "../core";

export interface InfoLineProps extends TrendLineProps {}

// InfoLine extends TrendLine but adds info display when selected
export class InfoLine extends TrendLine {
    public static defaultProps = {
        ...TrendLine.defaultProps,
        type: "LINE", // Finite line between two points
        hoverText: {
            ...TrendLine.defaultProps.hoverText,
            text: "Click and drag to draw info line with price/date details",
        },
    };

    protected getInteractiveType(): string {
        return "infoLines";
    }

    // Calculate line information for display
    private getLineInfo(line: any): {
        distance: number;
        priceChange: number;
        percentChange: number;
        startPrice: number;
        endPrice: number;
    } {
        const [x1, y1] = line.start;
        const [x2, y2] = line.end;
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const priceChange = y2 - y1;
        const percentChange = y1 !== 0 ? (priceChange / y1) * 100 : 0;
        
        return {
            distance,
            priceChange,
            percentChange,
            startPrice: y1,
            endPrice: y2
        };
    }

    // Override the main render to add info overlay to selected lines
    public render(): React.ReactElement {
        const baseRender = super.render();
        const { trends = [] } = this.props;
        
        // Add info overlays for selected trend lines
        const infoOverlays = trends
            .filter(line => line.selected)
            .map((line, index) => this.renderInfoOverlay(line, index));

        return (
            <g>
                {baseRender}
                {infoOverlays}
            </g>
        );
    }

    // Render info overlay for selected lines
    private renderInfoOverlay(line: any, index: number): React.ReactNode {
        const lineInfo = this.getLineInfo(line);
        const midX = (line.start[0] + line.end[0]) / 2;
        const midY = (line.start[1] + line.end[1]) / 2;
        const { appearance } = this.props;
        
        return (
            <g key={`info-overlay-${index}`}>
                {/* Info background */}
                <rect
                    x={midX - 80}
                    y={midY - 50}
                    width={160}
                    height={80}
                    fill="rgba(0, 0, 0, 0.9)"
                    stroke={appearance?.strokeStyle || "#607d8b"}
                    strokeWidth={1}
                    rx={5}
                />
                
                {/* Title */}
                <text
                    x={midX}
                    y={midY - 30}
                    fill="white"
                    fontSize={12}
                    textAnchor="middle"
                    fontWeight="bold"
                >
                    📊 Price Analysis
                </text>
                
                {/* Price change info */}
                <text
                    x={midX}
                    y={midY - 10}
                    fill="white"
                    fontSize={11}
                    textAnchor="middle"
                >
                    Change: {lineInfo.priceChange > 0 ? '+' : ''}{lineInfo.priceChange.toFixed(2)}
                </text>
                
                {/* Percentage change */}
                <text
                    x={midX}
                    y={midY + 5}
                    fill={lineInfo.percentChange >= 0 ? '#4CAF50' : '#F44336'}
                    fontSize={11}
                    textAnchor="middle"
                    fontWeight="bold"
                >
                    {lineInfo.percentChange > 0 ? '+' : ''}{lineInfo.percentChange.toFixed(2)}%
                </text>
                
                {/* Start and end prices */}
                <text
                    x={midX}
                    y={midY + 20}
                    fill="#ccc"
                    fontSize={9}
                    textAnchor="middle"
                >
                    {lineInfo.startPrice.toFixed(2)} → {lineInfo.endPrice.toFixed(2)}
                </text>
                
                {/* Distance info */}
                <text
                    x={midX}
                    y={midY + 35}
                    fill="#999"
                    fontSize={9}
                    textAnchor="middle"
                >
                    Distance: {lineInfo.distance.toFixed(1)}
                </text>
            </g>
        );
    }
}