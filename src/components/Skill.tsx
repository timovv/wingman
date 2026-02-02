import type { WingmanNode, Props } from "../runtime/component.js";
import { OutputFile } from "./OutputFile.js";
import { Frontmatter } from "./Frontmatter.js";
import { useContext } from "../runtime/context.js";

export interface SkillProps extends Props {
  /** Name of the skill (required, max 64 chars, lowercase + hyphens only) */
  name: string;
  /** Description of what the skill does and when to use it (required, max 1024 chars) */
  description: string;
  /** License name or reference to bundled license file */
  license?: string;
  /** Environment requirements (intended product, system packages, network access, etc.) */
  compatibility?: string;
  /** Arbitrary key-value metadata */
  metadata?: Record<string, string>;
  /** Space-delimited list of pre-approved tools (experimental) */
  allowedTools?: string;
  /** Content */
  children?: WingmanNode;
}

/**
 * Skill component.
 * Outputs to .github/skills/{name}/SKILL.md with skill frontmatter.
 */
export function Skill(props: SkillProps): WingmanNode {
  const {
    name,
    description,
    license,
    compatibility,
    metadata,
    allowedTools,
    children,
  } = props;

  const frontmatter: Record<string, unknown> = { name, description };
  if (license) frontmatter.license = license;
  if (compatibility) frontmatter.compatibility = compatibility;
  if (allowedTools) frontmatter["allowed-tools"] = allowedTools;
  if (metadata) frontmatter.metadata = metadata;

  const { agentName } = useContext();
  
  let outputFilePath: string;
  switch(agentName) {
    case "copilot":
      outputFilePath = `.github/skills/${name}/SKILL.md`;
      break;
    case "claude":
      outputFilePath = `.claude/skills/${name}/SKILL.md`;
      break;
    case "claude-plugin":
      outputFilePath = `skills/${name}/SKILL.md`;
      break;
    default:
      throw new Error(`Unsupported agent name: ${agentName}`);
  }

  return (
    <OutputFile path={outputFilePath}>
      <Frontmatter data={frontmatter} />
      {children}
    </OutputFile>
  );
}
