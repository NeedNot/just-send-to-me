ALTER TABLE `plans` ADD `price_id_monthly` text;--> statement-breakpoint
ALTER TABLE `plans` ADD `price_id_yearly` text;--> statement-breakpoint
ALTER TABLE `plans` DROP COLUMN `price_monthly`;--> statement-breakpoint
ALTER TABLE `plans` DROP COLUMN `price_yearly`;