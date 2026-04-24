const fs = require("fs");
const path = require("path");

const dir = path.resolve(__dirname, "../src/app/api");

function processDir(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (file === "route.ts" || file === "route.tsx" || file === "route.js" || file === "route.jsx") {
      let content = fs.readFileSync(fullPath, "utf-8");
      if (!content.includes("export const runtime = \"edge\";") && !content.includes("export const runtime = 'edge';")) {
        content = `export const runtime = "edge";\n${content}`;
        fs.writeFileSync(fullPath, content, "utf-8");
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(dir);
console.log("Done adding edge runtime to API routes.");
