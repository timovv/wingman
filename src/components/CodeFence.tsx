import { WingmanNode } from "wingman/jsx-runtime";

const CODE_FENCE_DELIMITER = "```";

export interface CodeFenceProps {
  language?: string;
  children?: WingmanNode;
}

export function CodeFence(props: CodeFenceProps) {
  return (
    `${CODE_FENCE_DELIMITER}${props.language ?? ""}\n` +
    `${props.children ?? ""}\n` +
    `${CODE_FENCE_DELIMITER}\n`
  );
}
