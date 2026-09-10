import { db } from "../db/client.js";
import { taskLists } from "../db/schema.js";
import { createLabel, listLabels, setTaskLabels } from "../labels/label-service.js";
import { getEffectiveDefaultTaskList } from "../task-lists/default-task-list-service.js";
import { CliError, parseDueDate, parseInput } from "./cli-add-parser.js";
import { createTask } from "./task-service.js";

// Local quick-capture CLI (issue #17): `npm run task:add -- "title @due #list !label"`.
// Unknown labels are created on the fly; an unknown list errors (lists are GT-owned - the
// app doesn't create them) rather than filing the task into the wrong place.

async function resolveTaskList(listToken: string | undefined): Promise<{ gtId: string; title: string }> {
  if (listToken === undefined) {
    const effectiveDefault = await getEffectiveDefaultTaskList();
    if (!effectiveDefault) {
      throw new CliError("No #list given, and no task list is available. Run a sync first, or pass #listname.");
    }
    return effectiveDefault;
  }

  const allLists = await db.select().from(taskLists);
  const matches = allLists.filter((list) => list.title.toLowerCase() === listToken.toLowerCase());

  if (matches.length === 0) {
    const names = allLists.map((list) => list.title).join(", ") || "(none synced yet)";
    throw new CliError(`No task list named "${listToken}". Available lists: ${names}.`);
  }
  if (matches.length > 1) {
    throw new CliError(`Multiple task lists are named "${listToken}"; rename one to disambiguate.`);
  }
  return matches[0]!;
}

// Unknown labels are created on the fly with neutral defaults (per the resolved clarification
// on #17) - this is a quick-capture tool, not a place to interrupt the flow for label setup.
async function resolveLabelIds(labelNames: string[]): Promise<{ id: number; name: string }[]> {
  const existing = await listLabels();
  const resolved: { id: number; name: string }[] = [];

  for (const name of labelNames) {
    const match = existing.find((label) => label.name.toLowerCase() === name.toLowerCase());
    if (match) {
      resolved.push(match);
    } else {
      const created = await createLabel({ name, colour: "gray", icon: "tag" });
      existing.push(created);
      resolved.push(created);
    }
  }

  return resolved;
}

async function main(): Promise<void> {
  const raw = process.argv.slice(2).join(" ");
  if (!raw.trim()) {
    console.error('Usage: npm run task:add -- "title @due #list !label"');
    process.exitCode = 1;
    return;
  }

  const parsed = parseInput(raw);
  const list = await resolveTaskList(parsed.listToken);
  const due = parsed.dueToken !== undefined ? `${parseDueDate(parsed.dueToken, new Date())}T00:00:00.000Z` : undefined;
  const labels = await resolveLabelIds(parsed.labelNames);

  const task = await createTask({ taskListGtId: list.gtId, title: parsed.title, ...(due !== undefined && { due }) });
  const appliedLabels = labels.length > 0 ? await setTaskLabels(task.gtId, labels.map((label) => label.id)) : [];

  const dueNote = task.due ? ` (due ${task.due.slice(0, 10)})` : "";
  const labelNote = appliedLabels.length > 0 ? ` [${appliedLabels.map((label) => label.name).join(", ")}]` : "";
  console.log(`Created "${task.title}" in ${list.title}${dueNote}${labelNote}.`);
}

main().catch((error: unknown) => {
  if (error instanceof CliError) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
