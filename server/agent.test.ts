import { describe, expect, it } from "vitest";
import { classify, decide, ticketStatus } from "./agent";

describe("veridian policy agent", () => {
  it("prioritizes admin access over generic installation language", () => {
    expect(classify("I urgently need admin access to install software.")).toBe("admin_access");
  });

  it("creates a security escalation for suspicious links", () => {
    const decision = decide("REQ-08", classify("I clicked a suspicious link."), "I clicked a suspicious link.");
    expect(decision.action).toBe("escalate");
    expect(decision.assignedTo).toBe("Security Team");
    expect(ticketStatus(decision)).toBe("ESCALATED");
  });

  it("asks for clarification when a mailbox request is underspecified", () => {
    const text = "My mailbox is full. Can you fix it?";
    const decision = decide("REQ-09", classify(text), text);
    expect(decision.action).toBe("ask_followup");
    expect(ticketStatus(decision)).toBe("HUMAN_REVIEW");
  });
});
