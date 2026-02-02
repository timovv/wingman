import type { WingmanNode, Props } from "../runtime/component.js";

export interface FrontmatterProps extends Props {
  /** Frontmatter data as key-value pairs */
  data: Record<string, unknown>;
}

/**
 * Frontmatter component.
 * Renders YAML frontmatter at the start of a file.
 */
export function Frontmatter(props: FrontmatterProps): WingmanNode {
  const { data } = props;

  const lines: string[] = ["---"];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;

    if (typeof value === "object" && !Array.isArray(value)) {
      // Nested object (like metadata)
      lines.push(`${key}:`);
      for (const [nestedKey, nestedValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        lines.push(`  ${nestedKey}: "${nestedValue}"`);
      }
    } else if (typeof value === "string") {
      // String value - quote if it contains special chars
      if (value.includes(":") || value.includes("#") || value.includes("\n")) {
        lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push("---");
  return lines.join("\n") + "\n";
}
