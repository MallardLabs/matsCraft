const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Baca environment variables
const {
  proyek_name,
  proyek_version,
  proyek_uuid,
  script_uuid,
  description,
  authors,
} = process.env;

// Validasi environment variables
if (!proyek_name || !proyek_version || !proyek_uuid || !script_uuid) {
  console.error(
    "❌ Environment variables tidak lengkap! Pastikan .env file sudah diisi dengan benar."
  );
  process.exit(1);
}

// Parse version string ke array
const versionArray = proyek_version.split(".").map((v) => parseInt(v));
if (versionArray.length !== 3 || versionArray.some((v) => isNaN(v))) {
  console.error(
    '❌ Format proyek_version harus berupa "major.minor.patch" (contoh: 1.0.0)'
  );
  process.exit(1);
}

// Parse authors string ke array
const authorsArray = authors ? authors.split(",").map((a) => a.trim()) : [];

// Template manifest.json
const manifest = {
  format_version: 2,
  header: {
    name: proyek_name,
    description: description || `${proyek_name} Behavior Pack`,
    uuid: proyek_uuid,
    version: versionArray,
    min_engine_version: [1, 16, 0],
  },
  metadata: {
    authors: authorsArray,
    generated_with: {
      typescript_starter: ["1.0.0"],
    },
  },
  modules: [
    {
      description: "Behavior",
      version: [1, 0, 0],
      uuid: "e39eb06c-a8e0-46c2-a1f9-358e1196d02b",
      type: "data",
    },
    {
      type: "script",
      uuid: script_uuid,
      version: [1, 0, 0],
      entry: "scripts/main.js",
    },
  ],
  dependencies: [
    {
      module_name: "@minecraft/server",
      version: "1.16.0",
    },
    {
      module_name: "@minecraft/server-ui",
      version: "1.3.0",
    },
    {
      module_name: "@minecraft/server-net",
      version: "1.0.0-beta",
    },
  ],
};

// Buat direktori behaviour_pack jika belum ada
const behaviorPackDir = path.join(process.cwd(), "behaviour_pack", proyek_name);
if (!fs.existsSync(behaviorPackDir)) {
  fs.mkdirSync(behaviorPackDir, { recursive: true });
}

// Tulis manifest.json
const manifestPath = path.join(behaviorPackDir, "manifest.json");
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`✅ manifest.json berhasil dibuat di ${manifestPath}`);
console.log(`📦 Proyek: ${proyek_name}`);
console.log(`🔖 Versi: ${proyek_version}`);
console.log(`📝 Deskripsi: ${description}`);
console.log(`👤 Authors: ${authorsArray.join(", ")}`);
