import { OutputFile } from "wingman/components";
import { useContext } from "wingman";

type LanguageContext = {
  language?: "javascript" | "python";
}

export function LanguageSpecificTestInstructions() {
  const { language = "javascript" } = useContext<LanguageContext>();

  if(language === "javascript") {
    return (<>
      ```bash
      npm run test
      ````
    </>);
  } else if(language === "python") {
    return (<>
      ```bash
      pytest
      ```
    </>);
  }
}