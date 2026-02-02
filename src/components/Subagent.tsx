import { WingmanNode } from "wingman/jsx-runtime";
import { OutputFile } from "./OutputFile.js";
import { Frontmatter } from "./Frontmatter.js";

export interface SubagentProps {
  name: string;
  description?: string;
  tools?: string[];
  model?: string;
  children: WingmanNode;
}

export const Subagent = (props: SubagentProps) => {
  return <OutputFile path={`./subagents/${props.name}.json`}>
    <Frontmatter data={{
      name: props.name,
      description: props.description,
      tools: props.tools,
      model: props.model,
    }} />
    {props.children}
  </OutputFile>;
}