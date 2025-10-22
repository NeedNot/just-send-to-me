PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_files` (
	`id` text PRIMARY KEY NOT NULL,
	`folderId` text NOT NULL,
	`name` text(255) NOT NULL,
	`key` text NOT NULL,
	`size` integer NOT NULL,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_files`("id", "folderId", "name", "key", "size", "createdAt") SELECT "id", "folderId", "name", "key", "size", "createdAt" FROM `files`;--> statement-breakpoint
DROP TABLE `files`;--> statement-breakpoint
ALTER TABLE `__new_files` RENAME TO `files`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(128) NOT NULL,
	`maxSize` integer NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`fileCount` integer DEFAULT 0 NOT NULL,
	`filesDeleted` integer DEFAULT false NOT NULL,
	`expiresAt` integer NOT NULL,
	`creatorId` text NOT NULL,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`credit_cost` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`creatorId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_folders`("id", "name", "maxSize", "size", "fileCount", "filesDeleted", "expiresAt", "creatorId", "createdAt", "credit_cost") SELECT "id", "name", "maxSize", "size", "fileCount", "filesDeleted", "expiresAt", "creatorId", "createdAt", "credit_cost" FROM `folders`;--> statement-breakpoint
DROP TABLE `folders`;--> statement-breakpoint
ALTER TABLE `__new_folders` RENAME TO `folders`;--> statement-breakpoint
CREATE TABLE `__new_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(128) NOT NULL,
	`price_monthly` integer NOT NULL,
	`price_yearly` integer NOT NULL,
	`max_storage` integer NOT NULL,
	`max_folder_count` integer NOT NULL,
	`max_file_count` integer NOT NULL,
	`stripe_price_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_plans`("id", "name", "price_monthly", "price_yearly", "max_storage", "max_folder_count", "max_file_count", "stripe_price_id", "created_at", "updated_at") SELECT "id", "name", "price_monthly", "price_yearly", "max_storage", "max_folder_count", "max_file_count", "stripe_price_id", "created_at", "updated_at" FROM `plans`;--> statement-breakpoint
DROP TABLE `plans`;--> statement-breakpoint
ALTER TABLE `__new_plans` RENAME TO `plans`;--> statement-breakpoint
CREATE TABLE `__new_user_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`planId` text NOT NULL,
	`status` text NOT NULL,
	`stripe_subscription_id` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`cancel_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`planId`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_user_subscriptions`("id", "userId", "planId", "status", "stripe_subscription_id", "start", "end", "cancel_at", "created_at", "updated_at") SELECT "id", "userId", "planId", "status", "stripe_subscription_id", "start", "end", "cancel_at", "created_at", "updated_at" FROM `user_subscriptions`;--> statement-breakpoint
DROP TABLE `user_subscriptions`;--> statement-breakpoint
ALTER TABLE `__new_user_subscriptions` RENAME TO `user_subscriptions`;