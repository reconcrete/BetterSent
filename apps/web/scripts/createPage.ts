import fs from "node:fs";
import path from "node:path";

const pageName = process.argv[2];

if (!pageName) {
  console.error("Usage: bun run scripts/createPage.ts <PageName>");
  process.exit(1);
}

const cwd = path.join(import.meta.dir, "..");
const pagesDir = path.join(cwd, "src/pages");

// Use lowercase first letter for folder name
const folderName = pageName.charAt(0).toLowerCase() + pageName.slice(1);
const pageFolderPath = path.join(pagesDir, folderName);
const uiPath = path.join(pageFolderPath, "ui");

// Create all directories
fs.mkdirSync(uiPath, { recursive: true });

// Create index.ts in page folder
const pageIndexTemplate = `export { ${pageName} } from "./ui/${pageName}";
`;

fs.writeFileSync(path.join(pageFolderPath, "index.ts"), pageIndexTemplate);

// Create ui/{pageName}.tsx
const componentTemplate = `import type { FC } from "react";

export const ${pageName}: FC = () => {
  return (
    <div>
      <h1>${pageName} Page</h1>
    </div>
  );
};
`;

fs.writeFileSync(path.join(uiPath, `${pageName}.tsx`), componentTemplate);

console.log(`Created page ${pageName} with the following structure:`);
console.log(`- pages/${folderName}/index.ts`);
console.log(`- pages/${folderName}/ui/${pageName}.tsx`);
