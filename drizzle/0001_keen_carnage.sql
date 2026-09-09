CREATE TABLE `labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`colour` text NOT NULL,
	`icon` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task_labels` (
	`task_gt_id` text NOT NULL,
	`label_id` integer NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`task_gt_id`, `label_id`),
	FOREIGN KEY (`task_gt_id`) REFERENCES `tasks`(`gt_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE cascade
);
