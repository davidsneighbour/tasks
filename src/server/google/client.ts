import { getAuthorizedClient } from "./auth.js";

// Every GT operation must distinguish between these failure kinds (plan.md section 29) so the
// UI can show a clear, honest failure state instead of a silent or generic error.
export type GoogleApiErrorKind = "authentication" | "network" | "rate-limit" | "not-found" | "validation" | "unexpected";

export class GoogleApiError extends Error {
  readonly kind: GoogleApiErrorKind;
  readonly status: number | undefined;
  override readonly cause: unknown;

  constructor(kind: GoogleApiErrorKind, message: string, status?: number, cause?: unknown) {
    super(message);
    this.name = "GoogleApiError";
    this.kind = kind;
    this.status = status;
    this.cause = cause;
  }
}

export function httpStatusForGoogleApiError(error: GoogleApiError): number {
  switch (error.kind) {
    case "authentication":
      return 401;
    case "not-found":
      return 404;
    case "validation":
      return 400;
    case "rate-limit":
      return 429;
    case "network":
    case "unexpected":
      return 502;
  }
}

const TASKS_API_BASE = "https://tasks.googleapis.com/tasks/v1";

// Only this module (and its siblings in google/) talks to Google directly, so API route
// handlers never need to know how OAuth, pagination, or request construction works
// (plan.md sections 30, 47).
export async function googleTasksRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = getAuthorizedClient();

  let accessToken: string;
  try {
    const { token } = await auth.getAccessToken();
    if (!token) {
      throw new GoogleApiError("authentication", "Google did not return an access token.");
    }
    accessToken = token;
  } catch (error) {
    if (error instanceof GoogleApiError) throw error;
    throw new GoogleApiError("authentication", "Failed to obtain a Google access token.", undefined, error);
  }

  let response: Response;
  try {
    response = await fetch(`${TASKS_API_BASE}${path}`, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    throw new GoogleApiError("network", "Could not reach the Google Tasks API.", undefined, error);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");

    if (response.status === 401) {
      throw new GoogleApiError("authentication", "Google rejected the request as unauthenticated.", response.status, body);
    }
    if (response.status === 404) {
      throw new GoogleApiError("not-found", "The requested Google Tasks resource was not found.", response.status, body);
    }
    if (response.status === 400) {
      throw new GoogleApiError("validation", `Google Tasks API rejected the request: ${body}`, response.status, body);
    }
    if (response.status === 429 || /rateLimitExceeded|quotaExceeded|userRateLimitExceeded/.test(body)) {
      throw new GoogleApiError("rate-limit", "Google Tasks API rate or quota limit exceeded.", response.status, body);
    }
    throw new GoogleApiError("unexpected", `Google Tasks API request failed with status ${response.status}.`, response.status, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
