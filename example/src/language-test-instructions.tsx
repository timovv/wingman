import { CodeFence } from "wingman/components";
import { useContext } from "wingman";

type LanguageContext = {
  language?: "javascript" | "python";
};

/**
 * A component that renders differing instructions depending on the language
 * @returns 
 */
export function LanguageSpecificTestInstructions() {
  const { language = "javascript" } = useContext<LanguageContext>();

  if (language === "javascript") {
    return <CodeFence language="bash">npm test</CodeFence>;
  } else if (language === "python") {
    return <CodeFence language="bash">pytest</CodeFence>;
  }
}
