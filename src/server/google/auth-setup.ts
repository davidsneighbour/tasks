import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { OAuth2Client } from "google-auth-library";
import { config } from "../config/env.js";
import { TASKS_SCOPE } from "./auth.js";

// The sole purpose of this script is obtaining and storing GOOGLE_REFRESH_TOKEN
// (plan.md section 5). It is a one-off local setup command, not part of the running app.

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is missing. Copy .env.example to .env and configure it before running auth:setup.`);
  }
  return value;
}

async function waitForAuthorizationCode(redirectUrl: URL): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", redirectUrl.origin);
      if (url.pathname !== redirectUrl.pathname) {
        res.writeHead(404).end();
        return;
      }

      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(error ? `Authorization failed: ${error}. You can close this tab.` : "Authorization complete. You can close this tab.");

      server.close();

      if (error) {
        reject(new Error(`Google returned an authorization error: ${error}`));
      } else if (!code) {
        reject(new Error("Google's redirect did not include an authorization code."));
      } else {
        resolve(code);
      }
    });

    server.on("error", reject);
    server.listen(Number(redirectUrl.port) || 80, redirectUrl.hostname);
  });
}

function updateEnvFile(key: string, value: string): void {
  const path = ".env";
  const line = `${key}=${value}`;

  if (!existsSync(path)) {
    writeFileSync(path, `${line}\n`);
    return;
  }

  const content = readFileSync(path, "utf8");
  const pattern = new RegExp(`^${key}=.*$`, "m");
  writeFileSync(path, pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`);
}

async function main() {
  const clientId = requireEnv("GOOGLE_CLIENT_ID", config.google.clientId);
  const clientSecret = requireEnv("GOOGLE_CLIENT_SECRET", config.google.clientSecret);
  const redirectUri = requireEnv("GOOGLE_REDIRECT_URI", config.google.redirectUri);
  const redirectUrl = new URL(redirectUri);

  const client = new OAuth2Client({ clientId, clientSecret, redirectUri });

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [TASKS_SCOPE],
  });

  console.log("Open this URL in a browser and sign in with the Google account T should use:\n");
  console.log(authUrl);
  console.log(`\nWaiting for the redirect to ${redirectUri} ...`);

  const code = await waitForAuthorizationCode(redirectUrl);
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token) {
    console.error(
      "\nGoogle did not return a refresh token. This usually means T already has a stored " +
        "grant for this account. Revoke it at https://myaccount.google.com/permissions and run " +
        "auth:setup again so Google is forced to issue a new refresh token.",
    );
    process.exitCode = 1;
    return;
  }

  updateEnvFile("GOOGLE_REFRESH_TOKEN", tokens.refresh_token);
  console.log("\nSaved GOOGLE_REFRESH_TOKEN to .env. T can now authenticate with Google Tasks.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
