CREATE TABLE `task_list_order` (
	`task_list_gt_id` text PRIMARY KEY NOT NULL,
	`position` integer NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`task_list_gt_id`) REFERENCES `task_lists`(`gt_id`) ON UPDATE no action ON DELETE cascade
);
