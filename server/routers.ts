import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { getBootstrap, processRequest, updateApproval, updateTicket } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  operations: router({
    bootstrap: publicProcedure.query(() => getBootstrap()),
    process: publicProcedure.input(z.object({ requestId: z.string().min(1), requestText: z.string().min(1).max(4000), employeeName: z.string().optional() })).mutation(({ input }) => processRequest(input.requestId, input.requestText, input.employeeName)),
    approval: publicProcedure.input(z.object({ approvalId: z.string(), action: z.enum(["APPROVED", "REJECTED", "INFO_REQUESTED"]), reviewer: z.string().min(1), notes: z.string().max(1000).default("") })).mutation(({ input }) => updateApproval(input.approvalId, input.action, input.reviewer, input.notes)),
    ticketStatus: publicProcedure.input(z.object({ ticketNumber: z.string(), status: z.enum(["TRIAGED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "ESCALATED", "HUMAN_REVIEW"]), actor: z.string().min(1) })).mutation(({ input }) => updateTicket(input.ticketNumber, input.status, input.actor)),
  }),
});

export type AppRouter = typeof appRouter;
