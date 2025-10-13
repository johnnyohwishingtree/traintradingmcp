import * as React from "react";

/**
 * Standard interface for all interactive indicators/patterns
 * This ensures consistency across TrendLine, TrianglePattern, FibonacciRetracement, etc.
 */
export interface InteractiveIndicatorProps {
    /** Enable/disable the interactive functionality */
    readonly enabled: boolean;
    
    /** Array of indicator data (trendlines, triangles, etc.) */
    readonly indicators: any[];
    
    /** Array of selected indicator indices */
    readonly selectedIndicators?: number[];
    
    /** Callback when drawing starts */
    readonly onStart?: (moreProps: any) => void;
    
    /** Callback when drawing is completed - receives updated indicators array */
    readonly onComplete?: (e: React.MouseEvent, newIndicators: any[], moreProps: any) => void;
    
    /** Callback when indicator is selected - receives selection data */
    readonly onSelect?: (e: React.MouseEvent, interactives: any[], moreProps: any) => void;
    
    /** Visual appearance configuration */
    readonly appearance?: {
        readonly strokeStyle: string;
        readonly strokeWidth: number;
        readonly fillStyle?: string;
        readonly fillOpacity?: number;
        readonly edgeStroke?: string;
        readonly edgeFill?: string;
        readonly edgeStrokeWidth?: number;
        readonly r?: number; // radius for control points
    };
    
    /** Current position indicator styling (during drawing) */
    readonly currentPositionStroke?: string;
    readonly currentPositionStrokeWidth?: number;
    readonly currentPositionOpacity?: number;
    readonly currentPositionRadius?: number;
    
    /** Hover text configuration */
    readonly hoverText?: {
        readonly enable: boolean;
        readonly text: string;
        readonly selectedText: string;
        readonly bgFill: string;
        readonly bgOpacity: number;
        readonly bgWidth: number | string;
        readonly bgHeight: number | string;
    };
}

/**
 * Standard interface for individual indicator wrappers (EachTrendLine, EachTrianglePattern, etc.)
 */
export interface EachIndicatorProps {
    /** Index in the indicators array */
    readonly index: number;
    
    /** Whether this indicator is currently selected */
    readonly selected: boolean;
    
    /** Callback when indicator is selected */
    readonly onSelect?: (e: React.MouseEvent, interactives: any[], moreProps: any) => void;
    
    /** Callback during drag operations */
    readonly onDrag?: (e: React.MouseEvent, index: number | undefined, newValues: any) => void;
    
    /** Callback when drag operation completes */
    readonly onDragComplete?: (e: React.MouseEvent, moreProps: any) => void;
    
    /** Visual appearance */
    readonly strokeStyle: string;
    readonly strokeWidth: number;
    readonly fillStyle?: string;
    readonly fillOpacity?: number;
    readonly edgeStroke: string;
    readonly edgeFill: string;
    readonly edgeStrokeWidth: number;
    readonly r: number;
    
    /** Hover text configuration */
    readonly hoverText: any;
}

/**
 * Selection data structure used by onSelect callbacks
 */
export interface SelectionData {
    /** Index of the selected indicator */
    readonly index: number;
    
    /** Type of indicator: 'trendline' | 'triangle' | 'fibonacci' | etc. */
    readonly type: string;
    
    /** Whether indicator is selected */
    readonly selected: boolean;
    
    /** Indicator-specific coordinate data */
    readonly [key: string]: any;
}

/**
 * Standard coordinate system interfaces
 */
export interface ChartCoordinates {
    /** X value in chart data coordinates */
    readonly x: number;
    
    /** Y value in chart data coordinates */
    readonly y: number;
}

export interface ScreenCoordinates {
    /** X position in screen pixels */
    readonly x: number;
    
    /** Y position in screen pixels */
    readonly y: number;
}

/**
 * Interactive capabilities that all indicators should support
 */
export interface InteractiveCapabilities {
    /** Can be selected by clicking */
    selectable: boolean;
    
    /** Can be moved by dragging */
    movable: boolean;
    
    /** Can be deleted with Delete key */
    deletable: boolean;
    
    /** Shows hover feedback */
    hoverable: boolean;
    
    /** Has visual selection state */
    visualSelection: boolean;
}