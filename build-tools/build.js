require("dotenv").config();
const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");

async function createMcpack(sourceDir, outputFilePath) {
   const output = fs.createWriteStream(outputFilePath);
   const archive = archiver("zip", {
      zlib: { level: 9 },
   });

   return new Promise((resolve, reject) => {
      output.on("close", () => {
         console.log(`✅ MCpack created at ${outputFilePath} (${archive.pointer()} total bytes)`);
         resolve();
      });

      archive.on("error", reject);

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
   });
}

async function main() {
   const bp = path.resolve(__dirname, `../resources/behavior_packs/${process.env.mod_name}(BP)`);
   const rp = path.resolve(__dirname, `../resources/resource_packs/${process.env.mod_name}(RP)`);
   const outDir = path.resolve(__dirname, "../dist");

   await fs.ensureDir(outDir);

   await createMcpack(bp, path.join(outDir, "matscraft(BP).mcpack"));
   await createMcpack(rp, path.join(outDir, "matscraft(RP).mcpack"));
}

main().catch((err) => {
   console.error("❌ Failed to package mcpack:", err);
   process.exit(1);
});
