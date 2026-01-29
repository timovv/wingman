# Wingman: a prompt compositor

## High level
- [MDX](https://mdxjs.com/)/JSX and TypeScript based toolkit for developing agent-agnostic prompts, instructions, skills and tools
- Wingman projects can be "installed" into a repository. This process ("composition") composes the JSX/MDX defined components into Markdown files which go in the right places.
	- We would have something set up e.g. in an MCP server to automatically do the 'installation' when the user kicks off an agent session.
- Allows for
	- Composition and reuse of prompts, instructions and tools.
	- Intuitive Markdown syntax plus the power of JSX.
- Multiple output targets: a Wingman project can be composited in different formats, to support Copilot, Claude, Codex, or other agent targets. Output can also vary based on repository-specific configuration provided as input, allowing for tweaks between languages
	- For example, the top-level instructions file will be output to `.github/copilot-instructions.md` for the Copilot target, and to `CLAUDE.md` for Claude Code.
- Idk we can use Alloy or something
## Example
A Wingman project is a JavaScript package. Wingman also provides a CLI which allows a Wingman project to be installed in a repository, e.g.

```bash
wingman install "project-npm-package-name" --target-directory "/path/to/sdk/repo"
```
Or maybe allow a `wingman.json` at the repo top level so you can just call `wingman init`.
### Project folder structure
```
package.json
src/
  dynamic-component.tsx
  index.mdx
  tool.tsx
  skills/
    test-skill/
      index.mdx
  instructions/
    typescript-development.mdx
```
### `src/index.mdx`
The `index.mdx` file is the entry point, and becomes the top level "instructions file" (copilot-instruction).
```markdown

import TypeScriptInstructions from "./instructions/typescript-development.mdx";
import { TestSkill } from "./skills/test-skill";

# My Wingman Project

Global instructions go here, e.g.

- Always follow best practices as described in the [Best Practices Guide](https://example.com).

<TypeScriptInstructions />
<TestSkill />
```
### `src/instructions/typescript-development.mdx`
Contains instructions that only apply to TypeScript files. Controlled by the `<Instructions>` component which has a filter.
```markdown
<Instructions applyTo="*.ts">
  Follow our TypeScript best practices:
  - Avoid classes where possible
  - ...
</Instructions>
```
### `src/skills/test-skill/index.mdx`
Defines a skill e.g. something like
```markdown
<Skill name="test-skill">
  Insert instructions for skill
  
  You can also drop in other components such as tools which will get associated to the skill
</Skill>
```
### `src/dynamic-component.tsx`
You can also define components in TypeScript instead of MDX to allow for dynamic (compose-time) behavior. So, for example, you can emit different instructions depending on the operating system or agent target (e.g. different instructions for Copilot).
```tsx
export const DynamicComponent = () => {
  const context = useCompositor();
  
  if(context.agentName === "claude") {
    return "Providing Claude-specific instructions or a component";
  } else if(context.agentName === "copilot") {
    return "Hello Copilot!"
  }
}
```

### `src/tool.tsx`
Define hooks the agent can call. Tools are not tied to a specific protocol. How tools are defined  is decided by the compositor at compose time. Could be an MCP server; could be a CLI with docs injected into the instructions.
```tsx
function executeTool(args) {
  // do tool thing (at runtime)
}

export const MyTool = () => (
  <Tool
    name="my-tool"
    description="Lets agents do a cool thing"   
    schema={/* zod schema */} invoke={executeTool}
  />
);
```
## Result of installing the example project
#### Command
```bash
# in azure-sdk-for-js directory
wingman install my-project --target-directory="/path/to/azure-sdk-for-js"
```
#### Output (files touched/modified in the repo)
```bash
azure-sdk-for-js/
  .github/
    copilot-instructions.md #top-level instructions
    instructions/
      typescript-development.md #typescript specific instructions w/ filter
    skills/
      test-skill/
        SKILL.md #skill definition
  .vscode/
    mcp.json #mcp.json modified to add Wingman MCP server which defines tools. Might not use MCP in the end, could just make these CLI commands which get docs auto-populated in the composed instructions
```
After installation, your coding agent of choice --Copilot CLI, coding agent, etc.-- will be able to make use of the composited prompts, tools, skills, etc. when working in the repository.