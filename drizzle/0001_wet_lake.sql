CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(255) NOT NULL,
	`size` integer NOT NULL,
	`folderId` text NOT NULL,
	`uploaded` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
