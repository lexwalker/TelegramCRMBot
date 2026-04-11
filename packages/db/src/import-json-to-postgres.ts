import fs from "node:fs";
import path from "node:path";
import { importDatabaseSnapshot } from "./postgres-store.js";

const importPath = process.env.JSON_IMPORT_PATH
  ? path.resolve(process.cwd(), process.env.JSON_IMPORT_PATH)
  : path.resolve(process.cwd(), "data/db.json");

async function main() {
  if (!fs.existsSync(importPath)) {
    throw new Error(`JSON database file not found: ${importPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(importPath, "utf8"));
  const snapshot = await importDatabaseSnapshot(raw);

  console.log(
    `Imported ${snapshot.organizations.length} organizations, ${snapshot.leads.length} leads, ${snapshot.masters.length} masters, ${snapshot.services.length} services into PostgreSQL.`,
  );
}

main().catch((error) => {
  console.error("Failed to import JSON data into PostgreSQL:", error);
  process.exitCode = 1;
});
