PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_files` (
	`id` text PRIMARY KEY NOT NULL,
	`folderId` text NOT NULL,
	`name` text(255) NOT NULL,
	`key` text NOT NULL,
	`size` integer NOT NULL,
	`uploaded` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`folderId`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_files`("id", "folderId", "name", "key", "size", "uploaded", "createdAt") SELECT "id", "folderId", "name", "key", "size", "uploaded", "createdAt" FROM `files`;--> statement-breakpoint
DROP TABLE `files`;--> statement-breakpoint
ALTER TABLE `__new_files` RENAME TO `files`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `folders` DROP COLUMN `deletesAt`;