import { googleTasksClient } from "../google/index.js";
import { mapGoogleTaskList, type RemoteTaskListRecord } from "./reconciliation.js";

export async function fetchRemoteTaskLists(): Promise<RemoteTaskListRecord[]> {
  const lists = await googleTasksClient.listTaskLists();
  return lists.map(mapGoogleTaskList);
}
