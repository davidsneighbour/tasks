import { googleTasksClient } from "../google/index.js";
import { mapGoogleTask, type RemoteTaskRecord } from "./reconciliation.js";

export async function fetchRemoteTasks(taskListGtIds: string[]): Promise<RemoteTaskRecord[]> {
  const records: RemoteTaskRecord[] = [];

  for (const taskListGtId of taskListGtIds) {
    const tasks = await googleTasksClient.listTasks(taskListGtId);
    for (const task of tasks) {
      const record = mapGoogleTask(taskListGtId, task);
      if (record) {
        records.push(record);
      }
    }
  }

  return records;
}
