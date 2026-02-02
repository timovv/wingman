import * as path from "path";
import { pathToFileURL } from "url";
import { readFile } from "fs/promises";
import type { WingmanNode } from "../runtime/component.js";

/**
 * Load entry point from package.json main field.
 */
export async function loadEntry(projectDir: string): Promise<WingmanNode> {
  const pkgPath = path.join(projectDir, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  const main = pkg.main || "dist/index.js";

  const entry = path.join(projectDir, main);
  const module = await import(pathToFileURL(entry).href);

  if (typeof module.default !== "function") return null;

  return module.default({});
}
