# Interactive Chart Features Design Patterns

This document establishes the two core patterns for implementing interactive chart features, eliminating the need to reimplement delete/undo/selection logic for each new feature.

## Overview

Instead of duplicating selection, deletion, and undo logic for every interactive feature, we follow two established patterns:

1. **Simple Line Pattern** - Follow TrendLine implementation
2. **Complex Area Pattern** - Follow TrendChannel implementation

## Pattern 1: Simple Line Objects

**Reference Implementation**: `TrendLine`

### When to Use
- Single straight line with start/end points
- Click detection **on the line only**
- No filled areas or complex shapes
- Basic geometric lines

### Examples
- TrendLine ✅ (reference)
- Support/Resistance lines
- Horizontal/Vertical lines  
- Simple trend rays
- Basic annotations

### Technical Implementation
```typescript
// Component: Uses InteractiveStraightLine
<InteractiveStraightLine
  onClick={this.handleClick}           // Direct line click
  onHover={this.handleHover}          // Simple line hover
  onUnHover={this.handleUnHover}      // Leave hover
  // ... standard line props
/>

// Registration: Use createSimpleLineFeature
interactiveFeaturesManager.registerFeature(createSimpleLineFeature({
  type: 'trendline',
  displayName: 'TrendLines', 
  items: trendLines,
  selectedIndices: selectedTrendLines,
  setItems: setTrendLines,
  setSelectedIndices: setSelectedTrendLines,
  logPrefix: '📈'
}));
```

### Key Characteristics
- ✅ Uses `InteractiveStraightLine` component
- ✅ Click detection: `'line-only'`
- ✅ Simple hover logic (built-in)
- ✅ No custom area detection needed
- ✅ Minimal implementation complexity

## Pattern 2: Complex Area Objects  

**Reference Implementation**: `TrendChannel`

### When to Use
- Multiple lines forming shapes
- Filled areas between lines
- Click detection **anywhere in the area/shape**
- Complex geometric patterns

### Examples  
- TrendChannel ✅ (reference)
- Triangle patterns ✅
- Fibonacci retracements ✅
- Gann fans
- Elliott wave patterns
- Price zones/ranges
- Regression channels

### Technical Implementation
```typescript
// Component: Uses GenericChartComponent with custom logic
<GenericChartComponent
  isHover={this.isHover}              // CUSTOM area hover logic
  onClick={this.handleClick}          // Area-based clicking  
  canvasDraw={this.drawOnCanvas}      // Custom drawing
  // ... area-specific props
/>

// CRITICAL: Custom hover method for area detection
private readonly isHover = (moreProps: any) => {
  // Check line boundaries
  const lineHovering = isHovering({...});
  
  // Check area between lines (KEY DIFFERENCE!)
  const areaHovering = isHoveringOverArea({...});
  
  return lineHovering || areaHovering;
};

// Registration: Use createComplexAreaFeature  
interactiveFeaturesManager.registerFeature(createComplexAreaFeature({
  type: 'trendchannel',
  displayName: 'Trend Channels',
  items: trendChannels, 
  selectedIndices: selectedChannels,
  setItems: setTrendChannels,
  setSelectedIndices: setSelectedChannels,
  logPrefix: '🔶',
  hasAreaFill: true // Channels have filled areas
}));
```

### Key Characteristics
- ✅ Uses `GenericChartComponent` 
- ✅ Click detection: `'area-based'`
- ✅ Custom hover logic (area intersection)
- ✅ Area interaction capabilities
- ✅ Supports filled regions

## Unified Management System

Both patterns integrate with the `InteractiveFeaturesManager` to eliminate code duplication:

### Unified Delete Handler
```typescript
// Replaces ~100 lines of repetitive delete code
const { deletionOccurred, newState } = interactiveFeaturesManager.handleDelete(currentState);
```

### Unified Selection Handler  
```typescript
// Replaces repetitive selection logic for each feature
const selectedIndices = interactiveFeaturesManager.handleSelection(featureType, interactives, currentState);
```

### Unified Completion Handler
```typescript
// Replaces repetitive completion logic for each feature  
interactiveFeaturesManager.handleCompletion(featureType, newItems, currentState, saveToHistory);
```

## Pattern Decision Tree

```
Is it a single straight line?
├─ YES → Use Simple Line Pattern (follow TrendLine)
└─ NO → Do users need to click anywhere in the shape/area?
    ├─ YES → Use Complex Area Pattern (follow TrendChannel)  
    └─ NO → Use Simple Line Pattern (follow TrendLine)
```

## Implementation Checklist

### For Simple Line Objects:
- [ ] Extend or copy from TrendLine implementation
- [ ] Use `InteractiveStraightLine` component
- [ ] Register with `createSimpleLineFeature()`
- [ ] Implement basic click handlers
- [ ] No custom hover logic needed

### For Complex Area Objects:
- [ ] Extend or copy from TrendChannel implementation  
- [ ] Use `GenericChartComponent` with custom `isHover`
- [ ] Register with `createComplexAreaFeature()`
- [ ] Implement area hover detection logic
- [ ] Implement custom drawing logic if needed
- [ ] Support area-based clicking

## Common Anti-Patterns to Avoid

❌ **Don't**: Use `onClickWhenHover` for area-based components  
✅ **Do**: Use `onClick` with proper area detection

❌ **Don't**: Implement custom hover logic for simple lines  
✅ **Do**: Use built-in `InteractiveStraightLine` hover

❌ **Don't**: Use `GenericChartComponent` for simple straight lines  
✅ **Do**: Use `InteractiveStraightLine` for simple lines

❌ **Don't**: Duplicate delete/selection/undo logic  
✅ **Do**: Use `InteractiveFeaturesManager` unified handlers

❌ **Don't**: Implement each feature from scratch  
✅ **Do**: Follow established patterns (TrendLine or TrendChannel)

## Benefits of This Approach

1. **Code Reduction**: Eliminates ~200+ lines of repetitive code per feature
2. **Consistency**: All features behave consistently for select/move/delete
3. **Maintainability**: Fixes and improvements apply to all features  
4. **Testability**: Unified test patterns for all interactive features
5. **Extensibility**: Easy to add new features following established patterns

## Migration Guide

When adding new interactive features:

1. **Identify the pattern**: Simple line or complex area?
2. **Copy reference implementation**: TrendLine or TrendChannel  
3. **Register with manager**: Use appropriate factory function
4. **Customize as needed**: Modify drawing/interaction logic
5. **Test unified behavior**: Selection, deletion, undo should work automatically

This approach ensures consistent behavior across all interactive features while minimizing code duplication and maintenance overhead.