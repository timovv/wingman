import { useContext } from "../runtime/context.js";
import { OutputFile } from "./OutputFile.js";

export interface PluginProps {
  name?: string;
  description?: string;
  version?: string;
  author?: {
    name?: string;
  }
}

export const Plugin = (props: PluginProps) => {
  const { agentName } = useContext();

  if(agentName === "claude-plugin") {
    return <OutputFile path={`.claude-plugin/plugin.json`}>
      {JSON.stringify(props)}
    </OutputFile>
  }

  return '';
}