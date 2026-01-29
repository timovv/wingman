/** Context available during composition */
export interface CompositorContext {
  /** Target agent (e.g., 'copilot', 'claude') */
  agentName: string;
  /** Target directory where output will be written */
  targetDirectory: string;
  /** Operating system */
  platform: NodeJS.Platform;
}

/** Current context - set during rendering */
let currentContext: CompositorContext | null = null;

/** Get the current compositor context. Must be called during rendering. */
export function useContext<T extends Record<string, unknown> = Record<string, never>>(): T & CompositorContext {
  if (!currentContext) {
    throw new Error('useContext() must be called during composition');
  }
  return currentContext as T & CompositorContext;
}

/** Set the current context (internal use) */
export function setContext(ctx: CompositorContext | null): void {
  currentContext = ctx;
}

/** Create a default context */
export function createContext(
  overrides: Partial<CompositorContext> = {}
): CompositorContext {
  return {
    agentName: 'copilot',
    targetDirectory: process.cwd(),
    platform: process.platform,
    ...overrides,
  };
}
