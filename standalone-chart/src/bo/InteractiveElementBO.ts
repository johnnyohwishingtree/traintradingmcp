/**
 * Business Object representing any interactive chart element
 * Unified structure for both MCP-created and user-drawn elements
 */

export type InteractiveElementType =
    | 'trendline'
    | 'horizontalLine'
    | 'verticalLine'
    | 'fibonacci'
    | 'triangle'
    | 'channel'
    | 'label'
    | 'ray'
    | 'extendedLine'
    | 'text';

export type ElementSource = 'user' | 'mcp';

export interface InteractiveElementBO {
    // Identity
    readonly id: string;
    readonly source: ElementSource;
    readonly type: InteractiveElementType;

    // State
    selected: boolean;

    // Data (type-specific structure)
    data: {
        // Common line elements (trendline, horizontal, vertical, ray, extended)
        start?: [number, number];
        end?: [number, number];
        type?: 'LINE' | 'RAY' | 'XLINE' | 'HORIZONTAL' | 'VERTICAL';

        // Fibonacci elements
        retracements?: number[];

        // Triangle elements
        points?: [number, number][];

        // Channel elements
        startXY?: [number, number];
        endXY?: [number, number];
        dy?: number;

        // Label/Text elements
        text?: string;
        position?: [number, number];
        bgFill?: string;
        bgOpacity?: number;
        bgStrokeWidth?: number;
        bgStroke?: string;
        textFill?: string;
        fontFamily?: string;
        fontSize?: number;
        fontWeight?: string | number;
        fontStyle?: string;

        // Allow additional properties
        [key: string]: any;
    };

    // Visual appearance
    appearance: {
        // Line styling
        strokeStyle?: string;
        strokeWidth?: number;
        strokeDasharray?: string;
        strokeOpacity?: number;

        // Fill styling (for areas/backgrounds)
        fillStyle?: string;
        fillOpacity?: number;

        // Edge/control point styling
        edgeStroke?: string;
        edgeFill?: string;
        edgeFill2?: string;
        edgeStrokeWidth?: number;
        r?: number; // Control point radius

        // Additional edge styling
        nsEdgeFill?: string;

        // Text styling (for labels)
        fontFamily?: string;
        fontSize?: number;
        fontFill?: string;

        // Channel specific
        stroke?: string;

        // Allow additional properties
        [key: string]: any;
    };

    // Metadata
    metadata?: {
        createdAt: Date;
        modifiedAt: Date;
        createdBy?: string;
        notes?: string;
        [key: string]: any;
    };
}

/**
 * Type guard to check if an object is an InteractiveElementBO
 */
export function isInteractiveElementBO(obj: any): obj is InteractiveElementBO {
    return (
        obj &&
        typeof obj === 'object' &&
        typeof obj.id === 'string' &&
        (obj.source === 'user' || obj.source === 'mcp') &&
        typeof obj.type === 'string' &&
        typeof obj.selected === 'boolean' &&
        obj.data &&
        typeof obj.data === 'object' &&
        obj.appearance &&
        typeof obj.appearance === 'object'
    );
}

/**
 * Create a default InteractiveElementBO with minimal required fields
 */
export function createDefaultInteractiveElementBO(
    type: InteractiveElementType,
    source: ElementSource
): InteractiveElementBO {
    return {
        id: `${source}_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        source,
        type,
        selected: false,
        data: {},
        appearance: {},
        metadata: {
            createdAt: new Date(),
            modifiedAt: new Date(),
            createdBy: source
        }
    };
}
