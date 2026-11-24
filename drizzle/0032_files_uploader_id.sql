ALTER TABLE `files` ADD `uploader_id` text;--> statement-breakpoint
CREATE INDEX `files_folder_uploader_idx` ON `files` (`folderId`,`uploader_id`);