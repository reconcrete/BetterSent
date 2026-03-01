import fs from "node:fs";
import path from "node:path";

const widgetName = process.argv[2];

if (!widgetName) {
  console.error("Usage: bun run scripts/createWidget.ts <WidgetName>");
  process.exit(1);
}

const cwd = path.join(import.meta.dir, "..");
const widgetsDir = path.join(cwd, "src/widgets");

// Use lowercase first letter for folder name
const folderName = widgetName.charAt(0).toLowerCase() + widgetName.slice(1);
const widgetFolderPath = path.join(widgetsDir, folderName);
const uiPath = path.join(widgetFolderPath, "ui");
const componentFolderPath = path.join(uiPath, widgetName);

// Create all directories
fs.mkdirSync(componentFolderPath, { recursive: true });

// Create index.tsx in widget folder
const widgetIndexTemplate = `export * from "./ui";
`;

fs.writeFileSync(path.join(widgetFolderPath, "index.tsx"), widgetIndexTemplate);

// Create ui/index.tsx
const uiIndexTemplate = `export * from "./${widgetName}/${widgetName}";
`;

fs.writeFileSync(path.join(uiPath, "index.tsx"), uiIndexTemplate);

// Create ui/{widgetName}/{widgetName}.tsx
const componentTemplate = `import type { FC } from "react";

interface ${widgetName}Props {
  // Add props here
}

export const ${widgetName}: FC<${widgetName}Props> = () => {
  return (
    <div>
      <h1>${widgetName} Widget</h1>
    </div>
  );
};
`;

fs.writeFileSync(path.join(componentFolderPath, `${widgetName}.tsx`), componentTemplate);

console.log(`Created widget ${widgetName} with the following structure:`);
console.log(`- widgets/${folderName}/index.tsx`);
console.log(`- widgets/${folderName}/ui/index.tsx`);
console.log(`- widgets/${folderName}/ui/${widgetName}/${widgetName}.tsx`);
