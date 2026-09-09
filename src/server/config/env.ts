import { config as loadDotenv } from "dotenv";
import { z } from "zod";

// Loads .env for local dev/CLI use; a no-op (with a suppressed "file not found" warning) in
// Docker, where compose's env_file already populates process.env directly.
loadDotenv({ quiet: true });

// .env.example ships these as blank until `npm run auth:setup` fills them in, so
// treat an empty string the same as "unset" rather than failing validation.
const optionalNonEmpty = z
  .string()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const envSchema = z.object({
  GOOGLE_CLIENT_ID: optionalNonEmpty,
  GOOGLE_CLIENT_SECRET: optionalNonEmpty,
  GOOGLE_REFRESH_TOKEN: optionalNonEmpty,
  GOOGLE_REDIRECT_URI: optionalNonEmpty,
  DATABASE_URL: z.string().min(1).default("./data/tasks.sqlite"),
  PORT: z.coerce.number().int().positive().default(3000),
  // Only "0.0.0.0" inside the container, where compose's 127.0.0.1:3000:3000 port
  // publish is what actually restricts host-level exposure (plan.md section 4).
  HOST: z.string().min(1).default("127.0.0.1"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
    throw new Error(
      `Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and configure Google Tasks OAuth credentials.`,
    );
  }

  return parsed.data;
}

const env = loadEnv();

export const config = {
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    refreshToken: env.GOOGLE_REFRESH_TOKEN,
    redirectUri: env.GOOGLE_REDIRECT_URI,
  },
  database: {
    url: env.DATABASE_URL,
  },
  server: {
    port: env.PORT,
    host: env.HOST,
  },
} as const;

export function hasGoogleCredentials(): boolean {
  return Boolean(config.google.clientId && config.google.clientSecret && config.google.refreshToken);
}
