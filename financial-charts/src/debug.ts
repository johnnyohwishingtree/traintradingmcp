/**
 * Debug utility for AI-assisted development
 *
 * This provides runtime visibility into component behavior, making it easier
 * for both humans and AI assistants to diagnose issues.
 *
 * Usage:
 *   import { debugLog, debugState } from './debug';
 *
 *   debugLog('MyComponent', 'onClick', { data: 'value' });
 *   debugState('MyComponent', { currentState: this.state });
 */

export interface DebugConfig {
  enabled: boolean;
  components: Record<string, boolean>;
  logLevel: 'all' | 'trace' | 'warn' | 'error';
}

export const DEBUG_CONFIG: DebugConfig = {
  enabled: true, // Always enabled - can be disabled at runtime via window.__DEBUG_CONFIG__
  components: {
    AddTextButton: true,
    EachTrendLine: true,
    TrendLine: true,
    GenericChartComponent: true,
    // Add more components as needed
  },
  logLevel: 'all'
};

// Event trace history for debugging
interface TraceEvent {
  component: string;
  event: string;
  data: any;
  timestamp: number;
  stack?: string;
}

class EventTracer {
  private events: TraceEvent[] = [];
  private maxEvents = 100;

  trace(component: string, event: string, data?: any) {
    this.events.push({
      component,
      event,
      data,
      timestamp: Date.now(),
      stack: this.captureStack()
    });

    // Keep only last N events
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  getTrace(component?: string, eventFilter?: string): TraceEvent[] {
    let filtered = this.events;

    if (component) {
      filtered = filtered.filter(e => e.component === component);
    }

    if (eventFilter) {
      filtered = filtered.filter(e => e.event.includes(eventFilter));
    }

    return filtered;
  }

  clear() {
    this.events = [];
  }

  private captureStack(): string {
    const stack = new Error().stack || '';
    // Remove the first 3 lines (Error, captureStack, trace)
    return stack.split('\n').slice(3, 6).join('\n');
  }

  // Export trace for sharing with AI/debugging
  export(): string {
    return JSON.stringify(this.events, null, 2);
  }
}

export const tracer = new EventTracer();

// Expose tracer globally in development
if (typeof window !== 'undefined' && DEBUG_CONFIG.enabled) {
  (window as any).__TRACER__ = tracer;
}

/**
 * Main debug logging function
 */
export function debugLog(component: string, event: string, data?: any) {
  if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.components[component]) {
    return;
  }

  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1); // HH:MM:SS.mmm
  const prefix = `[${component}:${event}]`;

  // Trace to history
  tracer.trace(component, event, data);

  // Console log with color coding
  const style = getLogStyle(event);

  if (data !== undefined) {
    console.log(`%c${prefix}`, style, {
      time: timestamp,
      ...data
    });
  } else {
    console.log(`%c${prefix}`, style, timestamp);
  }
}

/**
 * Log component state snapshots
 */
export function debugState(component: string, state: any) {
  if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.components[component]) {
    return;
  }

  console.log(`%c[${component}:STATE]`, 'color: #9C27B0; font-weight: bold', state);
  tracer.trace(component, 'STATE', state);
}

/**
 * Log warnings (always shown if component debugging is enabled)
 */
export function debugWarn(component: string, message: string, data?: any) {
  if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.components[component]) {
    return;
  }

  console.warn(`[${component}:WARN] ${message}`, data || '');
  tracer.trace(component, 'WARN', { message, data });
}

/**
 * Log errors (always shown)
 */
export function debugError(component: string, message: string, error?: any) {
  console.error(`[${component}:ERROR] ${message}`, error || '');
  tracer.trace(component, 'ERROR', { message, error });
}

/**
 * Get color-coded console style based on event type
 */
function getLogStyle(event: string): string {
  const eventLower = event.toLowerCase();

  if (eventLower.includes('click') || eventLower.includes('press')) {
    return 'color: #2196F3; font-weight: bold'; // Blue for interactions
  }
  if (eventLower.includes('hover') || eventLower.includes('mouse')) {
    return 'color: #4CAF50; font-weight: bold'; // Green for hover
  }
  if (eventLower.includes('render')) {
    return 'color: #FF9800; font-weight: bold'; // Orange for render
  }
  if (eventLower.includes('error') || eventLower.includes('fail')) {
    return 'color: #F44336; font-weight: bold'; // Red for errors
  }
  if (eventLower.includes('success') || eventLower.includes('complete')) {
    return 'color: #8BC34A; font-weight: bold'; // Light green for success
  }

  return 'color: #607D8B; font-weight: bold'; // Gray default
}

/**
 * Assert helper - logs and throws if condition is false
 */
export function debugAssert(component: string, condition: boolean, message: string, data?: any) {
  if (!condition) {
    debugError(component, `ASSERTION FAILED: ${message}`, data);
    throw new Error(`[${component}] ${message}`);
  }
}

/**
 * Performance measurement helper
 */
export class DebugTimer {
  private startTime: number;
  private component: string;
  private operation: string;

  constructor(component: string, operation: string) {
    this.component = component;
    this.operation = operation;
    this.startTime = performance.now();

    debugLog(component, `${operation}:start`, { startTime: this.startTime });
  }

  end(data?: any) {
    const endTime = performance.now();
    const duration = endTime - this.startTime;

    debugLog(this.component, `${this.operation}:end`, {
      duration: `${duration.toFixed(2)}ms`,
      ...data
    });

    return duration;
  }
}

/**
 * Debug helper to inspect props/state in render
 */
export function debugRenderProps(component: string, props: any, state?: any) {
  if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.components[component]) {
    return;
  }

  console.group(`%c[${component}:RENDER]`, 'color: #FF9800; font-weight: bold');
  console.log('Props:', props);
  if (state !== undefined) {
    console.log('State:', state);
  }
  console.groupEnd();
}

// Export configuration for runtime modification
if (typeof window !== 'undefined') {
  (window as any).__DEBUG_CONFIG__ = DEBUG_CONFIG;
}
