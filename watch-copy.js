require("dotenv").config();
const chokidar = require("chokidar");
const fs = require("fs-extra");
const path = require("path");

const outputBase = process.env.OUTPUT_BASE;
if (!outputBase) {
  console.error("ERROR: OUTPUT_BASE not set in .env");
  process.exit(1);
}

const behaviorSrc = path.resolve(__dirname, "behavior_packs", "matscraft(BP)");
const resourceSrc = path.resolve(__dirname, "resource_packs", "matscraft(RP)");

const behaviorDest = path.join(
  outputBase,
  "development_behavior_packs",
  "matscraft(BP)"
);
const resourceDest = path.join(
  outputBase,
  "development_resource_packs",
  "matscraft(RP)"
);

// Watch both scripts and pack files
const watcher = chokidar.watch([
  path.join(__dirname, "scripts"),
  path.join(__dirname, "behavior_packs", "matscraft(BP)"),
  path.join(__dirname, "resource_packs", "matscraft(RP)")
], {
  ignoreInitial: true,
  ignored: [
    // Ignore the compiled scripts directory to prevent infinite loops
    path.join(behaviorSrc, "scripts", "**/*")
  ]
});

watcher.on("all", async (event, filePath) => {
  try {
    // If it's a TypeScript file, wait a bit for the compiler to finish
    if (filePath.endsWith('.ts')) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await fs.copy(behaviorSrc, behaviorDest, { overwrite: true });
    await fs.copy(resourceSrc, resourceDest, { overwrite: true });
    console.log(`🔄 Auto-copied packs (triggered by: ${path.basename(filePath)})`);
  } catch (err) {
    console.error("Copy failed:", err);
  }
}); 