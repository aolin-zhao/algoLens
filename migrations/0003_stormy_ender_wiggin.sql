CREATE TABLE `content_syncs` (
	`package_id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`hash` text NOT NULL,
	`synced_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `problem_list_items` (
	`list_id` text NOT NULL,
	`problem_id` text NOT NULL,
	`group_name` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`content_package` text,
	PRIMARY KEY(`list_id`, `problem_id`),
	FOREIGN KEY (`list_id`) REFERENCES `problem_lists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `problem_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`source_url` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`content_package` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `problem_lists_slug_unique` ON `problem_lists` (`slug`);--> statement-breakpoint
CREATE TABLE `solution_implementations` (
	`id` text PRIMARY KEY NOT NULL,
	`solution_id` text NOT NULL,
	`language_id` text NOT NULL,
	`mode` text DEFAULT 'core' NOT NULL,
	`code` text NOT NULL,
	`content_package` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`solution_id`) REFERENCES `solutions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `solution_implementation_language_mode` ON `solution_implementations` (`solution_id`,`language_id`,`mode`);--> statement-breakpoint
CREATE TABLE `solutions` (
	`id` text PRIMARY KEY NOT NULL,
	`problem_id` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`explanation` text NOT NULL,
	`time_complexity` text NOT NULL,
	`space_complexity` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`diagram` text,
	`content_package` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `solution_problem_slug` ON `solutions` (`problem_id`,`slug`);--> statement-breakpoint
ALTER TABLE `language_templates` ADD `content_package` text;--> statement-breakpoint
ALTER TABLE `problem_examples` ADD `content_package` text;--> statement-breakpoint
ALTER TABLE `problems` ADD `content_package` text;--> statement-breakpoint
ALTER TABLE `test_cases` ADD `content_package` text;