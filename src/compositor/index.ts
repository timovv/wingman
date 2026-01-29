import { loadEntry } from './loader.js';
import { render, type RenderResult, type RenderMetadata, type OutputFileDef } from './renderer.js';
import type { CompositorContext } from '../runtime/context.js';
import type { WingmanNode, WingmanElement } from '../runtime/component.js';
import { isElement } from '../runtime/component.js';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface CompositorOptions {
  /** Source directory containing the Wingman project */
  sourceDir: string;
  /** Target directory to write output */
  targetDir: string;
  /** Target agent name */
  target?: string;
  /** Additional context options to spread onto the context */
  contextOptions?: Record<string, unknown>;
}

export interface CompositorResult {
  /** Files that were written */
  files: OutputFile[];
  /** The render result */
  renderResult: RenderResult;
}

export interface OutputFile {
  path: string;
  content: string;
}

/**
 * Compose a Wingman project into output files.
 */
export async function compose(options: CompositorOptions): Promise<CompositorResult> {
  const { sourceDir, targetDir, target = 'copilot', contextOptions = {} } = options;

  // Load entry point using package.json main field
  let node = await loadEntry(sourceDir);

  // Resolve Include components (paths relative to install root)
  node = await resolveIncludes(node, targetDir);

  // Create render context with additional options spread onto it
  const context: Partial<CompositorContext> = {
    agentName: target,
    targetDirectory: targetDir,
    ...contextOptions,
  };

  // Render to markdown
  const renderResult = render(node, context);

  // Generate output files based on target
  const files = generateOutputFiles(renderResult, target);

  return { files, renderResult };
}

/**
 * Recursively resolve Include components by loading file content.
 */
async function resolveIncludes(node: WingmanNode, baseDir: string): Promise<WingmanNode> {
  if (node == null || typeof node === 'boolean' || typeof node === 'string' || typeof node === 'number') {
    return node;
  }

  if (Array.isArray(node)) {
    return Promise.all(node.map(n => resolveIncludes(n, baseDir)));
  }

  if (isElement(node)) {
    const element = node as WingmanElement;
    
    // Check if this is an Include component
    if (typeof element.type === 'function' && element.type.name === 'Include') {
      const src = element.props.src as string;
      if (!src) {
        throw new Error('Include component requires a "src" prop');
      }
      
      // Load as raw text
      const filePath = path.join(baseDir, src);
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    }

    // Recursively resolve children
    const resolvedChildren = await Promise.all(
      element.children.map(child => resolveIncludes(child, baseDir))
    );

    return {
      ...element,
      children: resolvedChildren,
    };
  }

  return node;
}

/**
 * Generate output files based on render result and target.
 */
function generateOutputFiles(result: RenderResult, target: string): OutputFile[] {
  const files: OutputFile[] = [];

  if (target === 'copilot') {
    // Main instructions file
    if (result.content) {
      files.push({
        path: '.github/copilot-instructions.md',
        content: result.content + '\n',
      });
    }

    // Process all OutputFile components
    for (const outputFile of result.metadata.outputFiles) {
      files.push({
        path: outputFile.path,
        content: outputFile.content.trim() + '\n',
      });
    }
  }

  return files;
}

/**
 * Write output files to disk.
 */
export async function writeOutput(
  targetDir: string,
  files: OutputFile[],
  dryRun = false
): Promise<void> {
  for (const file of files) {
    const fullPath = path.join(targetDir, file.path);
    const dir = path.dirname(fullPath);

    if (dryRun) {
      console.log(`[dry-run] Would write: ${file.path}`);
      continue;
    }

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, file.content, 'utf-8');
    console.log(`Wrote: ${file.path}`);
  }
}

export type { RenderResult, RenderMetadata };
