import fs from "node:fs";
import path from "node:path";

const featureName = process.argv[2];

if (!featureName) {
  console.error("Usage: bun run scripts/createFeature.ts <FeatureName>");
  process.exit(1);
}

const cwd = path.join(import.meta.dir, "..");
const featuresDir = path.join(cwd, "src/features");

// Use lowercase first letter for folder name
const folderName = featureName.charAt(0).toLowerCase() + featureName.slice(1);
const featureFolderPath = path.join(featuresDir, folderName);
const uiPath = path.join(featureFolderPath, "ui");
const componentFolderPath = path.join(uiPath, featureName);

// Create all directories
fs.mkdirSync(componentFolderPath, { recursive: true });

// Create index.tsx in feature folder
const featureIndexTemplate = `export * from "./ui";
`;

fs.writeFileSync(path.join(featureFolderPath, "index.tsx"), featureIndexTemplate);

// Create ui/index.tsx
const uiIndexTemplate = `export * from "./${featureName}/${featureName}";
`;

fs.writeFileSync(path.join(uiPath, "index.tsx"), uiIndexTemplate);

// Create ui/{featureName}/{featureName}.tsx
const componentTemplate = `import type { FC } from "react";

interface ${featureName}Props {
  // Add props here
}

export const ${featureName}: FC<${featureName}Props> = () => {
  return (
    <div>
      <h1>${featureName} Feature</h1>
    </div>
  );
};
`;

fs.writeFileSync(path.join(componentFolderPath, `${featureName}.tsx`), componentTemplate);

console.log(`Created feature ${featureName} with the following structure:`);
console.log(`- features/${folderName}/index.tsx`);
console.log(`- features/${folderName}/ui/index.tsx`);
console.log(`- features/${folderName}/ui/${featureName}/${featureName}.tsx`);
