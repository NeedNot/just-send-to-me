CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`current_period_start` integer,
	`current_period_end` integer,
	`last_renewal` integer,
	`status` text NOT NULL,
	FOREIGN KEY (`id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP TABLE `customer`;