#!/usr/bin/env node
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/cli.ts
import { program } from "commander";

// src/compositor/loader.ts
import * as path from "path";
import { pathToFileURL } from "url";
import { readFile } from "fs/promises";
async function loadEntry(projectDir) {
  const pkgPath = path.join(projectDir, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  const main = pkg.main || "dist/index.js";
  const entry = path.join(projectDir, main);
  const module = await import(pathToFileURL(entry).href);
  if (typeof module.default !== "function")
    return null;
  return module.default({});
}

// src/runtime/component.ts
function isElement(node) {
  return typeof node === "object" && node !== null && !Array.isArray(node) && "type" in node;
}

// src/runtime/context.ts
var currentContext = null;
function setContext(ctx) {
  currentContext = ctx;
}
function createContext(overrides = {}) {
  return {
    agentName: "copilot",
    targetDirectory: process.cwd(),
    platform: process.platform,
    ...overrides
  };
}

// src/compositor/renderer.ts
function render(node, context) {
  const ctx = createContext(context);
  const metadata = {
    outputFiles: []
  };
  setContext(ctx);
  try {
    const content = renderNode(node, metadata);
    const cleaned = content.replace(/\n{3,}/g, "\n\n").trim();
    return { content: cleaned, metadata };
  } finally {
    setContext(null);
  }
}
function renderNode(node, metadata) {
  if (node == null || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string") {
    if (/^\s+$/.test(node)) {
      return "";
    }
    return node;
  }
  if (typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map((n) => renderNode(n, metadata)).join("");
  }
  if (isElement(node)) {
    return renderElement(node, metadata);
  }
  return "";
}
function renderElement(element, metadata) {
  const { type, props, children } = element;
  if (typeof type === "function") {
    const result = type({ ...props, children });
    if (type.name === "OutputFile" && "path" in props) {
      const fileContent = renderNode(result, metadata);
      metadata.outputFiles.push({
        path: props.path,
        content: fileContent
      });
      return "";
    }
    return renderNode(result, metadata);
  }
  if (typeof type === "string") {
    const childContent = renderNode(children, metadata);
    return `<${type}>${childContent}</${type}>`;
  }
  return "";
}

// src/compositor/index.ts
import * as path2 from "path";
import * as fs from "fs/promises";
async function compose(options) {
  const { sourceDir, targetDir, target = "copilot", contextOptions = {} } = options;
  let node = await loadEntry(sourceDir);
  node = await resolveIncludes(node, targetDir);
  const context = {
    agentName: target,
    targetDirectory: targetDir,
    ...contextOptions
  };
  const renderResult = render(node, context);
  const files = generateOutputFiles(renderResult, target);
  return { files, renderResult };
}
async function resolveIncludes(node, baseDir) {
  if (node == null || typeof node === "boolean" || typeof node === "string" || typeof node === "number") {
    return node;
  }
  if (Array.isArray(node)) {
    return Promise.all(node.map((n) => resolveIncludes(n, baseDir)));
  }
  if (isElement(node)) {
    const element = node;
    if (typeof element.type === "function" && element.type.name === "Include") {
      const src = element.props.src;
      if (!src) {
        throw new Error('Include component requires a "src" prop');
      }
      const filePath = path2.join(baseDir, src);
      const content = await fs.readFile(filePath, "utf-8");
      return content;
    }
    const resolvedChildren = await Promise.all(
      element.children.map((child) => resolveIncludes(child, baseDir))
    );
    return {
      ...element,
      children: resolvedChildren
    };
  }
  return node;
}
function generateOutputFiles(result, target) {
  const files = [];
  if (target === "copilot") {
    if (result.content) {
      files.push({
        path: ".github/copilot-instructions.md",
        content: result.content + "\n"
      });
    }
    for (const outputFile of result.metadata.outputFiles) {
      files.push({
        path: outputFile.path,
        content: outputFile.content.trim() + "\n"
      });
    }
  }
  return files;
}
async function writeOutput(targetDir, files, dryRun = false) {
  for (const file of files) {
    const fullPath = path2.join(targetDir, file.path);
    const dir = path2.dirname(fullPath);
    if (dryRun) {
      console.log(`[dry-run] Would write: ${file.path}`);
      continue;
    }
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, file.content, "utf-8");
    console.log(`Wrote: ${file.path}`);
  }
}

// src/build.ts
import { compile } from "@mdx-js/mdx";
import * as esbuild from "esbuild";
import { readFile as readFile3, writeFile as writeFile2, mkdir as mkdir2, readdir } from "fs/promises";
import * as path3 from "path";
async function findFiles(dir, extensions) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path3.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findFiles(fullPath, extensions));
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}
async function compileMdx(srcPath, distPath) {
  const source = await readFile3(srcPath, "utf-8");
  const compiled = await compile(source, {
    jsxImportSource: "wingman",
    development: false,
    outputFormat: "program"
  });
  const jsPath = distPath.replace(/\.mdx$/, ".js");
  await mkdir2(path3.dirname(jsPath), { recursive: true });
  await writeFile2(jsPath, String(compiled));
}
async function compileTs(srcPath, distPath) {
  const source = await readFile3(srcPath, "utf-8");
  const result = await esbuild.transform(source, {
    loader: srcPath.endsWith(".tsx") ? "tsx" : "ts",
    jsx: "automatic",
    jsxImportSource: "wingman",
    format: "esm",
    target: "es2022"
  });
  const jsPath = distPath.replace(/\.tsx?$/, ".js");
  await mkdir2(path3.dirname(jsPath), { recursive: true });
  await writeFile2(jsPath, result.code);
}
async function build(options) {
  const srcDir = options.srcDir || path3.join(options.projectDir, "src");
  const distDir = options.distDir || path3.join(options.projectDir, "dist");
  const mdxFiles = await findFiles(srcDir, [".mdx"]);
  const tsFiles = await findFiles(srcDir, [".ts", ".tsx"]);
  const compiled = [];
  for (const srcPath of mdxFiles) {
    const relativePath = path3.relative(srcDir, srcPath);
    const distPath = path3.join(distDir, relativePath);
    await compileMdx(srcPath, distPath);
    compiled.push(relativePath.replace(/\.mdx$/, ".js"));
  }
  for (const srcPath of tsFiles) {
    const relativePath = path3.relative(srcDir, srcPath);
    const distPath = path3.join(distDir, relativePath);
    await compileTs(srcPath, distPath);
    compiled.push(relativePath.replace(/\.tsx?$/, ".js"));
  }
  return compiled;
}

// src/cli.ts
import * as path4 from "path";
import * as fs2 from "fs/promises";
program.name("wingman").description("MDX/JSX-based prompt compositor for agent instructions").version("0.1.0");
program.command("build").description("Compile MDX and TSX files in a Wingman project").argument("[directory]", "Project directory", process.cwd()).action(async (directory) => {
  try {
    const projectDir = path4.resolve(directory);
    console.log(`Building: ${projectDir}
`);
    const files = await build({ projectDir });
    for (const file of files) {
      console.log(`Compiled: ${file}`);
    }
    console.log(`
Build complete! (${files.length} files)`);
  } catch (error) {
    console.error("Build failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
});
program.command("install").description("Install a Wingman project into a repository").argument("<source>", "Source path or npm package name").option("-t, --target-directory <path>", "Target repository directory", process.cwd()).option("--target <agent>", "Target agent (copilot, claude)", "copilot").option("--dry-run", "Preview output without writing files").option("-o, --option <key=value...>", "Additional context options (can be specified multiple times)").action(async (source, options) => {
  try {
    const sourceDir = await resolveSource(source);
    const contextOptions = {};
    if (options.option) {
      for (const opt of options.option) {
        const eqIndex = opt.indexOf("=");
        if (eqIndex === -1) {
          throw new Error(`Invalid option format: "${opt}". Expected key=value`);
        }
        const key = opt.slice(0, eqIndex);
        const value = opt.slice(eqIndex + 1);
        contextOptions[key] = value;
      }
    }
    console.log(`Composing from: ${sourceDir}`);
    console.log(`Target directory: ${options.targetDirectory}`);
    console.log(`Target agent: ${options.target}`);
    const result = await compose({
      sourceDir,
      targetDir: options.targetDirectory,
      target: options.target,
      contextOptions
    });
    console.log(`
Generated ${result.files.length} file(s):`);
    await writeOutput(options.targetDirectory, result.files, options.dryRun);
    if (!options.dryRun) {
      console.log("\nDone!");
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
});
async function resolveSource(source) {
  const localPath = path4.resolve(source);
  try {
    const stat2 = await fs2.stat(localPath);
    if (stat2.isDirectory()) {
      return localPath;
    }
  } catch {
  }
  try {
    const packagePath = __require.resolve(`${source}/package.json`, {
      paths: [process.cwd()]
    });
    return path4.dirname(packagePath);
  } catch {
    throw new Error(
      `Could not resolve source: "${source}". Provide a local path or installed npm package name.`
    );
  }
}
program.parse();
