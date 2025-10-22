PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(128) NOT NULL,
	`price_monthly` integer NOT NULL,
	`price_yearly` integer NOT NULL,
	`max_storage` integer NOT NULL,
	`max_file_count` integer NOT NULL,
	`credits` integer NOT NULL,
	`stripe_price_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_plans`("id", "name", "price_monthly", "price_yearly", "max_storage", "max_file_count", "credits", "stripe_price_id", "created_at", "updated_at") SELECT "id", "name", "price_monthly", "price_yearly", "max_storage", "max_file_count", "credits", "stripe_price_id", "created_at", "updated_at" FROM `plans`;--> statement-breakpoint
DROP TABLE `plans`;--> statement-breakpoint
ALTER TABLE `__new_plans` RENAME TO `plans`;--> statement-breakpoint
PRAGMA foreign_keys=ON;