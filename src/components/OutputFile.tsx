import type { WingmanNode, Props } from "../runtime/component.js";

export interface OutputFileProps extends Props {
  /** Output file path (relative to target directory) */
  path: string;
  /** Content */
  children?: WingmanNode;
}

/**
 * OutputFile component.
 * Content is rendered to the specified file path.
 * This is the core primitive for generating output files.
 */
export function OutputFile(props: OutputFileProps): WingmanNode {
  const { children } = props;
  return children ?? null;
}
