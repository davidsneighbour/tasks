CREATE TABLE `default_task_list` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_list_gt_id` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`task_list_gt_id`) REFERENCES `task_lists`(`gt_id`) ON UPDATE no action ON DELETE set null
);
