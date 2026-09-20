const priorities: Record<string, string> = {
  phishing: "critical", admin_access: "critical", laptop: "high", vpn: "medium", contractor_vpn: "medium",
  contractor_access: "medium", wfh_equipment: "medium", software: "medium", mailbox: "medium", password: "low",
  wifi: "low", printer: "low", expense_tool: "low", unclear: "low",
};

const keywordMap: Record<string, string[]> = {
  password: ["password", "locked out", "can't log in", "cannot log in", "reset my"],
  vpn: ["vpn", "remote access", "expired vpn"],
  laptop: ["laptop", "notebook", "replace my device", "screen flicker", "dead", "won't turn on"],
  wifi: ["guest wifi", "guest wi-fi", "wifi", "wi-fi"],
  software: ["install", "software", "application", "extension", "browser extension"],
  printer: ["printer", "print job", "printing", "paper jam"],
  mailbox: ["mailbox", "inbox full", "email quota", "storage full"],
  wfh_equipment: ["work from home", "wfh", "home office", "monitor for home"],
  phishing: ["phishing", "suspicious link", "suspicious email", "clicked a link", "entered my password"],
  expense_tool: ["expense", "reimbursement tool", "expense software"],
  admin_access: ["admin access", "administrator access", "admin rights", "elevated privileges"],
  contractor_access: ["contractor access", "vendor access"],
};

export function classify(text: string) {
  const lowered = text.toLowerCase();
  const isContractor = ["contractor", "vendor", "consultant", "temp staff", "third-party", "third party"].some(word => lowered.includes(word));
  if (isContractor && lowered.includes("vpn")) return "contractor_vpn";
  if (["admin access", "administrator access", "admin rights", "elevated privileges"].some(phrase => lowered.includes(phrase))) return "admin_access";
  if (isContractor && ["access", "account", "login", "credentials"].some(word => lowered.includes(word))) return "contractor_access";
  const scores = Object.entries(keywordMap).map(([category, keywords]) => [category, keywords.filter(keyword => lowered.includes(keyword)).length] as const).filter(([, score]) => score > 0);
  if (!scores.length) return "unclear";
  return scores.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function base(requestId: string, category: string, action: string, status: string, assignedTo: string | null, reasoning: string, sources: string[] = []) {
  return { requestId, category, action, status, priority: priorities[category] || "medium", assignedTo, reasoning, sources };
}

export function decide(requestId: string, category: string, text: string) {
  const lowered = text.toLowerCase();
  const yearsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|yr)\b/i);
  const years = yearsMatch ? Number(yearsMatch[1]) : null;
  switch (category) {
    case "password": return base(requestId, category, "resolve", "resolved_by_it", "IT Helpdesk", "Password reset follows KB-01. Repeated failed attempts may require identity verification.", ["KB-01"]);
    case "vpn": return base(requestId, category, "resolve", "resolved_self_service", "IT Helpdesk", "VPN renewal follows KB-02. No expiry date has been invented by the agent.", ["KB-02"]);
    case "laptop": {
      const wantsRepair = ["repair", "flicker", "fix"].some(word => lowered.includes(word));
      if (years === null) return base(requestId, category, "ask_followup", "needs_asset_age", null, "Laptop age is required before refresh eligibility can be determined.", ["KB-03", "ASSET-POLICY"]);
      if (wantsRepair && years < 4) return base(requestId, category, "route", "routed_for_diagnostic", "IT Hardware Team", "Device is below the standard refresh threshold and has been routed for diagnostic/repair.", ["KB-03"]);
      return base(requestId, category, "route", "pending_dual_approval", "IT Asset Management", years >= 4 ? "Laptop meets the four-year refresh threshold. Replacement remains routed through the documented IT/Finance process." : "The laptop is below the four-year refresh cycle. Early replacement requires Finance sign-off according to the Asset Management Policy.", ["KB-03", "ASSET-POLICY"]);
    }
    case "wifi": return base(requestId, category, "resolve", "resolved_self_service", "IT Helpdesk", "Guest Wi-Fi follows the self-service path in KB-07.", ["KB-07"]);
    case "software": {
      if (lowered.includes("extension") || lowered.includes("browser")) return base(requestId, category, "route", "pending_security_review", "IT Security Review", "Browser extension requests require review before installation.", ["KB-04"]);
      if (["already", "waiting", "still"].some(word => lowered.includes(word))) return base(requestId, category, "resolve", "in_progress_no_change", "IT Software Approvals", "The software request is already under review, so no duplicate workflow is started.", ["KB-04"]);
      return base(requestId, category, "route", "pending_security_review", "IT Software Approvals", "Non-catalog software is routed for review according to KB-04.", ["KB-04"]);
    }
    case "printer": return base(requestId, category, "resolve", "in_progress_no_change", "IT Helpdesk", "The printer issue is already under investigation; no duplicate workflow is started.", ["KB-05"]);
    case "mailbox": {
      if (lowered.includes("archive") && !lowered.includes("quota")) return base(requestId, category, "resolve", "resolved_self_service", "IT Helpdesk", "The employee explicitly selected the archiving option described by KB-06.", ["KB-06"]);
      if (["increase", "quota", "more space"].some(word => lowered.includes(word))) return base(requestId, category, "route", "pending_manager_approval", "IT Helpdesk", "A mailbox quota increase follows the approval path described by KB-06.", ["KB-06"]);
      return base(requestId, category, "ask_followup", "needs_clarification", null, "The request does not specify whether the employee wants archiving or a quota increase. The agent asks rather than guessing.", ["KB-06"]);
    }
    case "wfh_equipment": return base(requestId, category, "route", "pending_manager_and_finance", "IT Asset Management", "WFH equipment requests follow the approval path in KB-10.", ["KB-10"]);
    case "phishing": return base(requestId, category, "escalate", "escalated_to_security", "Security Team", `Suspected phishing incident escalated to Security according to KB-09.${lowered.includes("forward") ? " Forwarding is specifically flagged for Security review." : ""}`, ["KB-09"]);
    case "expense_tool": return base(requestId, category, "ask_followup", "needs_ownership_clarification", null, "The available source indicates an IT/Finance ownership boundary. More information is requested instead of guessing ownership.", ["KB-08"]);
    case "admin_access": return base(requestId, category, "escalate", "escalated_no_policy_coverage", "Security Team", "The available KB does not authorize the agent to grant administrative access. Urgency does not bypass human security review.", ["TK-1050"]);
    case "contractor_vpn": return base(requestId, category, "route", "pending_manager_approval", "IT Helpdesk", "Contractor VPN requests are routed through the documented manager authorization path.", ["KB-02"]);
    case "contractor_access": return base(requestId, category, "escalate", "escalated_no_policy_coverage", "IT Helpdesk", "The supplied sources do not provide enough policy coverage for generic contractor system access.", []);
    default: return base(requestId, "unclear", "ask_followup", "needs_clarification", null, "The request does not contain enough information to classify or safely act on.", []);
  }
}

export function ticketStatus(decision: { action: string; status: string }) {
  if (decision.action === "escalate") return "ESCALATED";
  if (decision.action === "ask_followup") return "HUMAN_REVIEW";
  if (decision.status.startsWith("resolved")) return "RESOLVED";
  if (decision.status === "in_progress_no_change") return "IN_PROGRESS";
  return "TRIAGED";
}
