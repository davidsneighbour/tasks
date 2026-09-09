import { migrate } from "drizzle-orm/sqlite-proxy/migrator";
import { db, sqlite } from "./client.js";

await migrate(
  db,
  async (queries) => {
    for (const query of queries) {
      sqlite.exec(query);
    }
  },
  { migrationsFolder: "./drizzle" },
);

console.log("Migrations applied.");
