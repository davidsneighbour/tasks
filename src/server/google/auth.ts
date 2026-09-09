import { OAuth2Client } from "google-auth-library";
import { config } from "../config/env.js";

export const TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";

export class MissingGoogleCredentialsError extends Error {
  constructor() {
    super(
      "Google OAuth credentials are missing. Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET " +
        "and GOOGLE_REDIRECT_URI in .env, then run `npm run auth:setup` to obtain a refresh token.",
    );
    this.name = "MissingGoogleCredentialsError";
  }
}

export function createOAuth2Client(): OAuth2Client {
  const { clientId, clientSecret, redirectUri } = config.google;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new MissingGoogleCredentialsError();
  }
  return new OAuth2Client({ clientId, clientSecret, redirectUri });
}

let cachedClient: OAuth2Client | undefined;

// The server owns authentication end-to-end (plan.md section 5); nothing here is ever sent
// to the browser.
export function getAuthorizedClient(): OAuth2Client {
  if (!config.google.refreshToken) {
    throw new MissingGoogleCredentialsError();
  }

  if (!cachedClient) {
    cachedClient = createOAuth2Client();
    cachedClient.setCredentials({ refresh_token: config.google.refreshToken });
  }

  return cachedClient;
}
