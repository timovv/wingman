import type { WingmanNode, WingmanElement } from '../runtime/component.js';
import { isElement } from '../runtime/component.js';
import { setContext, createContext, type CompositorContext } from '../runtime/context.js';

/** Output file definition */
export interface OutputFileDef {
  path: string;
  content: string;
}

/** Collected metadata during rendering */
export interface RenderMetadata {
  /** Output files collected from OutputFile components */
  outputFiles: OutputFileDef[];
}

export interface RenderResult {
  /** Main markdown content */
  content: string;
  /** Collected metadata */
  metadata: RenderMetadata;
}

/**
 * Render a Wingman node tree to markdown.
 */
export function render(
  node: WingmanNode,
  context?: Partial<CompositorContext>
): RenderResult {
  const ctx = createContext(context);
  const metadata: RenderMetadata = {
    outputFiles: [],
  };

  // Set context for getContext() calls
  setContext(ctx);

  try {
    const content = renderNode(node, metadata);
    // Clean up excessive whitespace
    const cleaned = content
      .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
      .trim();
    return { content: cleaned, metadata };
  } finally {
    setContext(null);
  }
}

/**
 * Recursively render a node to a string.
 */
function renderNode(node: WingmanNode, metadata: RenderMetadata): string {
  if (node == null || typeof node === 'boolean') {
    return '';
  }

  if (typeof node === 'string') {
    // Strip standalone whitespace-only strings (MDX inserts these between elements)
    if (/^\s+$/.test(node)) {
      return '';
    }
    return node;
  }

  if (typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((n) => renderNode(n, metadata)).join('');
  }

  if (isElement(node)) {
    return renderElement(node, metadata);
  }

  return '';
}

/**
 * Render an element, handling both components and intrinsic elements.
 */
function renderElement(element: WingmanElement, metadata: RenderMetadata): string {
  const { type, props, children } = element;

  // Handle component functions
  if (typeof type === 'function') {
    const result = type({ ...props, children });
    
    // Handle OutputFile component - the core primitive
    if (type.name === 'OutputFile' && 'path' in props) {
      const fileContent = renderNode(result, metadata);
      metadata.outputFiles.push({
        path: props.path as string,
        content: fileContent,
      });
      return ''; // OutputFile content is extracted, not inline
    }

    return renderNode(result, metadata);
  }

  // Handle intrinsic HTML-like elements (pass through)
  if (typeof type === 'string') {
    const childContent = renderNode(children, metadata);
    return `<${type}>${childContent}</${type}>`;
  }

  return '';
}
