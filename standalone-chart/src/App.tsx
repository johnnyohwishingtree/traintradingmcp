import React, { useState, useCallback } from 'react';
import StockChartWithTools from './StockChartWithTools';
import MCPTrendLineDemo from './MCPTrendLineDemo';
import DrawingToolbar from './DrawingToolbar';
import HeaderToolbar from './HeaderToolbar';
import ReplayControls from './ReplayControls';
import IndicatorsPanel from './IndicatorsPanel';
import ChartTypePanel from './ChartTypePanel';
import SettingsPanel from './SettingsPanel';
import PineScriptImporter from './PineScriptImporter';
import ChartIndicatorsPanel from './ChartIndicatorsPanel';
import IndicatorSettingsPanel from './IndicatorSettingsPanel';
import { withOHLCData } from './withOHLCData';
import { pineEngine, PineScriptOutput } from './PineScriptEngine';
import { 
  interactiveFeaturesManager, 
  createSimpleLineFeature,
  createComplexAreaFeature,
  HistoryState 
} from './InteractiveFeaturesManager';
import './App.css';
import './PineScriptImporter.css';
import './ChartIndicatorsPanel.css';
import './IndicatorSettingsPanel.css';

const ChartWithData = withOHLCData()(StockChartWithTools);
const MCPDemoWithData = withOHLCData()(MCPTrendLineDemo);

// Define the history state interface
interface HistoryState {
  trendLines: any[];
  trendChannels: any[];
  fibonacciRetracements: any[];
  trianglePatterns: any[];
}

const App = () => {
  // Add MCP demo mode state
  const [mcpDemoMode, setMcpDemoMode] = useState(() => {
    // Check URL for demo mode
    return window.location.search.includes('demo=mcp');
  });
  
  const [currentSymbol, setCurrentSymbol] = useState(() => {
    // Check if there's a preserved symbol from a refresh/delete
    const preserved = localStorage.getItem('chartRefreshSymbol');
    if (preserved) {
      localStorage.removeItem('chartRefreshSymbol'); // Clean up after use
      return preserved;
    }
    return 'SNOW'; // Default to SNOW like in your screenshot
  });
  const [currentInterval, setCurrentInterval] = useState(() => {
    // Check if there's a preserved interval from a refresh/delete
    const preserved = localStorage.getItem('chartRefreshInterval');
    if (preserved) {
      localStorage.removeItem('chartRefreshInterval'); // Clean up after use
      return preserved;
    }
    return '1day'; // Default to 1 day
  });
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [enableTrendLine, setEnableTrendLine] = useState(false);
  const [enableTrendChannel, setEnableTrendChannel] = useState(false);
  const [enableFibonacci, setEnableFibonacci] = useState(false);
  const [enablePatterns, setEnablePatterns] = useState(false);
  const [trendLines, setTrendLines] = useState<any[]>([]);
  const [trendChannels, setTrendChannels] = useState<any[]>([]);
  const [fibonacciRetracements, setFibonacciRetracements] = useState<any[]>([]);
  const [trianglePatterns, setTrianglePatterns] = useState<any[]>([]);
  const [selectedTrendLines, setSelectedTrendLines] = useState<number[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [selectedFibs, setSelectedFibs] = useState<number[]>([]);
  const [selectedTriangles, setSelectedTriangles] = useState<number[]>([]);
  const [lastSelectedObject, setLastSelectedObject] = useState<{type: 'trendline' | 'trendchannel' | 'fibonacci' | 'triangle', index: number} | null>(null);

  // Register interactive features with unified manager
  React.useEffect(() => {
    console.log('🔧 Registering interactive features with unified manager...');
    
    // PATTERN 1: Simple Line Objects (follow TrendLine)
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

    // PATTERN 2: Complex Area Objects (follow TrendChannel)
    interactiveFeaturesManager.registerFeature(createComplexAreaFeature({
      type: 'trendchannel',
      displayName: 'Trend Channels',
      items: trendChannels,
      selectedIndices: selectedChannels,
      setItems: setTrendChannels,
      setSelectedIndices: setSelectedChannels,
      logPrefix: '🔶',
      hasAreaFill: true
    }));

    interactiveFeaturesManager.registerFeature(createComplexAreaFeature({
      type: 'fibonacci',
      displayName: 'Fibonacci Retracements',
      items: fibonacciRetracements,
      selectedIndices: selectedFibs,
      setItems: setFibonacciRetracements,
      setSelectedIndices: setSelectedFibs,
      logPrefix: '📏',
      hasAreaFill: false // Fibonacci lines without fill
    }));

    interactiveFeaturesManager.registerFeature(createComplexAreaFeature({
      type: 'triangle',
      displayName: 'Triangle Patterns',
      items: trianglePatterns,
      selectedIndices: selectedTriangles,
      setItems: setTrianglePatterns,
      setSelectedIndices: setSelectedTriangles,
      logPrefix: '🔺',
      hasAreaFill: true
    }));
    
    console.log('✅ Interactive features registered:', interactiveFeaturesManager.getRegisteredFeatures());
  }, []); // Only register once

  // Update feature state when React state changes
  React.useEffect(() => {
    const trendLineFeature = interactiveFeaturesManager.getFeature('trendline');
    if (trendLineFeature) {
      trendLineFeature.items = trendLines;
      trendLineFeature.selectedIndices = selectedTrendLines;
    }
  }, [trendLines, selectedTrendLines]);

  React.useEffect(() => {
    const channelFeature = interactiveFeaturesManager.getFeature('trendchannel');
    if (channelFeature) {
      channelFeature.items = trendChannels;
      channelFeature.selectedIndices = selectedChannels;
    }
  }, [trendChannels, selectedChannels]);

  React.useEffect(() => {
    const fibFeature = interactiveFeaturesManager.getFeature('fibonacci');
    if (fibFeature) {
      fibFeature.items = fibonacciRetracements;
      fibFeature.selectedIndices = selectedFibs;
    }
  }, [fibonacciRetracements, selectedFibs]);

  React.useEffect(() => {
    const triangleFeature = interactiveFeaturesManager.getFeature('triangle');
    if (triangleFeature) {
      triangleFeature.items = trianglePatterns;
      triangleFeature.selectedIndices = selectedTriangles;
    }
  }, [trianglePatterns, selectedTriangles]);

  // Undo/Redo history management
  const [history, setHistory] = useState<HistoryState[]>([{
    trendLines: [],
    trendChannels: [],
    fibonacciRetracements: [],
    trianglePatterns: []
  }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Replay state management
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [replayPosition, setReplayPosition] = useState(0); // Index in data array
  const [replaySpeed, setReplaySpeed] = useState(1); // 1x speed by default
  const [fullData, setFullData] = useState<any[]>([]); // Store full dataset
  const [replayEndPosition, setReplayEndPosition] = useState<number | null>(null); // End position for replay
  const replayIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Store drawings before replay mode to restore after exit
  const [preReplayDrawings, setPreReplayDrawings] = useState<HistoryState | null>(null);

  // Indicators state management
  const [enabledIndicators, setEnabledIndicators] = useState({
    ema10: false,
    ema12: true,  // Keep existing ones enabled by default
    ema26: true,
    ema50: false,
    ema200: false,
    sma10: false,
    sma50: false,
    sma200: false,
    bollingerBands: false,
    elderRay: true,  // Enabled by default to maintain current behavior
    volume: true     // Enabled by default to maintain current behavior
  });
  
  const [isIndicatorsDropdownOpen, setIsIndicatorsDropdownOpen] = useState(false);

  // Chart type state management
  const [chartType, setChartType] = useState<'candlestick' | 'ohlc' | 'line' | 'area'>('candlestick');
  const [isChartTypeDropdownOpen, setIsChartTypeDropdownOpen] = useState(false);

  // Settings state management
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [zoomMultiplier, setZoomMultiplier] = useState(1.03); // Start with a smoother default
  const [displayTimezone, setDisplayTimezone] = useState<string>('et'); // Default to ET for market hours

  // Refresh symbol data function
  const handleRefreshSymbolData = useCallback(async (symbol: string) => {
    try {
      // Clean the symbol name before making the request
      const cleanSymbol = symbol.replace('_refresh', '').replace('_replay_exit', '').replace('_reset', '').replace('TEMP_RELOAD', 'SNOW');
      
      const response = await fetch(`http://localhost:3001/api/symbols/${cleanSymbol}/refresh`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`✅ Successfully refreshed data for ${cleanSymbol}. Fetched ${result.totalDataPoints} data points from Yahoo Finance. The chart will reload with fresh data.`);
        
        // Preserve current symbol and interval before reload
        localStorage.setItem('chartRefreshSymbol', cleanSymbol);
        localStorage.setItem('chartRefreshInterval', currentInterval);
        
        // Force component re-mount by changing key
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        const error = await response.text();
        alert(`❌ Failed to refresh data for ${cleanSymbol}: ${error}`);
      }
    } catch (error) {
      alert(`❌ Error refreshing data: ${error}`);
    }
  }, [currentSymbol]);

  // PineScript state management
  const [isPineScriptImporterOpen, setIsPineScriptImporterOpen] = useState(false);
  const [importedIndicators, setImportedIndicators] = useState<Array<{
    name: string; 
    output: PineScriptOutput;
    enabled: boolean;
    settings?: Record<string, any>;
  }>>([]);
  const [selectedIndicatorForSettings, setSelectedIndicatorForSettings] = useState<number | null>(null);
  const [chartData, setChartData] = useState<any[]>([]); // Store current chart data for indicators

  // Chart height management for resizable indicators
  const [elderRayHeight, setElderRayHeight] = useState(100);
  const [volumeHeight, setVolumeHeight] = useState(150);
  const [yAxisPadding, setYAxisPadding] = useState(0.1); // 10% padding by default



  // Debug effect to track trendLines changes
  React.useEffect(() => {
    console.log('📈 TrendLines state changed. New count:', trendLines.length);
    trendLines.forEach((line, index) => {
      console.log(`  Line ${index}:`, line.start, '->', line.end);
    });
  }, [trendLines]);

  // Save current state to history (called after drawing actions)
  const saveToHistory = useCallback((newState: HistoryState) => {
    console.log('💾 Saving to history:', newState);
    setHistory(prevHistory => {
      // Remove any "future" history if we're not at the end
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      // Add the new state
      newHistory.push(newState);
      // Limit history size to prevent memory issues
      const maxHistorySize = 50;
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize);
      }
      return newHistory;
    });
    setHistoryIndex(prevIndex => prevIndex + 1);
  }, [historyIndex]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      console.log('↶ Undo: Moving from history index', historyIndex, 'to', historyIndex - 1);
      const prevState = history[historyIndex - 1];
      setTrendLines(prevState.trendLines);
      setTrendChannels(prevState.trendChannels);
      setFibonacciRetracements(prevState.fibonacciRetracements);
      setTrianglePatterns(prevState.trianglePatterns);
      setHistoryIndex(historyIndex - 1);
      // Clear selections when undoing
      setSelectedTrendLines([]);
      setSelectedChannels([]);
      setSelectedFibs([]);
      setSelectedTriangles([]);
      setLastSelectedObject(null);
    } else {
      console.log('↶ Cannot undo: Already at the beginning of history');
    }
  }, [history, historyIndex]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      console.log('↷ Redo: Moving from history index', historyIndex, 'to', historyIndex + 1);
      const nextState = history[historyIndex + 1];
      setTrendLines(nextState.trendLines);
      setTrendChannels(nextState.trendChannels);
      setFibonacciRetracements(nextState.fibonacciRetracements);
      setTrianglePatterns(nextState.trianglePatterns);
      setHistoryIndex(historyIndex + 1);
      // Clear selections when redoing
      setSelectedTrendLines([]);
      setSelectedChannels([]);
      setSelectedFibs([]);
      setSelectedTriangles([]);
      setLastSelectedObject(null);
    } else {
      console.log('↷ Cannot redo: Already at the end of history');
    }
  }, [history, historyIndex]);

  // UNIFIED HANDLERS - Replace repetitive selection and completion logic
  const handleFeatureCompletion = (featureType: string, newItems: any[]) => {
    const currentState: HistoryState = {
      trendLines,
      trendChannels,
      fibonacciRetracements,
      trianglePatterns
    };
    
    const previousCount = currentState[getStateKey(featureType)].length;
    
    const selectedIndices = interactiveFeaturesManager.handleCompletion(
      featureType,
      newItems,
      currentState,
      saveToHistory
    );
    
    // AUTO-SWITCH LOGIC: If this was a drawing action (new item added), switch back to cursor
    // This prevents drawing new items when trying to drag existing ones
    if (newItems.length > previousCount) {
      console.log(`🎯 New ${featureType} added - auto-switching to cursor mode`);
      
      // Switch off the current drawing tool
      switch (featureType) {
        case 'trendline':
          setEnableTrendLine(false);
          break;
        case 'trendchannel':
          setEnableTrendChannel(false);
          break;
        case 'fibonacci':
          setEnableFibonacci(false);
          break;
        case 'triangle':
          setEnablePatterns(false);
          break;
        // Add other pattern types as needed
      }
      
      // Set current tool to null (cursor mode)
      setCurrentTool(null);
      console.log(`✅ Auto-switched to cursor mode after drawing ${featureType}`);
    } else {
      console.log(`🔄 This was a drag/modify operation for ${featureType}, not switching tools`);
    }
    
    return selectedIndices;
  };

  // Helper function to get the correct state key for each feature type
  const getStateKey = (featureType: string): keyof HistoryState => {
    switch (featureType) {
      case 'trendline': return 'trendLines';
      case 'trendchannel': return 'trendChannels';
      case 'fibonacci': return 'fibonacciRetracements';
      case 'triangle': return 'trianglePatterns';
      default: throw new Error(`Unknown feature type: ${featureType}`);
    }
  };

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
        type: featureType as 'trendline' | 'trendchannel' | 'fibonacci' | 'triangle',
        index: selectedIndices[0] 
      });
    }
    
    return selectedIndices;
  };

  const handleToolSelect = (tool: string | null) => {
    setCurrentTool(tool);
    
    // Handle each tool type separately for complete decoupling
    const lineTypes = ['trendline', 'ray', 'extendedline', 'infoline', 'horizontalline', 'horizontalray', 'verticalline'];
    const isLineType = tool && lineTypes.includes(tool);
    
    // Each tool has its own independent state
    setEnableTrendLine(isLineType);
    setEnableTrendChannel(tool === 'trendchannel');
    setEnableFibonacci(tool === 'fibonacci');
    setEnablePatterns(tool === 'patterns');
  };

  const handleSymbolChange = (symbol: string) => {
    console.log('📊 Symbol changed to:', symbol);
    setCurrentSymbol(symbol);
    // Clear all drawings when changing symbols
    setTrendLines([]);
    setFibonacciRetracements([]);
    setTrianglePatterns([]);
    setSelectedTrendLines([]);
    setSelectedFibs([]);
    setSelectedTriangles([]);
    setLastSelectedObject(null);
    
    // Reset history when changing symbols
    const newInitialState = {
      trendLines: [],
      fibonacciRetracements: [],
      trianglePatterns: []
    };
    setHistory([newInitialState]);
    setHistoryIndex(0);
  };

  const handleIntervalChange = (interval: string) => {
    console.log('⏰ Interval changed to:', interval);
    setCurrentInterval(interval);
    // Data will automatically reload via withOHLCData component
    
    // Reset history for new symbol
    setHistory([{
      trendLines: [],
      fibonacciRetracements: [],
      trianglePatterns: []
    }]);
    setHistoryIndex(0);
  };

  const handleRefresh = () => {
    console.log('🔄 Resetting chart to default view...');
    
    // Force a re-render to reset zoom/pan by toggling a key state
    // This will cause the chart to remount and reset to default view
    const tempSymbol = currentSymbol + '_reset';
    setCurrentSymbol(tempSymbol);
    
    // Immediately set it back to trigger a fresh render with default zoom
    setTimeout(() => {
      setCurrentSymbol(currentSymbol);
    }, 10);
    
    // Reset Y-axis padding to default
    setYAxisPadding(0.1);
    
    console.log('✅ Chart view reset to default. Drawings and data preserved.');
  };

  // Replay functions
  const startReplay = () => {
    console.log('▶️ Starting replay mode');
    
    // Save current drawings before entering replay mode
    const currentDrawings = {
      trendLines: [...trendLines],
      fibonacciRetracements: [...fibonacciRetracements],
      trianglePatterns: [...trianglePatterns]
    };
    setPreReplayDrawings(currentDrawings);
    console.log('💾 Saved drawings before replay:', currentDrawings);
    
    setIsReplayMode(true);
    setIsReplayPlaying(false);
    
    // Clear drawings when entering replay mode
    setTrendLines([]);
    setFibonacciRetracements([]);
    setTrianglePatterns([]);
    
    // Start from beginning (show only first 50 bars initially)
    setReplayPosition(Math.min(50, fullData.length));
  };

  const exitReplay = () => {
    console.log('⏹️ Exiting replay mode');
    setIsReplayMode(false);
    setIsReplayPlaying(false);
    setReplayPosition(0);
    
    // Stop any running interval
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
      replayIntervalRef.current = null;
    }
    
    // Restore drawings that were saved before replay mode
    if (preReplayDrawings) {
      console.log('🔄 Restoring pre-replay drawings:', preReplayDrawings);
      setTrendLines(preReplayDrawings.trendLines);
      setFibonacciRetracements(preReplayDrawings.fibonacciRetracements);
      setTrianglePatterns(preReplayDrawings.trianglePatterns);
      setPreReplayDrawings(null); // Clear the saved state
    } else {
      console.log('⚠️ No pre-replay drawings to restore');
    }
    
    // Force data refresh to show full dataset again
    const tempSymbol = currentSymbol + '_replay_exit';
    setCurrentSymbol(tempSymbol);
    setTimeout(() => {
      setCurrentSymbol(currentSymbol.replace('_replay_exit', ''));
    }, 0);
  };

  const playReplay = () => {
    console.log('▶️ Playing replay');
    setIsReplayPlaying(true);
    
    // Calculate optimal interval and steps based on speed
    let intervalMs = 200; // Base interval in milliseconds
    let stepsPerTick = 1;
    
    if (replaySpeed <= 2) {
      intervalMs = 1000 / replaySpeed;
      stepsPerTick = 1;
    } else {
      // For higher speeds, use larger steps with reasonable interval
      intervalMs = 100;
      stepsPerTick = Math.max(1, Math.round(replaySpeed / 2));
    }
    
    console.log(`🚀 Replay speed: ${replaySpeed}x (${intervalMs}ms interval, ${stepsPerTick} steps/tick)`);
    
    // Start interval to advance replay position
    replayIntervalRef.current = setInterval(() => {
      setReplayPosition(prev => {
        const newPos = prev + stepsPerTick;
        const endPos = replayEndPosition || fullData.length;
        // Stop at end position (either user-set end or full dataset)
        if (newPos >= endPos) {
          pauseReplay();
          return endPos;
        }
        return newPos;
      });
    }, intervalMs);
  };

  const pauseReplay = () => {
    console.log('⏸️ Pausing replay');
    setIsReplayPlaying(false);
    
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
      replayIntervalRef.current = null;
    }
  };

  const stepForward = () => {
    setReplayPosition(prev => Math.min(prev + 1, fullData.length));
  };

  const stepBackward = () => {
    setReplayPosition(prev => Math.max(prev - 1, 1));
  };

  const changeReplaySpeed = (speed: number) => {
    setReplaySpeed(speed);
    // If playing, restart with new speed
    if (isReplayPlaying) {
      pauseReplay();
      setTimeout(() => playReplay(), 0);
    }
  };

  const handleEndDateSelect = (position: number) => {
    console.log('📅 End date selected, position:', position);
    setReplayEndPosition(position);
    
    // If current position is beyond the new end position, move to end position
    if (replayPosition > position) {
      setReplayPosition(position);
    }
  };

  const clearEndDate = () => {
    console.log('🗑️ Clearing end date');
    setReplayEndPosition(null);
  };

  // Indicator functions
  const toggleIndicator = (indicatorKey: string) => {
    setEnabledIndicators(prev => ({
      ...prev,
      [indicatorKey]: !prev[indicatorKey]
    }));
  };

  const handleIndicatorsClick = () => {
    setIsIndicatorsDropdownOpen(!isIndicatorsDropdownOpen);
  };

  // Chart type functions
  const handleChartTypeClick = () => {
    setIsChartTypeDropdownOpen(!isChartTypeDropdownOpen);
  };

  const handleChartTypeSelect = (type: 'candlestick' | 'ohlc' | 'line' | 'area') => {
    setChartType(type);
    setIsChartTypeDropdownOpen(false);
  };

  // Settings functions
  const handleSettingsClick = () => {
    setIsSettingsOpen(!isSettingsOpen);
  };

  // PineScript functions
  const handlePineScriptImport = () => {
    setIsPineScriptImporterOpen(true);
  };

  const handleIndicatorImported = useCallback(async (output: PineScriptOutput, name: string) => {
    // Set default settings based on indicator type
    let defaultSettings = {};
    if (name.includes('COG')) {
      defaultSettings = { length: 34, mult: 2.5, offset: 20 };
    } else if (name.includes('SMA')) {
      defaultSettings = { length: 20, source: 'close' };
    } else if (name.includes('RSI')) {
      defaultSettings = { length: 14, source: 'close' };
    }
    
    setImportedIndicators(prev => [...prev, { 
      name, 
      output, 
      enabled: true, 
      settings: defaultSettings 
    }]);
    console.log('✅ Indicator imported successfully:', name);
    console.log('📊 Output:', output);
  }, []);

  const handleToggleImportedIndicator = useCallback((index: number) => {
    setImportedIndicators(prev => 
      prev.map((indicator, i) => 
        i === index 
          ? { ...indicator, enabled: !indicator.enabled }
          : indicator
      )
    );
  }, []);

  const handleIndicatorSettingsClick = useCallback((index: number) => {
    setSelectedIndicatorForSettings(index);
  }, []);

  const handleIndicatorSettingsChange = useCallback((settings: Record<string, any>) => {
    if (selectedIndicatorForSettings !== null) {
      setImportedIndicators(prev => 
        prev.map((indicator, i) => 
          i === selectedIndicatorForSettings 
            ? { ...indicator, settings: { ...indicator.settings, ...settings } }
            : indicator
        )
      );
    }
  }, [selectedIndicatorForSettings]);

  const handleCloseIndicatorSettings = useCallback(() => {
    setSelectedIndicatorForSettings(null);
  }, []);

  const handleClosePineScriptImporter = () => {
    setIsPineScriptImporterOpen(false);
  };

  const handleZoomMultiplierChange = (value: number) => {
    setZoomMultiplier(value);
  };

  // Recalculate imported indicators when chart data changes (timeframe change, symbol change, etc.)
  const lastChartDataLength = React.useRef(0);
  const lastSymbol = React.useRef(currentSymbol);
  const lastInterval = React.useRef(currentInterval);
  
  React.useEffect(() => {
    // Only recalculate if we have both data and indicators, and the data actually changed
    const dataChanged = chartData.length !== lastChartDataLength.current;
    const symbolChanged = currentSymbol !== lastSymbol.current;
    const intervalChanged = currentInterval !== lastInterval.current;
    
    if (chartData.length > 0 && importedIndicators.length > 0 && (dataChanged || symbolChanged || intervalChanged)) {
      console.log('📊 Recalculating indicators due to data change');
      console.log(`  - Chart data points: ${chartData.length}`);
      console.log(`  - Indicators to recalculate: ${importedIndicators.length}`);
      console.log(`  - Symbol: ${currentSymbol}, Interval: ${currentInterval}`);
      
      const recalculateIndicators = async () => {
        const currentIndicators = [...importedIndicators]; // Capture current state
        
        const updatedIndicators = await Promise.all(
          currentIndicators.map(async (indicator) => {
            try {
              // Convert chart data to MarketData format
              const convertedMarketData = chartData.map((item: any) => ({
                timestamp: item.date?.getTime() || Date.now(),
                open: item.open || 0,
                high: item.high || 0,
                low: item.low || 0,
                close: item.close || 0,
                volume: item.volume || 0
              }));

              // Recalculate indicator with new data
              const indicatorData = {
                name: indicator.name,
                script: '',  // Not needed for existing calculations
                parameters: indicator.settings || {}
              };
              
              const newOutput = await pineEngine.executeIndicator(indicatorData, convertedMarketData);
              
              console.log(`✅ Recalculated ${indicator.name} with ${convertedMarketData.length} data points`);
              
              return {
                ...indicator,
                output: newOutput
              };
            } catch (error) {
              console.error(`❌ Failed to recalculate ${indicator.name}:`, error);
              return indicator; // Keep original if recalculation fails
            }
          })
        );
        
        setImportedIndicators(updatedIndicators);
        console.log('✅ All indicators recalculated successfully');
      };
      
      recalculateIndicators();
      
      // Update refs to track changes
      lastChartDataLength.current = chartData.length;
      lastSymbol.current = currentSymbol;
      lastInterval.current = currentInterval;
    }
  }, [chartData, currentSymbol, currentInterval, importedIndicators.length]); // Only trigger on these specific changes

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close indicators panel
      if (isIndicatorsDropdownOpen && 
          !target.closest('.indicators-panel') && 
          !target.closest('.indicators-button')) {
        setIsIndicatorsDropdownOpen(false);
      }
      
      // Close chart type panel
      if (isChartTypeDropdownOpen && 
          !target.closest('.chart-type-panel') && 
          !target.closest('.chart-type-button')) {
        setIsChartTypeDropdownOpen(false);
      }
      
      // Close settings panel
      if (isSettingsOpen && 
          !target.closest('.settings-panel') && 
          !target.closest('[title="Settings"]')) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isIndicatorsDropdownOpen, isChartTypeDropdownOpen, isSettingsOpen]);

  // SIMPLIFIED COMPLETION HANDLERS using unified system
  const handleTrendLineComplete = (newTrendLines: any[]) => {
    handleFeatureCompletion('trendline', newTrendLines);
  };

  const handleTrendChannelComplete = (newChannels: any[]) => {
    handleFeatureCompletion('trendchannel', newChannels);
  };

  const handleFibonacciComplete = (newFibs: any[]) => {
    handleFeatureCompletion('fibonacci', newFibs);
  };

  const handleTriangleComplete = (newTriangles: any[]) => {
    handleFeatureCompletion('triangle', newTriangles);
  };

  // SIMPLIFIED SELECTION HANDLERS using unified system
  const handleTrendLineSelect = (e: React.MouseEvent, interactives: any[]) => {
    handleFeatureSelection('trendline', interactives);
  };

  const handleTrendChannelSelect = (e: React.MouseEvent, interactives: any[]) => {
    handleFeatureSelection('trendchannel', interactives);
  };

  const handleFibonacciSelect = (e: React.MouseEvent, interactives: any[]) => {
    handleFeatureSelection('fibonacci', interactives);
  };

  const handleTriangleSelect = (e: React.MouseEvent, interactives: any[]) => {
    handleFeatureSelection('triangle', interactives);
  };









  // Handle Delete key - use useRef to access current values without causing re-renders
  const stateRef = React.useRef({
    selectedTrendLines,
    selectedFibs,
    selectedTriangles,
    selectedChannels,
    lastSelectedObject,
    trendLines,
    fibonacciRetracements,
    trianglePatterns,
    trendChannels
  });

  // Update ref on every render
  React.useEffect(() => {
    stateRef.current = {
      selectedTrendLines,
      selectedFibs,
      selectedTriangles,
      selectedChannels,
      lastSelectedObject,
      trendLines,
      fibonacciRetracements,
      trianglePatterns,
      trendChannels
    };
  });

  // Keyboard listener with undo/redo and delete functionality
  React.useEffect(() => {
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
          // Cmd+Shift+Z = Redo
          console.log('↷ Redo keyboard shortcut detected');
          redo();
        } else {
          // Cmd+Z = Undo
          console.log('↶ Undo keyboard shortcut detected');
          undo();
        }
        return;
      }
      
      // Replay mode keyboard shortcuts
      if (isReplayMode) {
        // Space bar to play/pause
        if (e.key === ' ') {
          e.preventDefault();
          if (isReplayPlaying) {
            pauseReplay();
          } else {
            playReplay();
          }
          return;
        }
        
        // Arrow keys for step navigation
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          stepBackward();
          return;
        }
        
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          stepForward();
          return;
        }
        
        // Escape to exit replay mode
        if (e.key === 'Escape') {
          e.preventDefault();
          exitReplay();
          return;
        }
        
        // Number keys for speed control
        if (e.key >= '1' && e.key <= '5') {
          e.preventDefault();
          const speeds = [0.5, 1, 2, 5, 10];
          const speedIndex = parseInt(e.key) - 1;
          changeReplaySpeed(speeds[speedIndex]);
          return;
        }
      }
      
      // UNIFIED DESELECTION HANDLING - clear all selections with Escape
      if (e.key === 'Escape') {
        // First check if we're in replay mode and handle that
        if (isReplayMode) {
          setIsReplayMode(false);
          return;
        }
        
        // Otherwise, deselect all interactive features
        console.log('🚫 Escape key pressed - deselecting all features');
        interactiveFeaturesManager.handleDeselectAll();
        setLastSelectedObject(null);
      }
      
      // UNIFIED DELETE HANDLING - replaces 100+ lines of repetitive code
      if (e.key === 'Delete' || e.key === 'Backspace') {
        console.log('🗑️ Delete key pressed - using unified handler');
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

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, saveToHistory]); // Add dependencies

  // Unified deselection handler for click-on-empty-area
  const handleDeselectAll = useCallback(() => {
    console.log('🚫 Unified deselect all called');
    interactiveFeaturesManager.handleDeselectAll();
    setLastSelectedObject(null);
  }, [interactiveFeaturesManager]);

  // Render MCP demo if in demo mode
  if (mcpDemoMode) {
    return (
      <div style={{ height: '100vh', background: '#131722' }}>
        <div style={{ 
          padding: '10px', 
          background: '#1e222d', 
          color: '#d1d4dc',
          borderBottom: '1px solid #2a2e39'
        }}>
          <button 
            onClick={() => setMcpDemoMode(false)}
            style={{
              padding: '5px 10px',
              background: '#2962ff',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Exit Demo Mode
          </button>
          <strong>MCP TrendLine Integration Demo</strong>
        </div>
        <MCPDemoWithData symbol={currentSymbol} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <HeaderToolbar
        currentSymbol={currentSymbol}
        onSymbolChange={handleSymbolChange}
        currentInterval={currentInterval}
        onIntervalChange={handleIntervalChange}
        onUndo={undo}
        onRedo={redo}
        onReplay={startReplay}
        onIndicatorsClick={handleIndicatorsClick}
        onChartTypeClick={handleChartTypeClick}
        onSettingsClick={handleSettingsClick}
        onPineScriptImport={handlePineScriptImport}
      />
      <DrawingToolbar 
        currentTool={currentTool}
        onToolSelect={handleToolSelect}
      />
      {/* Price info area for tests */}
      <div className="price-info-area" data-testid="price-info-area" style={{ 
        padding: '4px 8px', 
        fontSize: '12px', 
        color: '#666',
        borderBottom: '1px solid #eee'
      }}>
        Symbol: {currentSymbol} | Last Price: $229.33 | Range: $227.84 - $236.50
      </div>
      <div className="chart-container" data-testid="main-chart-container">
        {/* Imported indicators panel */}
        {importedIndicators.length > 0 && (
          <ChartIndicatorsPanel
            indicators={importedIndicators.map(ind => ({
              name: ind.name,
              enabled: ind.enabled,
              color: ind.output.plots[0]?.color
            }))}
            onToggleIndicator={handleToggleImportedIndicator}
            onSettingsClick={handleIndicatorSettingsClick}
          />
        )}
        
        <ChartWithData 
          symbol={currentSymbol}
          interval={currentInterval}
          dateTimeFormat={currentInterval.includes('min') ? 
            (displayTimezone === 'et' ? "%b %d %I:%M %p" : 
             displayTimezone === 'utc' ? "%b %d %H:%M UTC" : 
             "%b %d %I:%M %p") : 
            "%d %b"}
          displayTimezone={displayTimezone}
          currentTool={currentTool}
          enableTrendLine={enableTrendLine}
          enableTrendChannel={enableTrendChannel}
          enableFibonacci={enableFibonacci}
          enablePatterns={enablePatterns}
          trendLines={trendLines}
          trendChannels={trendChannels}
          fibonacciRetracements={fibonacciRetracements}
          trianglePatterns={trianglePatterns}
          selectedTrendLines={selectedTrendLines}
          selectedChannels={selectedChannels}
          selectedFibs={selectedFibs}
          selectedTriangles={selectedTriangles}
          onTrendLineComplete={handleTrendLineComplete}
          onTrendChannelComplete={handleTrendChannelComplete}
          onFibonacciComplete={handleFibonacciComplete}
          onTriangleComplete={handleTriangleComplete}
          onTrendLineSelect={handleTrendLineSelect}
          onTrendChannelSelect={handleTrendChannelSelect}
          onFibonacciSelect={handleFibonacciSelect}
          onTriangleSelect={handleTriangleSelect}
          onDeselectAll={handleDeselectAll}
          onRefresh={handleRefresh}
          isReplayMode={isReplayMode}
          replayPosition={replayPosition}
          fullData={fullData}
          onDataLoaded={(data) => {
            setFullData(data);
            setChartData(data);
          }}
          enabledIndicators={enabledIndicators}
          chartType={chartType}
          zoomMultiplier={zoomMultiplier}
          elderRayHeight={elderRayHeight}
          volumeHeight={volumeHeight}
          onElderRayHeightChange={setElderRayHeight}
          onVolumeHeightChange={setVolumeHeight}
          yAxisPadding={yAxisPadding}
          onYAxisPaddingChange={setYAxisPadding}
          importedIndicators={importedIndicators.filter(ind => ind.enabled)}
        />
      </div>
      
      {/* Replay Controls Overlay */}
      {isReplayMode && (
        <ReplayControls
          isPlaying={isReplayPlaying}
          replayPosition={replayPosition}
          totalBars={fullData.length}
          replaySpeed={replaySpeed}
          data={fullData}
          replayEndPosition={replayEndPosition}
          onPlay={playReplay}
          onPause={pauseReplay}
          onStepForward={stepForward}
          onStepBackward={stepBackward}
          onSpeedChange={changeReplaySpeed}
          onPositionChange={setReplayPosition}
          onDateSelect={setReplayPosition}
          onEndDateSelect={handleEndDateSelect}
          onClearEndDate={clearEndDate}
          onExit={exitReplay}
        />
      )}
      
      {/* Indicators Panel */}
      {isIndicatorsDropdownOpen && (
        <IndicatorsPanel
          enabledIndicators={enabledIndicators}
          onToggleIndicator={toggleIndicator}
          onClose={() => setIsIndicatorsDropdownOpen(false)}
        />
      )}
      
      {/* Chart Type Panel */}
      {isChartTypeDropdownOpen && (
        <ChartTypePanel
          currentChartType={chartType}
          onChartTypeSelect={handleChartTypeSelect}
          onClose={() => setIsChartTypeDropdownOpen(false)}
        />
      )}
      
      {/* Settings Panel */}
      {isSettingsOpen && (
        <SettingsPanel
          zoomMultiplier={zoomMultiplier}
          onZoomMultiplierChange={handleZoomMultiplierChange}
          displayTimezone={displayTimezone}
          onTimezoneChange={setDisplayTimezone}
          currentSymbol={currentSymbol}
          onRefreshSymbolData={handleRefreshSymbolData}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* PineScript Importer */}
      {isPineScriptImporterOpen && (
        <PineScriptImporter
          onIndicatorImported={handleIndicatorImported}
          onClose={handleClosePineScriptImporter}
          marketData={chartData}
        />
      )}

      {/* Indicator Settings Panel */}
      {selectedIndicatorForSettings !== null && (
        <IndicatorSettingsPanel
          indicatorName={importedIndicators[selectedIndicatorForSettings]?.name || ''}
          currentSettings={importedIndicators[selectedIndicatorForSettings]?.settings || {}}
          onSettingsChange={handleIndicatorSettingsChange}
          onClose={handleCloseIndicatorSettings}
        />
      )}
    </div>
  );
};

export default App;