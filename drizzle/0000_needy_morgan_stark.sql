CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(128) NOT NULL,
	`maxSize` integer NOT NULL,
	`expiresAt` integer NOT NULL,
	`deletesAt` integer NOT NULL,
	`creatorId` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
