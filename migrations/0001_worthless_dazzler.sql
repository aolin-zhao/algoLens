DROP INDEX `template_problem_language`;--> statement-breakpoint
ALTER TABLE `language_templates` ADD `mode` text DEFAULT 'main' NOT NULL;--> statement-breakpoint
ALTER TABLE `language_templates` ADD `invocation` text;--> statement-breakpoint
CREATE UNIQUE INDEX `template_problem_language_mode` ON `language_templates` (`problem_id`,`language_id`,`mode`);--> statement-breakpoint
DROP INDEX `saved_code_user_problem_language`;--> statement-breakpoint
ALTER TABLE `saved_codes` ADD `mode` text DEFAULT 'main' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `saved_code_user_problem_language_mode` ON `saved_codes` (`user_id`,`problem_id`,`language_id`,`mode`);