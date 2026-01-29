import type { WingmanNode, Props } from '../runtime/component.js';

export interface IncludeProps extends Props {
  /** Path to the file to include (relative to project src/) */
  src: string;
}

/**
 * Include component.
 * Includes content from another file at composition time.
 * The actual file loading is handled by the renderer.
 */
export function Include(props: IncludeProps): WingmanNode {
  // The renderer will detect this component and load the file
  // This just returns a placeholder that gets replaced
  return null;
}
