import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "config/database.ts",
  "config/server.ts",
  "src/components/vehicle/spec.json",
  "src/components/seo/meta.json",
  "src/api/vehicle/content-types/vehicle/schema.json",
  "src/api/vehicle-category/content-types/vehicle-category/schema.json",
  "src/api/booking/content-types/booking/schema.json",
  "src/api/ticket-type/content-types/ticket-type/schema.json",
  "src/api/quote-request/content-types/quote-request/schema.json",
  "src/api/restaurant-reservation/content-types/restaurant-reservation/schema.json",
  "src/api/member-request/content-types/member-request/schema.json",
];

const walk = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
};

for (const file of requiredFiles) {
  await fs.access(path.join(root, file));
}

const jsonFiles = (await walk(root)).filter((file) => file.endsWith(".json"));

for (const file of jsonFiles) {
  JSON.parse(await fs.readFile(file, "utf8"));
}

console.log(`Content model looks valid. Checked ${jsonFiles.length} JSON files.`);
