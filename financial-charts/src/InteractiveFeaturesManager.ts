// Interactive Features Manager - Unified pattern for all interactive chart features
// This eliminates the need to reimplement delete/undo/selection for each feature

export interface InteractiveFeature<T> {
  // Feature identification
  readonly type: string;
  readonly displayName: string;
  
  // Design pattern classification
  readonly pattern: 'simple-line' | 'complex-area';
  
  // State management
  items: T[];
  selectedIndices: number[];
  
  // State setters (from React hooks)
  setItems: (items: T[]) => void;
  setSelectedIndices: (indices: number[]) => void;
  
  // Feature-specific logic
  findMatchingIndex?: (item: T, interactives: any[]) => number;
  validateItem?: (item: T) => boolean;
  
  // Pattern-specific interaction logic
  interactionConfig: {
    // For simple-line pattern (like TrendLine)
    usesInteractiveStraightLine?: boolean;
    clickDetection: 'line-only' | 'area-based';
    
    // For complex-area pattern (like TrendChannel, Triangle, Fibonacci)
    usesGenericChartComponent?: boolean;
    hasAreaFill?: boolean;
    customHoverLogic?: boolean;
    areaInteraction?: boolean;
  };
  
  // Logging
  logPrefix: string; // e.g., "🔺", "📈", "📏"
}

export interface HistoryState {
  trendLines: any[];
  trendChannels: any[];
  fibonacciRetracements: any[];
  trianglePatterns: any[];
  horizontalLines?: any[];
  horizontalRays?: any[];
  verticalLines?: any[];
}

export interface HoveredComponent {
  type: string;
  index: number;
  bounds: DOMRect;
}

export class InteractiveFeaturesManager {
  private features: Map<string, InteractiveFeature<any>> = new Map();
  private hoveredComponent: HoveredComponent | null = null;

  // Register a feature (called during component initialization)
  registerFeature<T>(feature: InteractiveFeature<T>) {
    this.features.set(feature.type, feature);
  }

  // Unified deletion handler - replaces all the repetitive delete code
  handleDelete(currentState: HistoryState): { deletionOccurred: boolean; newState: HistoryState | null } {
    console.log('🗑️ Unified delete handler - checking all features...');
    
    for (const [featureType, feature] of this.features) {
      // Check if this feature has selected items
      if (Array.isArray(feature.selectedIndices) && feature.selectedIndices.length > 0) {
        console.log(`${feature.logPrefix} DELETING ${feature.displayName}:`, feature.selectedIndices);
        
        // Filter out selected items
        const newItems = feature.items.filter((_, index) => 
          !feature.selectedIndices.includes(index)
        );
        
        console.log(`${feature.logPrefix} OLD count: ${feature.items.length} -> NEW count: ${newItems.length}`);
        
        // Update the feature's state
        feature.setItems(newItems);
        feature.setSelectedIndices([]);
        
        // Build new history state
        const newState = this.buildHistoryState(currentState, featureType, newItems);
        
        return { deletionOccurred: true, newState };
      }
    }
    
    console.log('  No selected items found for deletion');
    return { deletionOccurred: false, newState: null };
  }

  // Unified selection handler - replaces repetitive selection logic
  handleSelection<T>(
    featureType: string, 
    interactives: any[], 
    currentState: HistoryState
  ): number[] {
    const feature = this.features.get(featureType);
    if (!feature) {
      console.warn(`Feature ${featureType} not registered`);
      return [];
    }

    console.log(`${feature.logPrefix} handleSelection called for ${feature.displayName}`);
    console.log('  Interactives received:', interactives);
    
    if (interactives.length === 0) return [];

    const selectedIndices: number[] = [];
    
    for (const interactive of interactives) {
      let matchIndex = -1;
      
      // Use custom matching logic if provided
      if (feature.findMatchingIndex) {
        // Search through current items to find match
        for (let i = 0; i < feature.items.length; i++) {
          matchIndex = feature.findMatchingIndex(feature.items[i], [interactive]);
          if (matchIndex !== -1) {
            selectedIndices.push(i);
            break;
          }
        }
      } else if (typeof interactive.index === 'number') {
        // Use provided index if available
        if (interactive.index < feature.items.length) {
          selectedIndices.push(interactive.index);
        }
      } else {
        // Fallback: use most recent item
        console.log('  No match found, using last index');
        selectedIndices.push(feature.items.length - 1);
      }
    }
    
    console.log(`  Selected indices: [${selectedIndices.join(', ')}]`);
    feature.setSelectedIndices(selectedIndices);
    
    // Automatically deselect other features when selecting this one (single selection mode)
    if (selectedIndices.length > 0) {
      this.handleDeselectOthers(featureType);
    }
    
    return selectedIndices;
  }

  // Unified deselection handler - clears all selections
  handleDeselectAll(): void {
    console.log('🚫 Deselecting all interactive features...');
    
    for (const [featureType, feature] of this.features) {
      if (Array.isArray(feature.selectedIndices) && feature.selectedIndices.length > 0) {
        console.log(`${feature.logPrefix} Deselecting ${feature.displayName} (${feature.selectedIndices.length} items)`);
        feature.setSelectedIndices([]);
      }
    }
  }

  // Deselect all except the specified feature type - for single selection mode
  handleDeselectOthers(keepSelectedFeatureType: string): void {
    console.log(`🎯 Deselecting all except ${keepSelectedFeatureType}...`);
    
    for (const [featureType, feature] of this.features) {
      if (featureType !== keepSelectedFeatureType && 
          Array.isArray(feature.selectedIndices) && 
          feature.selectedIndices.length > 0) {
        console.log(`${feature.logPrefix} Deselecting ${feature.displayName}`);
        feature.setSelectedIndices([]);
      }
    }
  }

  // Get current selections across all features - for debugging
  getCurrentSelections(): Record<string, number[]> {
    const selections: Record<string, number[]> = {};
    
    for (const [featureType, feature] of this.features) {
      if (Array.isArray(feature.selectedIndices) && feature.selectedIndices.length > 0) {
        selections[featureType] = [...feature.selectedIndices];
      }
    }
    
    return selections;
  }

  // Unified completion handler - replaces repetitive completion logic
  handleCompletion<T>(
    featureType: string,
    newItems: T[],
    currentState: HistoryState,
    saveToHistory: (state: HistoryState) => void
  ): number[] {
    const feature = this.features.get(featureType);
    if (!feature) {
      console.warn(`Feature ${featureType} not registered`);
      return [];
    }

    console.log(`${feature.logPrefix} handleCompletion called for ${feature.displayName}`);
    console.log(`  Previous count: ${feature.items.length}`);
    console.log(`  New count: ${newItems.length}`);
    
    // Check which items are marked as selected in the new data
    const selectedIndices: number[] = [];
    newItems.forEach((item: any, index) => {
      if (item.selected === true) {
        selectedIndices.push(index);
      }
    });
    
    // Update feature state
    feature.setItems(newItems);
    
    // Save to history if this was a drawing action (new item added)
    if (newItems.length > feature.items.length) {
      console.log(`  💾 New ${feature.displayName} added - saving to history`);
      const newState = this.buildHistoryState(currentState, featureType, newItems);
      saveToHistory(newState);
    }
    
    // Update selection
    if (selectedIndices.length > 0) {
      console.log(`  🎯 Updating selection to indices: [${selectedIndices.join(', ')}]`);
      feature.setSelectedIndices(selectedIndices);
    }
    
    return selectedIndices;
  }

  /**
   * Get the history state key for a feature type
   * Centralizes the mapping between feature types and history keys
   *
   * ⚠️ WHEN ADDING A NEW FEATURE: Add one line here to enable undo/redo/delete
   */
  private getStateKey(featureType: string): keyof HistoryState | undefined {
    switch (featureType) {
      case 'trendline': return 'trendLines';
      case 'trendchannel': return 'trendChannels';
      case 'fibonacci': return 'fibonacciRetracements';
      case 'triangle': return 'trianglePatterns';
      case 'horizontalline': return 'horizontalLines';
      case 'horizontalray': return 'horizontalRays';
      case 'verticalline': return 'verticalLines';
      default: return undefined;
    }
  }

  // Build history state with updated feature data
  private buildHistoryState(currentState: HistoryState, updatedFeature: string, newItems: any[]): HistoryState {
    // Copy current state
    const newState: HistoryState = {
      trendLines: currentState.trendLines,
      trendChannels: currentState.trendChannels,
      fibonacciRetracements: currentState.fibonacciRetracements,
      trianglePatterns: currentState.trianglePatterns,
      horizontalLines: currentState.horizontalLines || [],
      horizontalRays: currentState.horizontalRays || [],
      verticalLines: currentState.verticalLines || []
    };

    // Update the specific feature's data using centralized mapping
    const stateKey = this.getStateKey(updatedFeature);
    if (stateKey) {
      (newState as any)[stateKey] = newItems;
    } else {
      console.warn(`⚠️ No state key mapping for feature type: ${updatedFeature}`);
    }

    return newState;
  }

  /**
   * Restore all features from a history state
   * This replaces the manual restoration in undo/redo functions
   *
   * ✅ AUTOMATIC: Works for all registered features, no updates needed when adding new features
   */
  restoreFromHistory(historyState: HistoryState): void {
    console.log('⏪ Restoring features from history...');

    for (const [featureType, feature] of this.features) {
      const stateKey = this.getStateKey(featureType);
      if (stateKey && historyState[stateKey]) {
        console.log(`  ${feature.logPrefix} Restoring ${feature.displayName}: ${historyState[stateKey].length} items`);
        feature.setItems(historyState[stateKey]);
        feature.setSelectedIndices([]); // Clear selections when restoring
      }
    }
  }

  /**
   * Generate initial empty history state from registered features
   * This ensures history state always includes all registered features
   *
   * ✅ AUTOMATIC: Works for all registered features, no updates needed when adding new features
   */
  getInitialHistoryState(): HistoryState {
    console.log('🏗️ Generating initial history state from registered features...');

    const initialState: any = {
      labels: [] // Special case for labels (not yet using InteractiveFeaturesManager)
    };

    for (const [featureType, feature] of this.features) {
      const stateKey = this.getStateKey(featureType);
      if (stateKey) {
        initialState[stateKey] = [];
        console.log(`  ${feature.logPrefix} Added ${stateKey}: []`);
      }
    }

    return initialState as HistoryState;
  }

  // Get feature by type
  getFeature(type: string): InteractiveFeature<any> | undefined {
    return this.features.get(type);
  }

  // List all registered features
  getRegisteredFeatures(): string[] {
    return Array.from(this.features.keys());
  }

  // Clear all selections - useful for tool switching
  clearAllSelections() {
    for (const feature of this.features.values()) {
      feature.setSelectedIndices([]);
    }
  }

  // ===== HOVER TRACKING FOR CONTEXTUAL TEXT FEATURE =====

  /**
   * Set the currently hovered component
   * Called by wrapper components when mouse hovers over a selected component
   */
  setHoveredComponent(type: string, index: number, bounds: DOMRect): void {
    this.hoveredComponent = { type, index, bounds };
    console.log(`🎯 Hover set: ${type}[${index}] at`, bounds);
  }

  /**
   * Clear the currently hovered component
   * Called when mouse leaves a component
   */
  clearHoveredComponent(): void {
    if (this.hoveredComponent) {
      console.log(`🎯 Hover cleared: ${this.hoveredComponent.type}[${this.hoveredComponent.index}]`);
    }
    this.hoveredComponent = null;
  }

  /**
   * Get the currently hovered component
   * Used by the contextual text overlay to position itself
   */
  getHoveredComponent(): HoveredComponent | null {
    return this.hoveredComponent;
  }
}

// Factory function to create feature configurations
export function createFeatureConfig<T>(config: {
  type: string;
  displayName: string;
  pattern: 'simple-line' | 'complex-area';
  items: T[];
  selectedIndices: number[];
  setItems: (items: T[]) => void;
  setSelectedIndices: (indices: number[]) => void;
  logPrefix: string;
  interactionConfig: {
    usesInteractiveStraightLine?: boolean;
    clickDetection: 'line-only' | 'area-based';
    usesGenericChartComponent?: boolean;
    hasAreaFill?: boolean;
    customHoverLogic?: boolean;
    areaInteraction?: boolean;
  };
  findMatchingIndex?: (item: T, interactives: any[]) => number;
  validateItem?: (item: T) => boolean;
}): InteractiveFeature<T> {
  return {
    type: config.type,
    displayName: config.displayName,
    pattern: config.pattern,
    items: config.items,
    selectedIndices: config.selectedIndices,
    setItems: config.setItems,
    setSelectedIndices: config.setSelectedIndices,
    logPrefix: config.logPrefix,
    interactionConfig: config.interactionConfig,
    findMatchingIndex: config.findMatchingIndex,
    validateItem: config.validateItem
  };
}

// Helper functions to create common patterns
export function createSimpleLineFeature<T>(config: {
  type: string;
  displayName: string;
  items: T[];
  selectedIndices: number[];
  setItems: (items: T[]) => void;
  setSelectedIndices: (indices: number[]) => void;
  logPrefix: string;
  findMatchingIndex?: (item: T, interactives: any[]) => number;
  validateItem?: (item: T) => boolean;
}): InteractiveFeature<T> {
  return createFeatureConfig({
    ...config,
    pattern: 'simple-line',
    interactionConfig: {
      usesInteractiveStraightLine: true,
      clickDetection: 'line-only',
      usesGenericChartComponent: false,
      hasAreaFill: false,
      customHoverLogic: false,
      areaInteraction: false
    }
  });
}

export function createComplexAreaFeature<T>(config: {
  type: string;
  displayName: string;
  items: T[];
  selectedIndices: number[];
  setItems: (items: T[]) => void;
  setSelectedIndices: (indices: number[]) => void;
  logPrefix: string;
  hasAreaFill?: boolean;
  findMatchingIndex?: (item: T, interactives: any[]) => number;
  validateItem?: (item: T) => boolean;
}): InteractiveFeature<T> {
  return createFeatureConfig({
    ...config,
    pattern: 'complex-area',
    interactionConfig: {
      usesInteractiveStraightLine: false,
      clickDetection: 'area-based',
      usesGenericChartComponent: true,
      hasAreaFill: config.hasAreaFill ?? true,
      customHoverLogic: true,
      areaInteraction: true
    }
  });
}

// Singleton instance for the app
export const interactiveFeaturesManager = new InteractiveFeaturesManager();