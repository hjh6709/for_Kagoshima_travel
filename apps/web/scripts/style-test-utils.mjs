import { readFileSync } from "node:fs";

const stylesDirectory = new URL("../src/styles/", import.meta.url);
const localImportPattern = /@import\s+["']\.\/([^"']+)["'];/g;

export function readStyleEntry(fileName, stack = []) {
  if (stack.includes(fileName)) {
    throw new Error(`순환 CSS import: ${[...stack, fileName].join(" -> ")}`);
  }

  const css = readFileSync(new URL(fileName, stylesDirectory), "utf8");
  return css.replace(localImportPattern, (_statement, importedFile) =>
    readStyleEntry(importedFile, [...stack, fileName]),
  );
}
