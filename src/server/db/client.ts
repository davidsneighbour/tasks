import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import { config } from "../config/env.js";
import * as schema from "./schema.js";

const dir = dirname(config.database.url);
if (dir && dir !== "." && !existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

// Uses Node's built-in node:sqlite (stable since Node 22) instead of better-sqlite3, so no
// native addon needs to be compiled for the host or container Node version.
export const sqlite = new DatabaseSync(config.database.url);
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");

export const db = drizzle(async (sql, params, method) => {
  const statement = sqlite.prepare(sql);

  if (method === "run") {
    statement.run(...params);
    return { rows: [] };
  }

  if (method === "get") {
    const row = statement.get(...params);
    return { rows: row ? [Object.values(row)] : [] };
  }

  const rows = statement.all(...params) as Record<string, unknown>[];
  return { rows: rows.map((row) => Object.values(row)) };
}, { schema });
