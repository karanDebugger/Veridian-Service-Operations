CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`approvalId` varchar(32) NOT NULL,
	`ticketNumber` varchar(32) NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'PENDING',
	`requestedBy` varchar(120) NOT NULL,
	`reviewer` varchar(120),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`),
	CONSTRAINT `approvals_approvalId_unique` UNIQUE(`approvalId`)
);
--> statement-breakpoint
CREATE TABLE `auditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(48) NOT NULL,
	`entityType` varchar(48) NOT NULL,
	`entityId` varchar(80) NOT NULL,
	`actor` varchar(120) NOT NULL,
	`detail` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kbArticles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` varchar(48) NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(40) NOT NULL,
	`sourceType` varchar(48) NOT NULL DEFAULT 'grounded-kb',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kbArticles_id` PRIMARY KEY(`id`),
	CONSTRAINT `kbArticles_articleId_unique` UNIQUE(`articleId`)
);
--> statement-breakpoint
CREATE TABLE `serviceRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` varchar(32) NOT NULL,
	`employeeName` varchar(160) NOT NULL,
	`employeeEmail` varchar(320) NOT NULL,
	`requestDate` varchar(32) NOT NULL,
	`requestText` text NOT NULL,
	`initialAction` varchar(80) NOT NULL,
	`category` varchar(40) NOT NULL DEFAULT 'unclear',
	`priority` varchar(20) NOT NULL DEFAULT 'low',
	`decisionAction` varchar(40),
	`decisionStatus` varchar(64),
	`reasoning` text,
	`assignedTo` varchar(120),
	`sources` text,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `serviceRequests_id` PRIMARY KEY(`id`),
	CONSTRAINT `serviceRequests_requestId_unique` UNIQUE(`requestId`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketNumber` varchar(32) NOT NULL,
	`requestId` varchar(32) NOT NULL,
	`category` varchar(40) NOT NULL,
	`summary` text NOT NULL,
	`priority` varchar(20) NOT NULL,
	`status` varchar(32) NOT NULL,
	`assignee` varchar(120),
	`action` varchar(40) NOT NULL,
	`sourceRefs` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `tickets_ticketNumber_unique` UNIQUE(`ticketNumber`)
);
