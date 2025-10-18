PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(128) NOT NULL,
	`maxSize` integer NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`fileCount` integer DEFAULT 0 NOT NULL,
	`filesDeleted` integer DEFAULT false NOT NULL,
	`expiresAt` integer NOT NULL,
	`creatorId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`effectiveQuotaTill` integer DEFAULT '"2025-11-17T03:14:20.233Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_folders`("id", "name", "maxSize", "size", "fileCount", "filesDeleted", "expiresAt", "creatorId", "createdAt", "effectiveQuotaTill") SELECT "id", "name", "maxSize", "size", "fileCount", "filesDeleted", "expiresAt", "creatorId", "createdAt", "effectiveQuotaTill" FROM `folders`;--> statement-breakpoint
DROP TABLE `folders`;--> statement-breakpoint
ALTER TABLE `__new_folders` RENAME TO `folders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `user` ADD `plan_id` text;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `account_usage_response`;