require("dotenv").config();
const chokidar = require("chokidar");
const fs = require("fs-extra");
const path = require("path");
// Path settings
const BP_SRC_DIR = path.join("resources/behavior_packs", `${process.env.mod_name}(BP)`);
const BP_DEST_DIR = path.join(
   process.env.output || "",
   "development_behavior_packs",
   process.env.mod_name
);

const RP_SRC_DIR = path.join("resources/resource_packs", `${process.env.mod_name}(RP)`);
const RP_DEST_DIR = path.join(
   process.env.output || "",
   "development_resource_packs",
   process.env.mod_name
);

let timeoutl = null;

// Copy function (from source → destination)
async function copyPack() {
   try {
      await fs.copy(BP_SRC_DIR, BP_DEST_DIR, {
         overwrite: true,
         errorOnExist: false,
      });
      await fs.copy(RP_SRC_DIR, RP_DEST_DIR, {
         overwrite: true,
         errorOnExist: false,
      });
      console.log(`[SYNC] BP: ${BP_SRC_DIR} → ${BP_DEST_DIR}`);
      console.log(`[SYNC] RP: ${RP_SRC_DIR} → ${RP_DEST_DIR}`);
   } catch (err) {
      console.error("[ERROR COPY]", err.message || err);
   }
}

// Debounce to avoid excessive calls
function debounceCopy() {
   if (timeoutl) clearTimeout(timeoutl);
   timeoutl = setTimeout(copyPack, 500);
}

// Watcher
chokidar
   .watch([BP_SRC_DIR, RP_SRC_DIR], {
      ignoreInitial: true,
      awaitWriteFinish: {
         stabilityThreshold: 300,
         pollInterval: 100,
      },
   })
   .on("all", (event, pathChanged) => {
      console.log(`[CHANGED] ${event} → ${pathChanged}`);
      debounceCopy();
   });

// Initial sync
copyPack();
