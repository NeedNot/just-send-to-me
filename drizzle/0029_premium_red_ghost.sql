ALTER TABLE `subscriptions` ADD `customer_id` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_customer_id_unique` ON `subscriptions` (`customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_user_id_unique` ON `subscriptions` (`user_id`);