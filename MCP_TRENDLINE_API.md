# MCP TrendLine Integration API

This document describes the Model Context Protocol (MCP) integration for the TrendLine component in the financial-charts library.

## Overview

The enhanced TrendLine component now supports MCP integration while maintaining 100% backward compatibility with existing usage. When MCP handlers are provided, the component emits MCP events for create, select, modify, and delete operations.

## Enhanced TrendLine Interface

### New Types

```typescript
export interface MCPElement {
    readonly id: string;           // Unique identifier for the element
    readonly type: string;         // Element type (e.g., 'trendline')
    readonly data: any;           // Element-specific data
    readonly appearance?: any;     // Optional appearance overrides
    readonly selected?: boolean;   // Selection state
}
```

### Enhanced TrendLineProps

The TrendLine component now accepts these additional optional props:

```typescript
interface TrendLineProps {
    // ... existing props remain unchanged ...
    
    // MCP Integration Props (all optional)
    readonly onMCPCreate?: (elementType: string, elementData: any, appearance: any) => void;
    readonly onMCPSelect?: (elementId: string) => void;
    readonly onMCPModify?: (elementId: string, newData: any) => void;
    readonly onMCPDelete?: (elementId: string) => void;
    readonly mcpElements?: MCPElement[]; // MCP-managed elements to display
}
```

## MCP Event Handlers

### onMCPCreate

Called when a new trendline is completed by the user.

**Signature:**
```typescript
onMCPCreate: (elementType: string, elementData: any, appearance: any) => void
```

**Parameters:**
- `elementType`: Always 'trendline' for TrendLine component
- `elementData`: Object containing:
  - `id`: Generated unique identifier
  - `start`: [x, y] coordinates of start point
  - `end`: [x, y] coordinates of end point
- `appearance`: The appearance settings used for the line

**Example:**
```typescript
const handleMCPCreate = (elementType, elementData, appearance) => {
    console.log('New trendline created:', {
        id: elementData.id,
        start: elementData.start,
        end: elementData.end,
        color: appearance.strokeStyle
    });
    
    // Store in MCP system
    mcpSystem.createElement(elementType, elementData, appearance);
};
```

### onMCPSelect

Called when a trendline is selected (clicked or otherwise activated).

**Signature:**
```typescript
onMCPSelect: (elementId: string) => void
```

**Example:**
```typescript
const handleMCPSelect = (elementId) => {
    console.log('Trendline selected:', elementId);
    // Update selection state in MCP system
    mcpSystem.selectElement(elementId);
};
```

### onMCPModify

Called when a trendline is moved or resized through drag operations.

**Signature:**
```typescript
onMCPModify: (elementId: string, newData: any) => void
```

**Parameters:**
- `elementId`: ID of the modified element
- `newData`: Object containing updated properties:
  - `start`: New [x, y] start coordinates
  - `end`: New [x, y] end coordinates

**Example:**
```typescript
const handleMCPModify = (elementId, newData) => {
    console.log('Trendline modified:', {
        id: elementId,
        newStart: newData.start,
        newEnd: newData.end
    });
    
    // Update in MCP system
    mcpSystem.updateElement(elementId, newData);
};
```

### onMCPDelete

Called when a trendline is deleted (typically via Delete key).

**Signature:**
```typescript
onMCPDelete: (elementId: string) => void
```

**Example:**
```typescript
const handleMCPDelete = (elementId) => {
    console.log('Trendline deleted:', elementId);
    // Remove from MCP system
    mcpSystem.deleteElement(elementId);
};
```

## MCP Elements Display

### mcpElements Prop

Pass an array of MCPElement objects to display MCP-managed trendlines alongside regular ones.

**Example:**
```typescript
const mcpElements: MCPElement[] = [
    {
        id: 'mcp_trendline_001',
        type: 'trendline',
        data: {
            start: [100, 200],
            end: [300, 150]
        },
        appearance: {
            strokeStyle: '#ff9800',
            strokeWidth: 2
        },
        selected: false
    }
];

<TrendLine
    mcpElements={mcpElements}
    onMCPCreate={handleMCPCreate}
    onMCPSelect={handleMCPSelect}
    onMCPModify={handleMCPModify}
    onMCPDelete={handleMCPDelete}
    // ... other props
/>
```

## Usage Patterns

### Dual Mode Operation

The component can operate in dual mode, handling both regular trends and MCP elements:

```typescript
<TrendLine
    // Regular financial-charts props
    enabled={true}
    trends={regularTrends}
    onComplete={handleRegularComplete}
    
    // MCP integration props  
    mcpElements={mcpElements}
    onMCPCreate={handleMCPCreate}
    onMCPModify={handleMCPModify}
    
    // Shared props
    appearance={{
        strokeStyle: '#2196f3',
        strokeWidth: 2,
        strokeDasharray: 'Solid'
    }}
/>
```

### MCP-Only Mode

For pure MCP usage, omit regular trend handlers:

```typescript
<TrendLine
    enabled={true}
    trends={[]} // Empty regular trends
    mcpElements={mcpElements}
    onMCPCreate={handleMCPCreate}
    onMCPSelect={handleMCPSelect}
    onMCPModify={handleMCPModify}
    onMCPDelete={handleMCPDelete}
    appearance={{
        strokeStyle: '#ff9800',
        strokeWidth: 2
    }}
/>
```

## Integration Example

Complete working example with state management:

```typescript
import React, { useState } from 'react';
import { TrendLine, MCPElement } from '@slowclap/financial-charts';

const MCPTrendLineExample = () => {
    const [mcpElements, setMcpElements] = useState<MCPElement[]>([]);
    
    const handleMCPCreate = (elementType: string, elementData: any, appearance: any) => {
        const newElement: MCPElement = {
            id: elementData.id,
            type: elementType,
            data: elementData,
            appearance: appearance,
            selected: false
        };
        
        setMcpElements(prev => [...prev, newElement]);
    };
    
    const handleMCPSelect = (elementId: string) => {
        setMcpElements(prev => prev.map(el => ({
            ...el,
            selected: el.id === elementId
        })));
    };
    
    const handleMCPModify = (elementId: string, newData: any) => {
        setMcpElements(prev => prev.map(el => 
            el.id === elementId 
                ? { ...el, data: { ...el.data, ...newData } }
                : el
        ));
    };
    
    const handleMCPDelete = (elementId: string) => {
        setMcpElements(prev => prev.filter(el => el.id !== elementId));
    };
    
    return (
        <TrendLine
            enabled={true}
            trends={[]}
            mcpElements={mcpElements}
            onMCPCreate={handleMCPCreate}
            onMCPSelect={handleMCPSelect}
            onMCPModify={handleMCPModify}
            onMCPDelete={handleMCPDelete}
            appearance={{
                strokeStyle: '#ff9800',
                strokeWidth: 2,
                strokeDasharray: 'Solid',
                edgeStrokeWidth: 2,
                edgeFill: '#ff9800',
                edgeStroke: '#ff9800'
            }}
        />
    );
};
```

## Migration Guide

### From Regular TrendLine to MCP

1. **Add MCP handlers**: Implement the four MCP event handlers
2. **Manage MCP elements**: Use state to track MCPElement array
3. **Optional**: Keep existing regular trend handlers for compatibility

### Backward Compatibility

- All existing TrendLine usage continues to work unchanged
- MCP features are purely additive
- No breaking changes to existing API

## Testing

The integration includes a demo mode accessible at:
```
http://localhost:3000/?demo=mcp
```

This demo allows testing both regular and MCP modes side-by-side with visual feedback for all MCP events.

## Architecture Benefits

1. **Non-intrusive**: Existing code continues to work unchanged
2. **Progressive Enhancement**: Add MCP features incrementally
3. **Unified Rendering**: MCP elements use the same native rendering pipeline
4. **Event Consistency**: All user interactions emit appropriate MCP events
5. **Coordinate Accuracy**: Leverages financial-charts' proven coordinate system

## Implementation Details

- MCP elements are converted to internal trend format for unified rendering
- Element IDs are automatically generated using timestamp + random suffix
- MCP elements are marked with `isMCPElement: true` for identification
- Drag operations check element origin before emitting MCP events
- Console logging provides detailed debugging information

This integration maintains the robust architecture of financial-charts while adding powerful MCP capabilities for advanced chart interaction systems.