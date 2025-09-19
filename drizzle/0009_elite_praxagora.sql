CREATE TABLE `user_metadata` (
	`user_id` text NOT NULL,
	`downloads` integer DEFAULT 0 NOT NULL,
	`folders_created` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
