# Wingman: a prompt compositor

## High level
- [MDX](https://mdxjs.com/)/JSX and TypeScript based toolkit for developing agent-agnostic prompts, instructions, skills and tools
- Wingman projects can be "installed" into a repository. This process ("composition") composes the JSX/MDX defined components into Markdown files which go in the right places.
	- We could have something set up e.g. in an MCP server to automatically do the 'installation' when the user kicks off an agent session.
- Allows for
	- Composition and reuse of prompts, instructions and tools.
	- Intuitive Markdown syntax plus the power of JSX.
- Multiple output targets: a Wingman project can be installed in different formats, to support Copilot, Claude, Codex, or other agent targets. Output can also vary based on repository-specific configuration provided as input, allowing for tweaks between languages
	- For example, the top-level instructions file will be output to `.github/copilot-instructions.md` for the Copilot target, and to `CLAUDE.md` for Claude Code.

## Example
A Wingman project is a JavaScript package. Wingman provides a CLI which allows a Wingman project to be installed in a repository, e.g.

```bash
wingman install "project-npm-package-name" --target-directory "/path/to/output/repo"
```

An example project is available under the `example/` folder of this repo.

### Example project folder structure
```
package.json
src/
  index.mdx
  language-test-instructions.tsx
  instructions/
    typescript.mdx
```
### `src/index.mdx`
The `index.mdx` file is the entry point, and becomes the top level "instructions file" (copilot-instructions.md).
```mdx
import { Include, Skill, Instructions } from "wingman/components";
import TypescriptInstructions from "./instructions/typescript.js";
import { LanguageSpecificTestInstructions } from "./language-test-instructions.js";

# My Project

Global instructions go here.

- Always follow best practices
- Write clean, maintainable code
- Include tests for new functionality

<Include src="code-review.md" />

<TypescriptInstructions />

<Instructions name="additional-instructions">
  These are more instructions, that go in a separate file.
</Instructions>

<Skill name="test-runner" description="Run and manage tests for the project. Use when the user asks to run tests, check test coverage, or debug failing tests.">
## Test Runner Skill

This skill helps you run and manage tests.

### Usage

When asked to run tests, use the appropriate test command for the project. It is:

<LanguageSpecificTestInstructions />

</Skill>
```
### `src/instructions/typescript.mdx`
Contains instructions that only apply to TypeScript files. Controlled by the `<Instructions>` component which has a filter.
```mdx
import { Instructions } from "wingman/components";

<Instructions applyTo="*.ts" name="typescript">
## TypeScript Guidelines

- Avoid classes where possible, prefer functions
- Use strict TypeScript settings
- Prefer `type` over `interface` for object types

</Instructions>
```
### `src/language-test-instructions.tsx`
You can also define components in TypeScript instead of MDX to allow for dynamic (compose-time) behavior. So, for example, you can emit different instructions depending on the context options passed to the CLI.
```tsx
import { CodeFence } from "wingman/components";
import { useContext } from "wingman";

type LanguageContext = {
  language?: "javascript" | "python";
};

/**
 * A component that renders differing instructions depending on the language
 */
export function LanguageSpecificTestInstructions() {
  const { language = "javascript" } = useContext<LanguageContext>();

  if (language === "javascript") {
    return <CodeFence language="bash">npm test</CodeFence>;
  } else if (language === "python") {
    return <CodeFence language="bash">pytest</CodeFence>;
  }
}
```

The context includes built-in properties like `agentName`, `targetDirectory`, and `platform`, plus any custom options passed via `-o`:
```bash
wingman install my-project -t /path/to/repo -o language=python
```

## Building the CLI and the example project

### CLI

With Node installed, run

```bash
npm install
npm run build

# add wingman CLI to your PATH (optional)
npm install -g
```

in the root of this repository. Then, build the example project in the example/ folder:

```bash
cd ./example
npm install
npm run build
```

Afer building the example project, the example project can be installed to an output directory:

#### Command
```bash
# in the root of this repository
wingman install example/ --target-directory="out/"
```

Making changes to the example project's files will require the project be rebuilt (`npm run build`) before the changes take effect upon installation.

#### Output (files touched/modified in the repo)

This installation will result in the following structure:

```bash
out/
  .github/
    copilot-instructions.md       # top-level instructions (from index.mdx)
    instructions/
      typescript.md               # TypeScript-specific instructions w/ applyTo filter
      additional-instructions.md  # additional instructions from inline <Instructions>
    skills/
      test-runner/
        SKILL.md                  # skill definition
```
After installation, your coding agent of choice - Copilot CLI, coding agent, etc. -  will be able to make use of the composited prompts, tools, skills, etc. when working in the repository.