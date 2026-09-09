CREATE TABLE `task_stars` (
	`task_gt_id` text PRIMARY KEY NOT NULL,
	`star` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`task_gt_id`) REFERENCES `tasks`(`gt_id`) ON UPDATE no action ON DELETE cascade
);
