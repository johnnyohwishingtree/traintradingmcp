// This is an example of how App.tsx would look after refactoring with the unified pattern
// This eliminates ~200+ lines of repetitive code

import React from 'react';
import { 
  interactiveFeaturesManager, 
  createFeatureConfig, 
  HistoryState 
} from './InteractiveFeaturesManager';

export default function App() {
  // All the existing state hooks...
  const [trendLines, setTrendLines] = React.useState<any[]>([]);
  const [selectedTrendLines, setSelectedTrendLines] = React.useState<number[]>([]);
  const [trianglePatterns, setTrianglePatterns] = React.useState<any[]>([]);
  const [selectedTriangles, setSelectedTriangles] = React.useState<number[]>([]);
  const [fibonacciRetracements, setFibonacciRetracements] = React.useState<any[]>([]);
  const [selectedFibs, setSelectedFibs] = React.useState<number[]>([]);
  const [trendChannels, setTrendChannels] = React.useState<any[]>([]);
  const [selectedChannels, setSelectedChannels] = React.useState<number[]>([]);
  
  // Register all interactive features once during component initialization
  React.useEffect(() => {
    // Register TrendLine feature
    interactiveFeaturesManager.registerFeature(createFeatureConfig({
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

    // Register Triangle feature
    interactiveFeaturesManager.registerFeature(createFeatureConfig({
      type: 'triangle',
      displayName: 'Triangles',
      items: trianglePatterns,
      selectedIndices: selectedTriangles,
      setItems: setTrianglePatterns,
      setSelectedIndices: setSelectedTriangles,
      logPrefix: '🔺'
    }));

    // Register Fibonacci feature
    interactiveFeaturesManager.registerFeature(createFeatureConfig({
      type: 'fibonacci',
      displayName: 'Fibonacci Retracements',
      items: fibonacciRetracements,
      selectedIndices: selectedFibs,
      setItems: setFibonacciRetracements,
      setSelectedIndices: setSelectedFibs,
      logPrefix: '📏'
    }));

    // Register TrendChannel feature
    interactiveFeaturesManager.registerFeature(createFeatureConfig({
      type: 'trendchannel',
      displayName: 'Trend Channels',
      items: trendChannels,
      selectedIndices: selectedChannels,
      setItems: setTrendChannels,
      setSelectedIndices: setSelectedChannels,
      logPrefix: '🔶'
    }));
  }, []); // Only run once

  // Update feature state when React state changes
  React.useEffect(() => {
    const trendLineFeature = interactiveFeaturesManager.getFeature('trendline');
    if (trendLineFeature) {
      trendLineFeature.items = trendLines;
      trendLineFeature.selectedIndices = selectedTrendLines;
    }
  }, [trendLines, selectedTrendLines]);

  React.useEffect(() => {
    const triangleFeature = interactiveFeaturesManager.getFeature('triangle');
    if (triangleFeature) {
      triangleFeature.items = trianglePatterns;
      triangleFeature.selectedIndices = selectedTriangles;
    }
  }, [trianglePatterns, selectedTriangles]);

  React.useEffect(() => {
    const fibFeature = interactiveFeaturesManager.getFeature('fibonacci');
    if (fibFeature) {
      fibFeature.items = fibonacciRetracements;
      fibFeature.selectedIndices = selectedFibs;
    }
  }, [fibonacciRetracements, selectedFibs]);

  React.useEffect(() => {
    const channelFeature = interactiveFeaturesManager.getFeature('trendchannel');
    if (channelFeature) {
      channelFeature.items = trendChannels;
      channelFeature.selectedIndices = selectedChannels;
    }
  }, [trendChannels, selectedChannels]);

  // UNIFIED HANDLERS - Replace all the repetitive handler functions

  // Replaces: handleTrendLineComplete, handleTriangleComplete, handleFibComplete, handleChannelComplete
  const handleFeatureCompletion = (featureType: string, newItems: any[]) => {
    const currentState: HistoryState = {
      trendLines,
      trendChannels,
      fibonacciRetracements,
      trianglePatterns
    };
    
    return interactiveFeaturesManager.handleCompletion(
      featureType,
      newItems,
      currentState,
      saveToHistory
    );
  };

  // Replaces: handleTrendLineSelect, handleTriangleSelect, handleFibSelect, handleChannelSelect
  const handleFeatureSelection = (featureType: string, interactives: any[]) => {
    const currentState: HistoryState = {
      trendLines,
      trendChannels,
      fibonacciRetracements,
      trianglePatterns
    };
    
    const selectedIndices = interactiveFeaturesManager.handleSelection(
      featureType,
      interactives,
      currentState
    );

    // Set lastSelectedObject if we have a selection
    if (selectedIndices.length > 0) {
      setLastSelectedObject({ 
        type: featureType, 
        index: selectedIndices[0] 
      });
    }
    
    return selectedIndices;
  };

  // MASSIVELY SIMPLIFIED DELETE HANDLER
  // This replaces ~100 lines of repetitive delete code
  const handleKeyDown = (e: KeyboardEvent) => {
    const currentState = stateRef.current;
    
    // Defensive check - ensure currentState exists and has required arrays
    if (!currentState || 
        !Array.isArray(currentState.trendLines) ||
        !Array.isArray(currentState.fibonacciRetracements) ||
        !Array.isArray(currentState.trianglePatterns) ||
        !Array.isArray(currentState.trendChannels)) {
      console.log('⚠️ handleKeyDown: currentState or arrays not ready, skipping');
      return;
    }
    
    // Handle Cmd+Z (undo) and Cmd+Shift+Z (redo)
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }
    
    // UNIFIED DELETE HANDLING - replaces all the repetitive delete code
    if (e.key === 'Delete' || e.key === 'Backspace') {
      console.log('🗑️ Delete key pressed - checking all features...');
      console.log('  Current selections:', interactiveFeaturesManager.getCurrentSelections());
      
      const { deletionOccurred, newState } = interactiveFeaturesManager.handleDelete(currentState);
      
      if (deletionOccurred && newState) {
        console.log('  💾 Deletion occurred - saving to history');
        setLastSelectedObject(null);
        saveToHistory(newState);
      } else {
        console.log('  No items selected for deletion');
      }
    }
  };

  // SIMPLIFIED COMPLETION HANDLERS
  const handleTrendLineComplete = (newTrendLines: any[]) => {
    handleFeatureCompletion('trendline', newTrendLines);
  };

  const handleTriangleComplete = (newTriangles: any[]) => {
    handleFeatureCompletion('triangle', newTriangles);
  };

  const handleFibComplete = (newFibs: any[]) => {
    handleFeatureCompletion('fibonacci', newFibs);
  };

  const handleChannelComplete = (newChannels: any[]) => {
    handleFeatureCompletion('trendchannel', newChannels);
  };

  // SIMPLIFIED SELECTION HANDLERS
  const handleTrendLineSelect = (e: React.MouseEvent, interactives: any[], moreProps: any) => {
    handleFeatureSelection('trendline', interactives);
  };

  const handleTriangleSelect = (e: React.MouseEvent, interactives: any[], moreProps: any) => {
    handleFeatureSelection('triangle', interactives);
  };

  const handleFibSelect = (e: React.MouseEvent, interactives: any[], moreProps: any) => {
    handleFeatureSelection('fibonacci', interactives);
  };

  const handleChannelSelect = (e: React.MouseEvent, interactives: any[], moreProps: any) => {
    handleFeatureSelection('trendchannel', interactives);
  };

  // Tool switching - clear all selections when switching tools
  const handleToolSelect = (tool: string) => {
    interactiveFeaturesManager.clearAllSelections();
    setCurrentTool(tool);
  };

  // Rest of component remains the same...
  return (
    <div>
      {/* Chart and UI components */}
    </div>
  );
}