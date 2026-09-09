import { defineConfig } from "drizzle-kit";
import { config } from "./src/server/config/env.js";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: config.database.url,
  },
});
