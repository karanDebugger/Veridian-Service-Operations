import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { approvals, auditEvents, kbArticles, serviceRequests, tickets, users, type InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { legacyTicketSeed, kbSeed, requestSeed } from "./seedData";
import { classify, decide, ticketStatus } from "./agent";

let _db: ReturnType<typeof drizzle> | null = null;
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) _db = drizzle(process.env.DATABASE_URL);
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  } else {
    values.lastSignedIn = new Date();
    updateSet.lastSignedIn = values.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function seedBaseData() {
  const db = await getDb();
  if (!db) return;
  for (const [requestId, employeeName, employeeEmail, requestDate, requestText, initialAction] of requestSeed) {
    const existing = (await db.select({ id: serviceRequests.id }).from(serviceRequests).where(eq(serviceRequests.requestId, requestId)).limit(1))[0];
    const values = { employeeName, employeeEmail, requestDate, requestText, initialAction };
    if (existing) await db.update(serviceRequests).set(values).where(eq(serviceRequests.requestId, requestId));
    else await db.insert(serviceRequests).values({ requestId, ...values });
  }
  for (const [articleId, title, content, category] of kbSeed) {
    const existing = (await db.select({ id: kbArticles.id }).from(kbArticles).where(eq(kbArticles.articleId, articleId)).limit(1))[0];
    const values = { title, content, category };
    if (existing) await db.update(kbArticles).set(values).where(eq(kbArticles.articleId, articleId));
    else await db.insert(kbArticles).values({ articleId, ...values });
  }
  for (const [ticketNumber, requestId, category, summary, priority, status, assignee, action, sourceRefs] of legacyTicketSeed) {
    const existing = (await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.ticketNumber, ticketNumber)).limit(1))[0];
    const values = { requestId, category, summary, priority, status, assignee, action, sourceRefs };
    if (existing) await db.update(tickets).set(values).where(eq(tickets.ticketNumber, ticketNumber));
    else await db.insert(tickets).values({ ticketNumber, ...values });
  }
  const audit = await db.select({ id: auditEvents.id }).from(auditEvents).where(eq(auditEvents.entityId, "veridian-it-support")).limit(1);
  if (!audit.length) await db.insert(auditEvents).values({ eventType: "SYSTEM_READY", entityType: "system", entityId: "veridian-it-support", actor: "system", detail: "Seeded and reconciled the Veridian service catalog and operational workspace from the Assignment 2 data pack." });
}

export async function getBootstrap() {
  const db = await getDb();
  if (!db) return { requests: [], tickets: [], approvals: [], audits: [], kb: [], stats: { liveTickets: 0, escalated: 0, pendingApprovals: 0, resolved: 0 }, database: "unavailable" };
  await seedBaseData();
  const [requests, ticketRows, approvalRows, audits, kb] = await Promise.all([
    db.select().from(serviceRequests).orderBy(desc(serviceRequests.createdAt)),
    db.select().from(tickets).orderBy(desc(tickets.updatedAt)),
    db.select().from(approvals).orderBy(desc(approvals.updatedAt)),
    db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(80),
    db.select().from(kbArticles).orderBy(kbArticles.articleId),
  ]);
  return {
    requests, tickets: ticketRows, approvals: approvalRows, audits, kb,
    stats: {
      liveTickets: ticketRows.filter(ticket => ticket.status !== "RESOLVED").length,
      escalated: ticketRows.filter(ticket => ["ESCALATED", "HUMAN_REVIEW"].includes(ticket.status)).length,
      pendingApprovals: approvalRows.filter(approval => approval.status === "PENDING").length,
      resolved: ticketRows.filter(ticket => ticket.status === "RESOLVED").length,
    }, database: "connected",
  };
}

async function nextTicketNumber(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const rows = await db.select({ ticketNumber: tickets.ticketNumber }).from(tickets);
  const max = rows.reduce((highest, row) => Math.max(highest, Number(row.ticketNumber.replace(/\D/g, "")) || 0), 1051);
  return `TK-${max + 1}`;
}

export async function processRequest(requestId: string, requestText: string, employeeName = "Live Agent") {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await seedBaseData();
  const category = classify(requestText);
  const decision = decide(requestId, category, requestText);
  await db.update(serviceRequests).set({ category, priority: decision.priority, decisionAction: decision.action, decisionStatus: decision.status, reasoning: decision.reasoning, assignedTo: decision.assignedTo, sources: decision.sources.join(", "), processedAt: new Date() }).where(eq(serviceRequests.requestId, requestId));
  await db.insert(auditEvents).values([
    { eventType: "REQUEST_RECEIVED", entityType: "request", entityId: requestId, actor: employeeName, detail: requestText },
    { eventType: "CLASSIFIED", entityType: "request", entityId: requestId, actor: "system", detail: category },
    { eventType: "DECISION_MADE", entityType: "request", entityId: requestId, actor: "system", detail: decision.reasoning },
  ]);
  let ticketNumber: string | null = null;
  let approvalId: string | null = null;
  if (decision.action !== "ask_followup") {
    ticketNumber = await nextTicketNumber(db);
    await db.insert(tickets).values({ ticketNumber, requestId, category, summary: requestText.slice(0, 140), priority: decision.priority, status: ticketStatus(decision), assignee: decision.assignedTo, action: decision.action, sourceRefs: decision.sources.join(", ") });
    await db.insert(auditEvents).values({ eventType: "TICKET_CREATED", entityType: "ticket", entityId: ticketNumber, actor: "system", detail: `${decision.action} • ${decision.status}` });
    if (decision.action === "escalate") {
      approvalId = `APR-${Date.now().toString().slice(-8)}`;
      await db.insert(approvals).values({ approvalId, ticketNumber, status: "PENDING", requestedBy: "system" });
      await db.insert(auditEvents).values({ eventType: "APPROVAL_REQUESTED", entityType: "approval", entityId: approvalId, actor: "system", detail: `Approval requested for ${ticketNumber}` });
    }
  }
  return { requestId, category, decision, ticketNumber, approvalId };
}

export async function updateApproval(approvalId: string, action: "APPROVED" | "REJECTED" | "INFO_REQUESTED", reviewer: string, notes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const row = (await db.select().from(approvals).where(eq(approvals.approvalId, approvalId)).limit(1))[0];
  if (!row) throw new Error("Approval not found");
  await db.update(approvals).set({ status: action, reviewer, notes, updatedAt: new Date() }).where(eq(approvals.approvalId, approvalId));
  const nextTicketStatus = action === "APPROVED" ? "IN_PROGRESS" : action === "REJECTED" ? "REJECTED" : "HUMAN_REVIEW";
  await db.update(tickets).set({ status: nextTicketStatus, updatedAt: new Date() }).where(eq(tickets.ticketNumber, row.ticketNumber));
  await db.insert(auditEvents).values({ eventType: action, entityType: "approval", entityId: approvalId, actor: reviewer, detail: notes || `Approval ${action.toLowerCase()}.` });
  return { success: true };
}

export async function updateTicket(ticketNumber: string, status: string, actor: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(tickets).set({ status, updatedAt: new Date() }).where(eq(tickets.ticketNumber, ticketNumber));
  await db.insert(auditEvents).values({ eventType: "STATUS_CHANGED", entityType: "ticket", entityId: ticketNumber, actor, detail: `Ticket moved to ${status}.` });
  return { success: true };
}
