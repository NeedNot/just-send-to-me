CREATE TABLE `customer` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`subscription_id` text,
	`subscription_status` text,
	`plan_id` text,
	`current_period_end` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE no action
);
