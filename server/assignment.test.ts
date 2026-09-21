import { describe, expect, it } from "vitest";
import { classify, decide, ticketStatus } from "./agent";
import { legacyTicketSeed, kbSeed, requestSeed } from "./seedData";

describe("Assignment 2 data pack fidelity", () => {
  it("contains all fifteen exact request IDs and eleven grounded source articles", () => {
    expect(requestSeed).toHaveLength(15);
    expect(requestSeed.map(row => row[0])).toEqual(Array.from({ length: 15 }, (_, index) => `REQ-${String(index + 1).padStart(2, "0")}`));
    expect(requestSeed[0][2]).toBe("aditi.sharma@veridian-corp.example");
    expect(kbSeed.map(row => row[0])).toEqual(["KB-01", "KB-02", "KB-03", "KB-04", "KB-05", "KB-06", "KB-07", "KB-08", "KB-09", "KB-10", "ASSET-POLICY"]);
  });

  it("contains every PDF ticket from TK-1042 through TK-1051", () => {
    expect(legacyTicketSeed).toHaveLength(10);
    expect(legacyTicketSeed.map(row => row[0])).toEqual(Array.from({ length: 10 }, (_, index) => `TK-${1042 + index}`));
    expect(legacyTicketSeed.find(row => row[0] === "TK-1050")?.[5]).toBe("REJECTED");
    expect(legacyTicketSeed.find(row => row[0] === "TK-1051")?.[2]).toBe("wifi");
  });
});

describe("Assignment 2 grounded policy behavior", () => {
  it("manually unlocks accounts after more than five failed attempts", () => {
    const decision = decide("REQ-03", classify("I'm locked out after 6 failed attempts."), "I'm locked out after 6 failed attempts.");
    expect(decision.status).toBe("manual_unlock_required");
    expect(decision.action).toBe("resolve");
    expect(decision.sources).toEqual(["KB-01"]);
  });

  it("distinguishes employee VPN renewal from contractor approval", () => {
    const employee = decide("REQ-05", classify("My VPN credentials expired after 90 days."), "My VPN credentials expired after 90 days.");
    const contractor = decide("REQ-11", classify("A contractor needs VPN access."), "A contractor needs VPN access.");
    expect(employee.status).toBe("resolved_self_service");
    expect(employee.reasoning).toContain("90 days");
    expect(contractor.status).toBe("pending_manager_approval");
  });

  it("applies the three-year laptop rule and early-failure safeguard", () => {
    const eligible = decide("REQ-01", classify("My laptop is 3.5 years old and needs replacement."), "My laptop is 3.5 years old and needs replacement.");
    const repair = decide("REQ-13", classify("My 2-year-old laptop screen is flickering and needs repair."), "My 2-year-old laptop screen is flickering and needs repair.");
    expect(eligible.status).toBe("pending_it_finance_fulfillment");
    expect(eligible.sources).toEqual(["KB-03", "ASSET-POLICY"]);
    expect(repair.status).toBe("routed_for_diagnostic");
  });

  it("keeps catalog software self-service and routes non-catalog software to security", () => {
    const catalog = decide("REQ-X", classify("Please install standard software from the approved catalog."), "Please install standard software from the approved catalog.");
    const nonCatalog = decide("REQ-04", classify("I need approval for non-catalog software."), "I need approval for non-catalog software.");
    expect(catalog.status).toBe("resolved_self_service");
    expect(nonCatalog.status).toBe("pending_security_review");
    expect(nonCatalog.reasoning).toContain("3–5 business days");
  });

  it("gives the required printer, mailbox, Wi-Fi, WFH, expense, and phishing instructions", () => {
    const printer = decide("REQ-06", classify("The printer still jams after restarting the spooler."), "The printer still jams after restarting the spooler.");
    const mailbox = decide("REQ-09", classify("My mailbox is full and I cannot send emails."), "My mailbox is full and I cannot send emails.");
    const wifi = decide("REQ-02", classify("I need guest Wi-Fi for a visitor."), "I need guest Wi-Fi for a visitor.");
    const wfh = decide("REQ-07", classify("I work from home 4 days per week and need a monitor."), "I work from home 4 days per week and need a monitor.");
    const expense = decide("REQ-12", classify("I cannot log into the expense tool."), "I cannot log into the expense tool.");
    const phishing = decide("REQ-08", classify("I received a phishing email and forwarded it."), "I received a phishing email and forwarded it.");
    expect(printer.reasoning).toContain("asset tag");
    expect(mailbox.reasoning).toContain("25GB");
    expect(wifi.reasoning).toContain("24 hours");
    expect(wfh.reasoning).toContain("more than three days");
    expect(expense.assignedTo).toBe("Finance");
    expect(phishing.reasoning).toContain("security@veridian-corp.example");
    expect(ticketStatus(phishing)).toBe("ESCALATED");
  });
});
