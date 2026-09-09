CREATE TABLE `sync_state` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status` text DEFAULT 'idle' NOT NULL,
	`last_started_at` text,
	`last_completed_at` text,
	`last_error` text
);
--> statement-breakpoint
CREATE TABLE `task_lists` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gt_id` text NOT NULL,
	`title` text NOT NULL,
	`gt_updated_at` text NOT NULL,
	`synced_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_lists_gt_id_unique` ON `task_lists` (`gt_id`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`gt_id` text NOT NULL,
	`gt_task_list_id` text NOT NULL,
	`gt_parent_id` text,
	`title` text NOT NULL,
	`notes` text,
	`status` text NOT NULL,
	`due` text,
	`completed_at` text,
	`position` text NOT NULL,
	`etag` text NOT NULL,
	`gt_updated_at` text NOT NULL,
	`synced_at` text NOT NULL,
	FOREIGN KEY (`gt_task_list_id`) REFERENCES `task_lists`(`gt_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tasks_gt_id_unique` ON `tasks` (`gt_id`);