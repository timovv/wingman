import type { WingmanNode, Props } from "../runtime/component.js";
import { OutputFile } from "./OutputFile.js";
import { Frontmatter } from "./Frontmatter.js";

export interface InstructionsProps extends Props {
  /** Glob pattern for files these instructions apply to */
  applyTo: string;
  /** Filename for the output (without extension) */
  name?: string;
  /** Content */
  children?: WingmanNode;
}

/**
 * Instructions component.
 * Outputs to .github/instructions/{name}.md with applyTo frontmatter.
 */
export function Instructions(props: InstructionsProps): WingmanNode {
  const { applyTo, name, children } = props;

  const fileName = name ?? applyTo.replace(/\*/g, "_").replace(/\./g, "-");

  return (
    <OutputFile path={`.github/instructions/${fileName}.md`}>
      <Frontmatter data={{ applyTo }} />
      {children}
    </OutputFile>
  );
}
