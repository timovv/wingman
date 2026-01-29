import { compile } from '@mdx-js/mdx';
import * as esbuild from 'esbuild';
import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import * as path from 'path';

export interface BuildOptions {
  /** Project root directory */
  projectDir: string;
  /** Source directory (default: src/) */
  srcDir?: string;
  /** Output directory (default: dist/) */
  distDir?: string;
}

/**
 * Find all files with given extensions recursively.
 */
async function findFiles(dir: string, extensions: string[]): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findFiles(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Compile an MDX file to JS.
 */
async function compileMdx(srcPath: string, distPath: string): Promise<void> {
  const source = await readFile(srcPath, 'utf-8');
  const compiled = await compile(source, {
    jsxImportSource: 'wingman',
    development: false,
    outputFormat: 'program',
  });
  
  const jsPath = distPath.replace(/\.mdx$/, '.js');
  await mkdir(path.dirname(jsPath), { recursive: true });
  await writeFile(jsPath, String(compiled));
}

/**
 * Compile a TS/TSX file to JS.
 */
async function compileTs(srcPath: string, distPath: string): Promise<void> {
  const source = await readFile(srcPath, 'utf-8');
  const result = await esbuild.transform(source, {
    loader: srcPath.endsWith('.tsx') ? 'tsx' : 'ts',
    jsx: 'automatic',
    jsxImportSource: 'wingman',
    format: 'esm',
    target: 'es2022',
  });
  
  const jsPath = distPath.replace(/\.tsx?$/, '.js');
  await mkdir(path.dirname(jsPath), { recursive: true });
  await writeFile(jsPath, result.code);
}

/**
 * Build a Wingman project.
 */
export async function build(options: BuildOptions): Promise<string[]> {
  const srcDir = options.srcDir || path.join(options.projectDir, 'src');
  const distDir = options.distDir || path.join(options.projectDir, 'dist');
  
  const mdxFiles = await findFiles(srcDir, ['.mdx']);
  const tsFiles = await findFiles(srcDir, ['.ts', '.tsx']);
  const compiled: string[] = [];
  
  for (const srcPath of mdxFiles) {
    const relativePath = path.relative(srcDir, srcPath);
    const distPath = path.join(distDir, relativePath);
    await compileMdx(srcPath, distPath);
    compiled.push(relativePath.replace(/\.mdx$/, '.js'));
  }
  
  for (const srcPath of tsFiles) {
    const relativePath = path.relative(srcDir, srcPath);
    const distPath = path.join(distDir, relativePath);
    await compileTs(srcPath, distPath);
    compiled.push(relativePath.replace(/\.tsx?$/, '.js'));
  }
  
  return compiled;
}
