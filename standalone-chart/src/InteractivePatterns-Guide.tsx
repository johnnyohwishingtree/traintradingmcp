// Guide for implementing interactive chart features following the correct patterns
// This shows how to properly categorize and implement each type of feature

import React from 'react';
import { 
  interactiveFeaturesManager, 
  createSimpleLineFeature,
  createComplexAreaFeature
} from './InteractiveFeaturesManager';

export default function InteractivePatternsGuide() {
  // Example state management
  const [trendLines, setTrendLines] = React.useState<any[]>([]);
  const [selectedTrendLines, setSelectedTrendLines] = React.useState<number[]>([]);
  const [trianglePatterns, setTrianglePatterns] = React.useState<any[]>([]);
  const [selectedTriangles, setSelectedTriangles] = React.useState<number[]>([]);
  const [fibonacciRetracements, setFibonacciRetracements] = React.useState<any[]>([]);
  const [selectedFibs, setSelectedFibs] = React.useState<number[]>([]);
  const [trendChannels, setTrendChannels] = React.useState<any[]>([]);
  const [selectedChannels, setSelectedChannels] = React.useState<number[]>([]);

  // Register features following the correct patterns
  React.useEffect(() => {
    // PATTERN 1: Simple Line Objects (follow TrendLine)
    // =====================================================
    
    // TrendLine - The reference implementation for simple lines
    interactiveFeaturesManager.registerFeature(createSimpleLineFeature({
      type: 'trendline',
      displayName: 'TrendLines',
      items: trendLines,
      selectedIndices: selectedTrendLines,
      setItems: setTrendLines,
      setSelectedIndices: setSelectedTrendLines,
      logPrefix: '📈',
      findMatchingIndex: (item: any, interactives: any[]) => {
        const interactive = interactives[0];
        return (item.start?.[0] === interactive.start?.[0] && 
                item.start?.[1] === interactive.start?.[1] &&
                item.end?.[0] === interactive.end?.[0] && 
                item.end?.[1] === interactive.end?.[1]) ? 0 : -1;
      }
    }));

    // Other simple line objects should follow the same pattern:
    // - Support/Resistance lines
    // - Simple annotations
    // - Horizontal/Vertical lines
    // - Basic trend rays

    // PATTERN 2: Complex Area Objects (follow TrendChannel)
    // ====================================================
    
    // TrendChannel - The reference implementation for area-based features
    interactiveFeaturesManager.registerFeature(createComplexAreaFeature({
      type: 'trendchannel',
      displayName: 'Trend Channels',
      items: trendChannels,
      selectedIndices: selectedChannels,
      setItems: setTrendChannels,
      setSelectedIndices: setSelectedChannels,
      logPrefix: '🔶',
      hasAreaFill: true // Channels have filled areas between parallel lines
    }));

    // Triangle - Complex area with multiple lines forming enclosed shape
    interactiveFeaturesManager.registerFeature(createComplexAreaFeature({
      type: 'triangle',
      displayName: 'Triangle Patterns',
      items: trianglePatterns,
      selectedIndices: selectedTriangles,
      setItems: setTrianglePatterns,
      setSelectedIndices: setSelectedTriangles,
      logPrefix: '🔺',
      hasAreaFill: true // Triangles can have filled areas
    }));

    // Fibonacci - Multiple horizontal lines spanning an area
    interactiveFeaturesManager.registerFeature(createComplexAreaFeature({
      type: 'fibonacci',
      displayName: 'Fibonacci Retracements',
      items: fibonacciRetracements,
      selectedIndices: selectedFibs,
      setItems: setFibonacciRetracements,
      setSelectedIndices: setSelectedFibs,
      logPrefix: '📏',
      hasAreaFill: false // Fibonacci typically doesn't fill areas, just multiple lines
    }));

    // Other complex area objects should follow TrendChannel pattern:
    // - Gann Fan (multiple lines radiating from a point)
    // - Elliott Wave patterns (multiple connected segments)
    // - Price ranges/zones (filled rectangles)
    // - Regression channels (parallel lines with area)
    // - Fan lines (multiple lines from single point)

  }, []); // Only register once

  return null; // This is just a guide component
}

// IMPLEMENTATION GUIDELINES
// =========================

/*

WHEN TO USE SIMPLE LINE PATTERN (follow TrendLine):
- Single straight line
- Start and end points only
- Click detection on the line itself
- Uses InteractiveStraightLine component
- Examples: TrendLine, Support/Resistance, Simple rays

Component Structure:
```typescript
<InteractiveStraightLine
  onClick={this.handleClick}           // Direct click on line
  onHover={this.handleHover}          // Hover detection on line
  onUnHover={this.handleUnHover}      // Leave hover
  // ... line-specific props
/>
```

WHEN TO USE COMPLEX AREA PATTERN (follow TrendChannel):
- Multiple lines OR filled areas
- Complex shapes (triangles, channels, fans)
- Click detection anywhere within the area/shape
- Uses GenericChartComponent with custom hover logic
- Examples: TrendChannel, Triangle, Fibonacci, Gann Fan

Component Structure:
```typescript
<GenericChartComponent
  isHover={this.isHover}              // CUSTOM area hover logic
  onClick={this.handleClick}          // Area-based clicking
  canvasDraw={this.drawOnCanvas}      // Custom drawing logic
  // ... area-specific props
/>

// CRITICAL: Custom hover method for area detection
private readonly isHover = (moreProps: any) => {
  // Check line boundaries
  const lineHovering = isHovering({...});
  
  // Check area between lines (KEY DIFFERENCE!)
  const areaHovering = isHoveringOverArea({...});
  
  // Check filled regions
  const fillHovering = isHoveringOverFill({...});
  
  return lineHovering || areaHovering || fillHovering;
};
```

PATTERN DECISION FLOWCHART:
1. Is it a single straight line? → Use Simple Line Pattern
2. Does it have multiple lines or filled areas? → Use Complex Area Pattern
3. Do you want users to click anywhere in the shape/area? → Use Complex Area Pattern
4. Do you only want clicks on the actual line? → Use Simple Line Pattern

COMMON MISTAKES TO AVOID:
❌ Using onClickWhenHover for area-based components
❌ Implementing custom hover logic for simple lines
❌ Using GenericChartComponent for simple straight lines
❌ Using InteractiveStraightLine for complex shapes
❌ Not implementing area hover detection for complex objects

✅ Follow TrendLine pattern for lines
✅ Follow TrendChannel pattern for areas
✅ Use appropriate hover detection for each pattern
✅ Implement click detection that matches user expectations

*/