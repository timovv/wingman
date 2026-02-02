import type { WingmanNode, WingmanElement } from "../runtime/component.js";
import { isElement } from "../runtime/component.js";
import { setContext, type CompositorContext } from "../runtime/context.js";

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
  context: CompositorContext,
): RenderResult {
  const metadata: RenderMetadata = {
    outputFiles: [],
  };

  setContext(context);

  const content = renderNode(node, metadata);
  // Clean up excessive whitespace
  const cleaned = content
    .replace(/\n{3,}/g, "\n\n") // Max 2 newlines
    .trim();
  setContext(null);
  return { content: cleaned, metadata };
}

/**
 * Recursively render a node to a string.
 */
function renderNode(node: WingmanNode, metadata: RenderMetadata): string {
  if (node == null || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string") {
    // Strip standalone whitespace-only strings (MDX inserts these between elements)
    if (/^\s+$/.test(node)) {
      return "";
    }
    return node;
  }

  if (typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((n) => renderNode(n, metadata)).join("");
  }

  if (isElement(node)) {
    return renderElement(node, metadata);
  }

  return "";
}

/**
 * Render an element, handling both components and intrinsic elements.
 */
function renderElement(
  element: WingmanElement,
  metadata: RenderMetadata,
): string {
  const { type, props, children } = element;

  // Handle component functions
  if (typeof type === "function") {
    const result = type({ ...props, children });

    // Handle OutputFile component - the core primitive
    if (type.name === "OutputFile" && "path" in props) {
      const fileContent = renderNode(result, metadata);
      metadata.outputFiles.push({
        path: props.path as string,
        content: fileContent,
      });
      return ""; // OutputFile content is extracted, not inline
    }

    return renderNode(result, metadata);
  }

  // Handle intrinsic HTML-like elements - convert to markdown
  if (typeof type === "string") {
    return renderIntrinsicElement(type, children, props, metadata);
  }

  return "";
}

/**
 * Convert HTML-like elements to markdown syntax.
 */
function renderIntrinsicElement(
  tag: string,
  children: WingmanNode,
  props: Record<string, unknown>,
  metadata: RenderMetadata,
): string {
  const content = renderNode(children, metadata);

  switch (tag) {
    case "h1":
      return `# ${content}\n\n`;
    case "h2":
      return `## ${content}\n\n`;
    case "h3":
      return `### ${content}\n\n`;
    case "h4":
      return `#### ${content}\n\n`;
    case "h5":
      return `##### ${content}\n\n`;
    case "h6":
      return `###### ${content}\n\n`;
    case "p":
      return `${content}\n\n`;
    case "strong":
    case "b":
      return `**${content}**`;
    case "em":
    case "i":
      return `*${content}*`;
    case "code":
      return `\`${content}\``;
    case "pre":
      return `\`\`\`\n${content}\n\`\`\`\n\n`;
    case "blockquote":
      return (
        content
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n") + "\n\n"
      );
    case "hr":
      return "---\n\n";
    case "br":
      return "\n";
    case "a":
      return content;
    case "ul":
      return renderList(children, "-", metadata);
    case "ol":
      return renderList(children, "1.", metadata);
    case "li":
      return content;
    default:
      return content;
  }
}

/**
 * Render a list (ul/ol) with proper markdown formatting.
 */
function renderList(
  children: WingmanNode,
  marker: string,
  metadata: RenderMetadata,
): string {
  if (!Array.isArray(children)) {
    return renderNode(children, metadata);
  }

  const items: string[] = [];
  for (const child of children) {
    if (isElement(child) && child.type === "li") {
      const itemContent = renderNode(child.children, metadata);
      items.push(`${marker} ${itemContent}`);
    }
    // Skip whitespace-only strings between list items
  }

  return items.join("\n") + "\n\n";
}
