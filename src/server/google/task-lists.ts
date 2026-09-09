import { googleTasksRequest } from "./client.js";

export interface GoogleTaskList {
  id: string;
  title: string;
  updated: string;
}

interface TaskListsResponse {
  items?: GoogleTaskList[];
  nextPageToken?: string;
}

// Paginates to completion (plan.md section 20): a sync/list that only read the first page
// would be incorrect.
export async function listTaskLists(): Promise<GoogleTaskList[]> {
  const lists: GoogleTaskList[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ maxResults: "100" });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await googleTasksRequest<TaskListsResponse>(`/users/@me/lists?${params.toString()}`);
    lists.push(...(response.items ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return lists;
}
