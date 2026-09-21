const priorities: Record<string, string> = {
  phishing: "critical", admin_access: "critical", laptop: "high", vpn: "medium", contractor_vpn: "medium",
  wfh_equipment: "medium", software: "medium", mailbox: "medium", printer: "low", password: "low",
  wifi: "low", expense_tool: "low", unclear: "low", asset_management: "medium",
};

const keywordMap: Record<string, string[]> = {
  password: ["password", "locked out", "can't log in", "cannot log in", "reset my", "account"],
  vpn: ["vpn", "remote access", "expired vpn", "credentials expired"],
  laptop: ["laptop", "notebook", "replace my device", "screen flicker", "flicker", "dead", "won't turn on"],
  wifi: ["guest wifi", "guest wi-fi", "wifi", "wi-fi"],
  software: ["install", "software", "application", "extension", "browser extension", "catalog"],
  printer: ["printer", "print job", "printing", "paper jam", "spooler"],
  mailbox: ["mailbox", "inbox full", "email quota", "storage full", "send emails"],
  wfh_equipment: ["work from home", "wfh", "home office", "monitor for home", "chair"],
  phishing: ["phishing", "suspicious link", "suspicious email", "clicked a link", "entered my password", "malware", "unauthorized access"],
  expense_tool: ["expense", "reimbursement tool", "expense software", "expense management"],
  admin_access: ["admin access", "administrator access", "admin rights", "elevated privileges"],
};

export function classify(text: string) {
  const lowered = text.toLowerCase();
  const isContractor = ["contractor", "vendor", "consultant", "temp staff", "third-party", "third party"].some(word => lowered.includes(word));
  if (isContractor && lowered.includes("vpn")) return "contractor_vpn";
  if (["admin access", "administrator access", "admin rights", "elevated privileges"].some(phrase => lowered.includes(phrase))) return "admin_access";
  const scores = Object.entries(keywordMap)
    .map(([category, keywords]) => [category, keywords.filter(keyword => lowered.includes(keyword)).length] as const)
    .filter(([, score]) => score > 0);
  if (!scores.length) return "unclear";
  return scores.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function base(requestId: string, category: string, action: string, status: string, assignedTo: string | null, reasoning: string, sources: string[] = []) {
  return { requestId, category, action, status, priority: priorities[category] || "medium", assignedTo, reasoning, sources };
}

export function decide(requestId: string, category: string, text: string) {
  const lowered = text.toLowerCase();
  const yearsMatch = text.match(/(\d+(?:\.\d+)?)\s*[- ]?\s*(?:years?|yrs?|yr)\b/i);
  const years = yearsMatch ? Number(yearsMatch[1]) : null;
  const gbMatch = text.match(/(\d+)\s*gb/i);
  const requestedGb = gbMatch ? Number(gbMatch[1]) : null;

  switch (category) {
    case "password":
      if (/\b(?:[5-9]|\d{2,})\s*(?:failed attempts?|tries|times)\b/i.test(text) || lowered.includes("6 times")) {
        return base(requestId, category, "resolve", "manual_unlock_required", "IT Helpdesk", "After more than five failed attempts, IT must unlock the account manually. No approval is required; identity verification may be needed.", ["KB-01"]);
      }
      return base(requestId, category, "resolve", "resolved_self_service", "IT Helpdesk", "The employee can reset their own password through the self-service portal. No approval is required.", ["KB-01"]);

    case "vpn":
      return base(requestId, category, "resolve", "resolved_self_service", "IT Helpdesk", "Full-time employees receive VPN access automatically and renew credentials themselves every 90 days. No approval is required.", ["KB-02"]);

    case "contractor_vpn":
      return base(requestId, category, "route", "pending_manager_approval", "IT Helpdesk", "Contractor VPN access requires manager approval submitted through the access request form.", ["KB-02"]);

    case "laptop": {
      const wantsRepair = ["repair", "flicker", "flickering", "fix"].some(word => lowered.includes(word));
      const suspectedFailure = ["dead", "won't turn on", "wont turn on", "hardware failure"].some(word => lowered.includes(word));
      if (suspectedFailure) {
        return base(requestId, category, "route", "pending_hardware_verification", "IT Hardware Team", "The device may have a hardware failure. IT must verify the failure; replacement can be considered earlier than the normal lifecycle when verified. The 4-year refresh policy and Finance sign-off apply to early replacement.", ["KB-03", "ASSET-POLICY"]);
      }
      if (years === null) return base(requestId, category, "ask_followup", "needs_asset_age", null, "Laptop age and the intended replacement date are required. Requests should be raised at least two weeks in advance.", ["KB-03", "ASSET-POLICY"]);
      if (wantsRepair && years < 3) return base(requestId, category, "route", "routed_for_diagnostic", "IT Hardware Team", "The laptop is under three years old and the request describes a repair issue. IT should diagnose the device before replacement is considered.", ["KB-03"]);
      if (years >= 3) return base(requestId, category, "route", "pending_it_finance_fulfillment", "IT Asset Management", "The laptop is eligible for replacement after three years. The request should be raised at least two weeks in advance; the standard four-year refresh cycle and Finance sign-off still govern early replacement outside that cycle.", ["KB-03", "ASSET-POLICY"]);
      return base(requestId, category, "route", "pending_finance_signoff", "IT Asset Management", "The laptop is under three years old. Replacement requires verified hardware failure or Finance sign-off in addition to IT approval.", ["KB-03", "ASSET-POLICY"]);
    }

    case "wifi":
      return base(requestId, category, "resolve", "resolved_self_service", "Front Desk Kiosk", "Any employee can generate guest Wi-Fi credentials at the front-desk kiosk. Credentials are valid for 24 hours and no IT ticket is required.", ["KB-07"]);

    case "software": {
      const isNonCatalog = lowered.includes("non-catalog") || lowered.includes("not in the software catalog") || lowered.includes("not in the catalog") || lowered.includes("browser extension");
      const isCatalog = lowered.includes("standard software") || lowered.includes("approved catalog") || lowered.includes("catalog software");
      if (isCatalog && !isNonCatalog) return base(requestId, category, "resolve", "resolved_self_service", "Employee", "Standard software listed in the approved catalog can be self-installed.", ["KB-04"]);
      if (["already", "waiting", "still"].some(word => lowered.includes(word))) return base(requestId, category, "route", "pending_security_review", "IT Security Review", "The existing non-catalog software request remains with IT Security. Review takes 3–5 business days; no duplicate workflow is created.", ["KB-04"]);
      return base(requestId, category, "route", "pending_security_review", "IT Security Review", "Non-catalog software and browser extensions require IT Security review before installation. Review takes 3–5 business days.", ["KB-04"]);
    }

    case "printer":
      return base(requestId, category, "route", "troubleshoot_then_ticket", "IT Helpdesk", "First check the printer queue and restart the print spooler. If the issue persists, log a ticket with the printer asset tag.", ["KB-05"]);

    case "mailbox":
      if (lowered.includes("archive")) return base(requestId, category, "resolve", "resolved_self_service", "Employee", "The default mailbox quota is 25GB; archiving old mail is the self-service remedy when nearing quota.", ["KB-06"]);
      if (requestedGb !== null && requestedGb > 50) return base(requestId, category, "ask_followup", "quota_limit_exceeded", "IT Helpdesk", "Quota increases require manager approval and are capped at 50GB. The requested amount exceeds the documented cap.", ["KB-06"]);
      if (["increase", "quota", "more space", "35gb", "40gb", "50gb"].some(word => lowered.includes(word))) return base(requestId, category, "route", "pending_manager_approval", "IT Helpdesk", "The default mailbox quota is 25GB. Increases beyond 25GB require manager approval and cannot exceed 50GB.", ["KB-06"]);
      return base(requestId, category, "ask_followup", "needs_clarification", "IT Helpdesk", "The default quota is 25GB. The employee should archive old mail or specify that they are requesting a quota increase; increases beyond 25GB require manager approval and are capped at 50GB.", ["KB-06"]);

    case "wfh_equipment":
      return base(requestId, category, "route", "pending_manager_and_finance", "Finance", "Employees working remotely more than three days per week are eligible for a one-time home-office allowance for a chair or monitor. Manager sign-off and Finance processing are required; IT handles shipping only after approval.", ["KB-10"]);

    case "phishing":
      return base(requestId, category, "escalate", "escalated_to_security", "Security Team", "Report suspected phishing, malware, or unauthorized access immediately to security@veridian-corp.example. Do not forward the message to other employees; the incident is escalated to Security.", ["KB-09"]);

    case "expense_tool":
      return base(requestId, category, "route", "finance_ownership_check", "Finance", "Access to the expense management tool is granted by Finance, not IT. IT can assist with login or technical issues once an account already exists; Finance ownership should be confirmed.", ["KB-08"]);

    case "admin_access":
      return base(requestId, category, "escalate", "escalated_no_policy_coverage", "Security Team", "The supplied policies do not authorize the agent to grant administrative access. Urgency does not bypass human Security review, so the request is escalated rather than approved.", ["KB-09"]);

    default:
      return base(requestId, "unclear", "ask_followup", "needs_clarification", null, "The request does not contain enough information to classify or safely act on.", []);
  }
}

export function ticketStatus(decision: { action: string; status: string }) {
  if (decision.action === "escalate") return "ESCALATED";
  if (decision.action === "ask_followup") return "HUMAN_REVIEW";
  if (decision.status.startsWith("resolved")) return "RESOLVED";
  if (["troubleshoot_then_ticket", "in_progress_no_change"].includes(decision.status)) return "IN_PROGRESS";
  return "TRIAGED";
}
