require("dotenv").config();
const fs = require("fs-extra");
const path = require("path");

const outputBase = process.env.output;
if (!outputBase) {
  console.error("ERROR: OUTPUT_BASE not set in .env");
  process.exit(1);
}

const behaviorSrc = path.resolve(
  __dirname,
  "../behavior_packs",
  process.env.mod_name
);
const resourceSrc = path.resolve(
  __dirname,
  "resource_packs",
  process.env.mod_name
);

const behaviorDest = path.join(
  outputBase,
  "development_behavior_packs",
  process.env.mod_name
);
const resourceDest = path.join(
  outputBase,
  "development_resource_packs",
  process.env.mod_name
);

async function copyAll() {
  try {
    await fs.copy(behaviorSrc, behaviorDest, { overwrite: true });
    console.log(`Copied behavior pack to ${behaviorDest}`);

    await fs.copy(resourceSrc, resourceDest, { overwrite: true });
    console.log(`Copied resource pack to ${resourceDest}`);
  } catch (err) {
    console.error("Copy failed:", err);
  }
}

copyAll();
