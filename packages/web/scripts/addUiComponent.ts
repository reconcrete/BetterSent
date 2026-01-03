import { $, file, write } from "bun";
import { join } from "node:path";
import { mkdir, rename } from "node:fs/promises";

const cwd = join(import.meta.dir, "..");
const uiDir = join(cwd, "src/shared/ui");
const indexPath = join(uiDir, "index.ts");

// Get component name from CLI argument
const componentName = Bun.argv[2];

if (!componentName) {
  console.error("Usage: bun run scripts/addUiComponent.ts <component-name>");
  process.exit(1);
}

// Run shadcn to add the component
console.log(`Adding ${componentName}...`);
await $`bunx --bun shadcn@latest add ${componentName}`.cwd(cwd);

// Capitalize first letter for folder/file name
const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
const sourcePath = join(uiDir, `${componentName}.tsx`);
const targetDir = join(uiDir, capitalizedName);
const targetPath = join(targetDir, `${capitalizedName}.tsx`);

// Check if the source file exists
const sourceFile = file(sourcePath);
if (!(await sourceFile.exists())) {
  console.error(`Source file not found: ${sourcePath}`);
  process.exit(1);
}

// Create target directory and move file
await mkdir(targetDir, { recursive: true });
await rename(sourcePath, targetPath);
console.log(`Moved ${componentName}.tsx → ${capitalizedName}/${capitalizedName}.tsx`);

// Update index.ts with re-export
const exportLine = `export * from "./${capitalizedName}/${capitalizedName}";`;
const indexFile = file(indexPath);
let indexContent = "";

if (await indexFile.exists()) {
  indexContent = await indexFile.text();
  if (!indexContent.includes(exportLine)) {
    indexContent = indexContent.trimEnd() + "\n" + exportLine + "\n";
  }
} else {
  indexContent = exportLine + "\n";
}

await write(indexPath, indexContent);
console.log(`Updated index.ts with export for ${capitalizedName}`);

console.log("Done! ✓");
