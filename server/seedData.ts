export const requestSeed = [
  ["REQ-01", "Aditi Sharma", "aditi.sharma@veridian.example", "2026-09-21", "My laptop is dead and won't turn on. It's about 3.5 years old and I need a replacement urgently.", "escalate_to_it"],
  ["REQ-02", "Vikram Chawla", "vikram.chawla@veridian.example", "2026-09-21", "Can I get guest wifi access for a visitor?", "self_service"],
  ["REQ-03", "Karan Mehta", "karan.mehta@veridian.example", "2026-09-21", "I'm locked out of my account. I've tried logging in 6 times.", "reset_password"],
  ["REQ-04", "Ritu Bhatia", "ritu.bhatia@veridian.example", "2026-09-22", "I requested non-catalog software and I'm still waiting for approval.", "check_status"],
  ["REQ-05", "Sanjay Oberoi", "sanjay.oberoi@veridian.example", "2026-09-22", "My VPN access has expired and I can't connect remotely.", "renew_vpn"],
  ["REQ-06", "Meera Iyer", "meera.iyer@veridian.example", "2026-09-22", "The printer keeps jamming and IT is already investigating it.", "monitor"],
  ["REQ-07", "Farhan Ali", "farhan.ali@veridian.example", "2026-09-23", "I work from home 4 days a week and need a monitor.", "route_for_approval"],
  ["REQ-08", "Ananya Reddy", "ananya.reddy@veridian.example", "2026-09-23", "I got a suspicious email with a link, clicked it, and forwarded it to teammates to warn them.", "escalate_security"],
  ["REQ-09", "Rohit Desai", "rohit.desai@veridian.example", "2026-09-23", "My mailbox is full. Can you fix it?", "unclear"],
  ["REQ-10", "Kavya Pillai", "kavya.pillai@veridian.example", "2026-09-24", "I urgently need admin access to install software.", "escalate"],
  ["REQ-11", "Nikhil Bansal", "nikhil.bansal@veridian.example", "2026-09-24", "I'm a contractor and need VPN access.", "route_for_approval"],
  ["REQ-12", "Sneha Kulkarni", "sneha.kulkarni@veridian.example", "2026-09-24", "I can't log into the expense reimbursement tool and don't know whether this is IT or Finance.", "unclear"],
  ["REQ-13", "Aman Gupta", "aman.gupta@veridian.example", "2026-09-25", "My laptop screen is flickering. It's 2 years old and I want it repaired.", "route_for_diagnostic"],
  ["REQ-14", "Tanya Chopra", "tanya.chopra@veridian.example", "2026-09-25", "I need approval to install a browser extension for work.", "route_for_approval"],
  ["REQ-15", "Rahul Menon", "rahul.menon@veridian.example", "2026-09-25", "hey can you help, its not working", "unclear"],
] as const;

export const kbSeed = [
  ["KB-01", "Password Reset", "Employees locked out of their account may use the password reset process. Repeated failed attempts may require IT Helpdesk assistance and identity verification.", "password"],
  ["KB-02", "VPN Renewal", "VPN renewal follows the documented access renewal path. The agent does not invent expiry dates or bypass authorization.", "vpn"],
  ["KB-03", "Laptop Lifecycle", "Company laptops follow a four-year refresh cycle. Early replacement requires Finance sign-off; devices below the threshold route to diagnostics.", "laptop"],
  ["KB-04", "Software Review", "Non-catalog software and browser extensions require review before installation. Existing requests should not create duplicate workflows.", "software"],
  ["KB-05", "Printer Troubleshooting", "Standard printer troubleshooting applies. Issues already under investigation remain in progress without a duplicate ticket.", "printer"],
  ["KB-06", "Mailbox Capacity", "Employees can archive mail for self-service. Quota increases follow a manager approval path; ambiguous requests require clarification.", "mailbox"],
  ["KB-07", "Guest Wi-Fi", "Guest Wi-Fi requests follow the self-service path with no elevated employee entitlement.", "wifi"],
  ["KB-08", "Expense Tool Ownership", "Expense reimbursement issues may sit at the IT/Finance ownership boundary; ask for clarification rather than guessing.", "expense_tool"],
  ["KB-09", "Phishing Incident", "Suspected phishing incidents are escalated to the Security Team for review.", "phishing"],
  ["KB-10", "WFH Equipment", "WFH equipment requests follow the documented manager and Finance approval path.", "wfh_equipment"],
] as const;

export const legacyTicketSeed = [
  ["TK-1042", "REQ-03", "password", "Password reset", "low", "RESOLVED", "IT Helpdesk", "resolve", "KB-01"],
  ["TK-1043", "REQ-01", "laptop", "Laptop replacement request", "high", "ESCALATED", "IT Asset Management", "route", "KB-03, ASSET-POLICY"],
  ["TK-1044", "REQ-14", "software", "Browser extension approval", "medium", "HUMAN_REVIEW", "IT Security Review", "route", "KB-04"],
  ["TK-1050", "REQ-10", "admin_access", "Urgent administrative access", "critical", "ESCALATED", "Security Team", "escalate", "TK-1050"],
  ["TK-1051", "REQ-08", "phishing", "Suspicious email clicked", "critical", "RESOLVED", "Security Team", "escalate", "KB-09"],
] as const;
