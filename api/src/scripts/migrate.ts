import "dotenv/config";
import { sql, db } from "../db/client.js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  // Ensure pgcrypto for gen_random_uuid()
  await sql.unsafe("CREATE EXTENSION IF NOT EXISTS pgcrypto");
  console.log("[migrate] pgcrypto ensured");

  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] complete");

  await sql.end();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
