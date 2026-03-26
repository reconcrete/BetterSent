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
const componentFolderPath = path.join(uiPath, pageName);

// Create all directories
fs.mkdirSync(componentFolderPath, { recursive: true });

// Create index.tsx in page folder
const pageIndexTemplate = `export * from "./ui";
`;

fs.writeFileSync(path.join(pageFolderPath, "index.tsx"), pageIndexTemplate);

// Create ui/index.tsx
const uiIndexTemplate = `export * from "./${pageName}/${pageName}";
`;

fs.writeFileSync(path.join(uiPath, "index.tsx"), uiIndexTemplate);

// Create ui/{pageName}/{pageName}.tsx
const componentTemplate = `import type { FC } from "react";

export const ${pageName}: FC = () => {
  return (
    <div>
      <h1>${pageName} Page</h1>
    </div>
  );
};
`;

fs.writeFileSync(path.join(componentFolderPath, `${pageName}.tsx`), componentTemplate);

console.log(`Created page ${pageName} with the following structure:`);
console.log(`- pages/${folderName}/index.tsx`);
console.log(`- pages/${folderName}/ui/index.tsx`);
console.log(`- pages/${folderName}/ui/${pageName}/${pageName}.tsx`);
