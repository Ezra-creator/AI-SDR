import fs from "fs";
import path from "path";
import { executeQuery } from "./db";

/**
 * Runs all SQL migrations in sequence against the connected Neon database.
 */
export async function runMigrations() {
  console.log("\n[Vanguard SDR DB] 🚀 Running database migrations...");

  const migrationsDir = path.join(__dirname, "../migrations");
  if (!fs.existsSync(migrationsDir)) {
    console.warn("[Vanguard SDR DB] No migrations directory found.");
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    console.log(`[Vanguard SDR DB] Applying migration: ${file}...`);
    const sqlContent = fs.readFileSync(filePath, "utf-8");
    await executeQuery(sqlContent);
  }

  console.log("[Vanguard SDR DB] ✅ All schema migrations applied successfully.");
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
