import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const serviceRequests = mysqlTable("serviceRequests", {
  id: int("id").autoincrement().primaryKey(),
  requestId: varchar("requestId", { length: 32 }).notNull().unique(),
  employeeName: varchar("employeeName", { length: 160 }).notNull(),
  employeeEmail: varchar("employeeEmail", { length: 320 }).notNull(),
  requestDate: varchar("requestDate", { length: 32 }).notNull(),
  requestText: text("requestText").notNull(),
  initialAction: varchar("initialAction", { length: 80 }).notNull(),
  category: varchar("category", { length: 40 }).notNull().default("unclear"),
  priority: varchar("priority", { length: 20 }).notNull().default("low"),
  decisionAction: varchar("decisionAction", { length: 40 }),
  decisionStatus: varchar("decisionStatus", { length: 64 }),
  reasoning: text("reasoning"),
  assignedTo: varchar("assignedTo", { length: 120 }),
  sources: text("sources"),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketNumber: varchar("ticketNumber", { length: 32 }).notNull().unique(),
  requestId: varchar("requestId", { length: 32 }).notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  summary: text("summary").notNull(),
  priority: varchar("priority", { length: 20 }).notNull(),
  status: varchar("status", { length: 32 }).notNull(),
  assignee: varchar("assignee", { length: 120 }),
  action: varchar("action", { length: 40 }).notNull(),
  sourceRefs: text("sourceRefs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  approvalId: varchar("approvalId", { length: 32 }).notNull().unique(),
  ticketNumber: varchar("ticketNumber", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("PENDING"),
  requestedBy: varchar("requestedBy", { length: 120 }).notNull(),
  reviewer: varchar("reviewer", { length: 120 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const auditEvents = mysqlTable("auditEvents", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 48 }).notNull(),
  entityType: varchar("entityType", { length: 48 }).notNull(),
  entityId: varchar("entityId", { length: 80 }).notNull(),
  actor: varchar("actor", { length: 120 }).notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const kbArticles = mysqlTable("kbArticles", {
  id: int("id").autoincrement().primaryKey(),
  articleId: varchar("articleId", { length: 48 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  sourceType: varchar("sourceType", { length: 48 }).notNull().default("grounded-kb"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type KbArticle = typeof kbArticles.$inferSelect;
