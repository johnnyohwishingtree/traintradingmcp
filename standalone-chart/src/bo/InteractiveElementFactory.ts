/**
 * Factory to create InteractiveElementBO from different sources
 * Normalizes MCP format and user format into unified BO structure
 */

import {
    InteractiveElementBO,
    InteractiveElementType,
    ElementSource,
    createDefaultInteractiveElementBO
} from './InteractiveElementBO';

/**
 * MCP Element format (from external MCP server)
 */
export interface MCPElement {
    id: string;
    type: string;
    data: any;
    appearance: any;
    selected?: boolean;
}

export class InteractiveElementFactory {

    /**
     * Create BO from user drawing action
     */
    public static fromUserAction(
        type: InteractiveElementType,
        userData: any,
        appearance: any
    ): InteractiveElementBO {
        const bo = createDefaultInteractiveElementBO(type, 'user');

        return {
            ...bo,
            data: { ...userData },
            appearance: { ...appearance },
            metadata: {
                ...bo.metadata,
                createdBy: 'user'
            }
        };
    }

    /**
     * Create BO from MCP action (AI/programmatic)
     */
    public static fromMCPAction(mcpElement: MCPElement): InteractiveElementBO {
        const normalizedType = this.normalizeMCPType(mcpElement.type);
        const bo = createDefaultInteractiveElementBO(normalizedType, 'mcp');

        return {
            ...bo,
            id: mcpElement.id, // Use MCP's ID
            selected: mcpElement.selected || false,
            data: { ...mcpElement.data },
            appearance: { ...mcpElement.appearance },
            metadata: {
                ...bo.metadata,
                createdBy: 'mcp',
                mcpOriginalType: mcpElement.type
            }
        };
    }

    /**
     * Convert BO to TrendLine component props format
     */
    public static toTrendLineProps(bo: InteractiveElementBO, index: number): any {
        if (!bo.data.start || !bo.data.end) {
            console.warn('TrendLine BO missing start/end data:', bo);
            return null;
        }

        return {
            index,
            selected: bo.selected,
            start: bo.data.start,  // [x, y] format
            end: bo.data.end,      // [x, y] format
            type: bo.data.type || 'LINE',
            strokeStyle: bo.appearance.strokeStyle || '#2196f3',
            strokeWidth: bo.appearance.strokeWidth || 2,
            strokeDasharray: bo.appearance.strokeDasharray || 'Solid',
            edgeStroke: bo.appearance.edgeStroke || '#2196f3',
            edgeFill: bo.appearance.edgeFill || '#ffffff',
            edgeStrokeWidth: bo.appearance.edgeStrokeWidth || 2,
            r: bo.appearance.r || 6
        };
    }

    /**
     * Convert BO to Fibonacci component props format
     */
    public static toFibonacciProps(bo: InteractiveElementBO, index: number): any {
        if (!bo.data.start || !bo.data.end) {
            console.warn('Fibonacci BO missing start/end data:', bo);
            return null;
        }

        return {
            index,
            selected: bo.selected,
            x1: bo.data.start[0],
            y1: bo.data.start[1],
            x2: bo.data.end[0],
            y2: bo.data.end[1],
            type: bo.data.type || 'BOUND',
            strokeStyle: bo.appearance.strokeStyle || '#ff9800',
            strokeWidth: bo.appearance.strokeWidth || 2,
            fontFamily: bo.appearance.fontFamily || '-apple-system, system-ui, Roboto',
            fontSize: bo.appearance.fontSize || 11,
            fontFill: bo.appearance.fontFill || '#ff9800',
            edgeStroke: bo.appearance.edgeStroke || '#ff9800',
            edgeFill: bo.appearance.edgeFill || '#ffffff',
            nsEdgeFill: bo.appearance.nsEdgeFill || '#ff9800',
            edgeStrokeWidth: bo.appearance.edgeStrokeWidth || 1,
            r: bo.appearance.r || 5
        };
    }

    /**
     * Convert BO to Triangle component props format
     */
    public static toTriangleProps(bo: InteractiveElementBO, index: number): any {
        if (!bo.data.points || bo.data.points.length !== 3) {
            console.warn('Triangle BO missing or invalid points data:', bo);
            return null;
        }

        return {
            index,
            selected: bo.selected,
            points: bo.data.points,
            strokeStyle: bo.appearance.strokeStyle || '#9c27b0',
            strokeWidth: bo.appearance.strokeWidth || 2,
            fillStyle: bo.appearance.fillStyle || '#9c27b0',
            fillOpacity: bo.appearance.fillOpacity || 0.1,
            edgeStroke: bo.appearance.edgeStroke || '#9c27b0',
            edgeFill: bo.appearance.edgeFill || '#ffffff',
            edgeStrokeWidth: bo.appearance.edgeStrokeWidth || 1,
            r: bo.appearance.r || 6
        };
    }

    /**
     * Convert BO to Channel component props format
     */
    public static toChannelProps(bo: InteractiveElementBO, index: number): any {
        if (!bo.data.startXY || !bo.data.endXY || bo.data.dy === undefined) {
            console.warn('Channel BO missing required data:', bo);
            return null;
        }

        return {
            index,
            selected: bo.selected,
            startXY: bo.data.startXY,
            endXY: bo.data.endXY,
            dy: bo.data.dy,
            stroke: bo.appearance.stroke || bo.appearance.strokeStyle || '#00bcd4',
            strokeOpacity: bo.appearance.strokeOpacity || 1,
            strokeWidth: bo.appearance.strokeWidth || 2,
            fill: bo.appearance.fill || bo.appearance.fillStyle || '#00bcd4',
            fillOpacity: bo.appearance.fillOpacity || 0.2,
            edgeStroke: bo.appearance.edgeStroke || '#00bcd4',
            edgeFill: bo.appearance.edgeFill || '#ffffff',
            edgeFill2: bo.appearance.edgeFill2 || '#00bcd4',
            edgeStrokeWidth: bo.appearance.edgeStrokeWidth || 1,
            r: bo.appearance.r || 5
        };
    }

    /**
     * Convert BO to HorizontalLine component props format
     */
    public static toHorizontalLineProps(bo: InteractiveElementBO, index: number): any {
        if (!bo.data.start || !bo.data.end) {
            console.warn('HorizontalLine BO missing start/end data:', bo);
            return null;
        }

        return {
            index,
            selected: bo.selected,
            x1Value: bo.data.start[0],
            y1Value: bo.data.start[1],
            x2Value: bo.data.end[0],
            y2Value: bo.data.end[1],
            type: bo.data.type || 'HORIZONTAL',
            strokeStyle: bo.appearance.strokeStyle || '#2196f3',
            strokeWidth: bo.appearance.strokeWidth || 2,
            edgeStroke: bo.appearance.edgeStroke || '#2196f3',
            edgeFill: bo.appearance.edgeFill || '#ffffff',
            edgeStrokeWidth: bo.appearance.edgeStrokeWidth || 2,
            r: bo.appearance.r || 6
        };
    }

    /**
     * Convert BO to VerticalLine component props format
     */
    public static toVerticalLineProps(bo: InteractiveElementBO, index: number): any {
        if (!bo.data.start || !bo.data.end) {
            console.warn('VerticalLine BO missing start/end data:', bo);
            return null;
        }

        return {
            index,
            selected: bo.selected,
            x1Value: bo.data.start[0],
            y1Value: bo.data.start[1],
            x2Value: bo.data.end[0],
            y2Value: bo.data.end[1],
            type: bo.data.type || 'VERTICAL',
            strokeStyle: bo.appearance.strokeStyle || '#2196f3',
            strokeWidth: bo.appearance.strokeWidth || 2,
            edgeStroke: bo.appearance.edgeStroke || '#2196f3',
            edgeFill: bo.appearance.edgeFill || '#ffffff',
            edgeStrokeWidth: bo.appearance.edgeStrokeWidth || 2,
            r: bo.appearance.r || 6
        };
    }

    /**
     * Convert BO to InteractiveText (label) component props format
     */
    public static toInteractiveTextProps(bo: InteractiveElementBO, index: number): any {
        if (!bo.data.position || !bo.data.text) {
            console.warn('InteractiveText BO missing position/text data:', bo);
            return null;
        }

        return {
            index,
            selected: bo.selected,
            position: bo.data.position,
            text: bo.data.text,
            bgFill: bo.data.bgFill || bo.appearance.fillStyle || '#1e222d',
            bgOpacity: bo.data.bgOpacity || 0.9,
            bgStrokeWidth: bo.data.bgStrokeWidth || 1,
            bgStroke: bo.data.bgStroke || bo.appearance.strokeStyle || '#2196f3',
            textFill: bo.data.textFill || bo.appearance.fontFill || '#ffffff',
            fontFamily: bo.data.fontFamily || bo.appearance.fontFamily || '-apple-system, system-ui',
            fontSize: bo.data.fontSize || bo.appearance.fontSize || 12,
            fontWeight: bo.data.fontWeight || 'normal',
            fontStyle: bo.data.fontStyle || 'normal',
            r: bo.appearance.r || 6
        };
    }

    /**
     * Convert component data back to BO format (for updates)
     */
    public static updateBOFromComponentData(
        bo: InteractiveElementBO,
        componentData: any
    ): InteractiveElementBO {
        return {
            ...bo,
            data: {
                ...bo.data,
                ...componentData
            },
            metadata: {
                ...bo.metadata,
                modifiedAt: new Date()
            }
        };
    }

    /**
     * Normalize MCP type names to internal type names
     */
    private static normalizeMCPType(mcpType: string): InteractiveElementType {
        const typeMap: Record<string, InteractiveElementType> = {
            'trendline': 'trendline',
            'fibonacci': 'fibonacci',
            'triangle': 'triangle',
            'channel': 'channel',
            'label': 'label',
            'text': 'text',
            'horizontal': 'horizontalLine',
            'horizontalline': 'horizontalLine',
            'vertical': 'verticalLine',
            'verticalline': 'verticalLine',
            'ray': 'ray',
            'xline': 'extendedLine',
            'extendedline': 'extendedLine'
        };

        const normalized = typeMap[mcpType.toLowerCase()];

        if (!normalized) {
            console.warn(`Unknown MCP type "${mcpType}", defaulting to trendline`);
            return 'trendline';
        }

        return normalized;
    }

    /**
     * Group BOs by type for easier rendering
     */
    public static groupByType(elements: InteractiveElementBO[]): Record<InteractiveElementType, InteractiveElementBO[]> {
        const grouped: Record<string, InteractiveElementBO[]> = {};

        for (const element of elements) {
            if (!grouped[element.type]) {
                grouped[element.type] = [];
            }
            grouped[element.type].push(element);
        }

        return grouped as Record<InteractiveElementType, InteractiveElementBO[]>;
    }
}
