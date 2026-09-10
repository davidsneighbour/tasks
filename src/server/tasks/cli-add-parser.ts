import * as chrono from "chrono-node";
import { addDays, toDateString } from "../views/date.js";

// Pure parsing logic for the quick-capture CLI (issue #17), split out from cli-add.ts (which
// also does DB/GT I/O) so it can be unit tested the same way views/date.ts is.

export class CliError extends Error {}

export interface ParsedInput {
  title: string;
  dueToken: string | undefined;
  listToken: string | undefined;
  labelNames: string[];
}

// `@`, `#`, and `!` tokens are recognised anywhere in the string; everything else joins the
// title in the order given.
export function parseInput(raw: string): ParsedInput {
  const titleWords: string[] = [];
  const labelNames: string[] = [];
  let dueToken: string | undefined;
  let listToken: string | undefined;

  for (const token of raw.trim().split(/\s+/).filter(Boolean)) {
    if (token.length > 1 && token.startsWith("@")) {
      if (dueToken !== undefined) throw new CliError(`Multiple due-date tokens given ("@${dueToken}" and "${token}"); only one is allowed.`);
      dueToken = token.slice(1);
    } else if (token.length > 1 && token.startsWith("#")) {
      if (listToken !== undefined) throw new CliError(`Multiple list tokens given ("#${listToken}" and "${token}"); only one is allowed.`);
      listToken = token.slice(1);
    } else if (token.length > 1 && token.startsWith("!")) {
      labelNames.push(token.slice(1));
    } else {
      titleWords.push(token);
    }
  }

  const title = titleWords.join(" ").trim();
  if (!title) throw new CliError("No task title given.");

  return { title, dueToken, listToken, labelNames };
}

const RELATIVE_SHORTHAND = /^\+(\d+)([dwmy])$/i;
const UNIT_TO_DAYS: Record<string, number> = { d: 1, w: 7, m: 30, y: 365 };

// Tries strict formats first (YYYYMMDD, then YYYY-MM-DD - month before day per the resolved
// clarification on #17), then the `+N[dwmy]` shorthand, then falls back to chrono-node for
// single-word natural language (`tomorrow`, `friday`, ...). Each `@token` is one whitespace-
// delimited word, so multi-word written dates aren't supported by this input format.
export function parseDueDate(token: string, now: Date): string {
  if (/^\d{8}$/.test(token)) {
    return `${token.slice(0, 4)}-${token.slice(4, 6)}-${token.slice(6, 8)}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(token)) {
    return token;
  }

  const shorthand = RELATIVE_SHORTHAND.exec(token);
  if (shorthand) {
    const [, amount, unit] = shorthand;
    if (amount !== undefined && unit !== undefined) {
      const days = Number(amount) * UNIT_TO_DAYS[unit.toLowerCase()]!;
      return addDays(toDateString(now), days);
    }
  }

  const parsed = chrono.parseDate(token, now, { forwardDate: true });
  if (!parsed) throw new CliError(`Could not parse due date "@${token}". Try YYYYMMDD, YYYY-MM-DD, +7d/+2w, or a word like "tomorrow".`);
  return toDateString(parsed);
}
