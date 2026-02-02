import path from "path";
import type { WingmanNode, Props } from "../runtime/component.js";
import { useContext } from "../runtime/context.js";
import { readFileSync } from "fs";

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
  const context = useContext();
  const dir = context.targetDirectory;

  const p = path.join(dir, props.src);
  const content = readFileSync(p, "utf-8");
  return `\n\n${content.trim()}\n`;
}
