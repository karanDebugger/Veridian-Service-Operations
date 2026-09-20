# Veridian Service Operations

A full-stack internal IT service operations workspace for Veridian Corp. The application combines deterministic request triage, grounded policy knowledge, persistent ticket management, human approvals, and an append-only audit trail in one responsive operations dashboard.

## What it does

- **Overview:** monitors live tickets, escalated work, pending approvals, and resolved requests.
- **Employee requests:** reviews the supplied request catalog and processes requests into traceable workflows.
- **Live agent:** classifies free-text requests, applies deterministic policy rules, cites grounded knowledge sources, and creates tickets when safe.
- **Ticket queue:** manages ticket status, priority, assignee, category, source references, and workflow action.
- **Approval desk:** supports approval, rejection, and information-request decisions for escalated work.
- **Policy & knowledge:** exposes the policy sources used by the agent.
- **Audit trail:** records intake, classification, decisions, ticket creation, approvals, and status changes.
- **System health:** shows database and control-plane checks from the application workspace.

The agent is intentionally conservative: it does not grant access, invent policy, bypass approval, or allow an optional LLM to override the deterministic policy engine.

## Technology

- React 19 + TypeScript
- Vite + Tailwind CSS 4
- Express 4 + tRPC 11
- Drizzle ORM + MySQL/TiDB
- Manus OAuth-compatible user scaffolding
- Vitest
- `pnpm`

## Requirements

- Node.js 22 or newer
- `pnpm` 10 or newer
- A MySQL-compatible database for persistent runtime data
- Manus WebDev environment variables if deploying through Manus hosting

## Local setup

```bash
pnpm install
cp .env.example .env
# Set DATABASE_URL and the other deployment values required by your environment.
pnpm db:push
pnpm dev
```

The development server runs on port `3000` by default. Open the URL printed by the server.

## Environment variables

The production WebDev runtime supplies the platform-specific values below. Do not commit real secrets.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL/TiDB connection string used by Drizzle |
| `JWT_SECRET` | Session-cookie signing secret |
| `VITE_APP_ID` | Manus OAuth application ID |
| `OAUTH_SERVER_URL` | OAuth backend base URL |
| `VITE_OAUTH_PORTAL_URL` | Frontend login portal URL |
| `OWNER_OPEN_ID` | Owner identity used for admin promotion |
| `OWNER_NAME` | Owner display name |
| `BUILT_IN_FORGE_API_URL` | Manus built-in API base URL |
| `BUILT_IN_FORGE_API_KEY` | Server-side built-in API credential |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend built-in API base URL |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend built-in API credential |

For a local UI-only run without a configured database, the app will show a database-unavailable state rather than silently pretending that data is persistent.

## Useful commands

```bash
pnpm dev       # Start the development server
pnpm check     # Run TypeScript validation
pnpm test      # Run Vitest tests
pnpm build     # Build the client and production server bundle
pnpm start     # Start the production bundle after pnpm build
pnpm db:push   # Generate and apply Drizzle migrations
```

Before opening a pull request, run:

```bash
pnpm check && pnpm test && pnpm build
```

## Architecture

The application is organized around a tRPC-first backend:

```text
client/src/pages/Home.tsx  →  operations.* tRPC procedures
                                      ↓
server/routers.ts           →  server/db.ts
                                      ↓
server/agent.ts             →  deterministic classification + policy decisions
                                      ↓
drizzle/schema.ts           →  MySQL/TiDB tables
```

### Backend

- `server/agent.ts` contains the deterministic classifier, policy handlers, priority map, and ticket-status mapping.
- `server/db.ts` contains seed initialization, bootstrap reads, request processing, ticket creation, approval updates, and audit writes.
- `server/routers.ts` exposes typed `operations.bootstrap`, `operations.process`, `operations.approval`, and `operations.ticketStatus` procedures.
- `server/seedData.ts` contains the supplied request catalog, knowledge articles, and legacy tickets used to initialize an empty workspace.
- `drizzle/schema.ts` defines users, service requests, tickets, approvals, audit events, and knowledge articles.

### Frontend

The main dashboard is implemented in `client/src/pages/Home.tsx`. It uses a responsive persistent sidebar on desktop and a mobile navigation drawer on smaller screens. The visual system uses a dark operations-cockpit palette with cyan action signals, amber review states, and rose security escalation states.

## Request lifecycle

1. A request enters through the employee request catalog or Live Agent form.
2. The deterministic classifier identifies a category using explicit keywords and contractor/access precedence rules.
3. The policy engine chooses one action: resolve, route, escalate, or ask for follow-up.
4. Grounded knowledge references are attached to the decision.
5. Safe decisions create a ticket and write audit events.
6. Escalations create a pending human approval record.
7. A reviewer can approve, reject, or request additional information.
8. Ticket and approval state changes remain visible in the audit trail.

## Data and migrations

Schema changes live in `drizzle/schema.ts`. Generate and apply migrations with:

```bash
pnpm db:push
```

The seed process is idempotent: it checks whether service requests already exist before inserting the initial catalog. Do not use production seed data as a substitute for a backup strategy.

## Testing

The repository includes focused tests for:

- Administrative-access precedence over generic software-install language
- Security escalation for suspicious links
- Clarification behavior for ambiguous mailbox requests
- OAuth logout cookie clearing

Run all tests with `pnpm test`.

## Security notes

- Never commit `.env` files, database credentials, OAuth secrets, or API keys.
- Keep access-granting decisions behind human review and role-based authorization before exposing the system to production users.
- Treat the supplied seed records as demo/assignment data and replace them with approved organizational data before production use.
- Review and adapt policy text with Veridian’s actual IT, Security, Finance, and HR owners; the included policy content is application fixture data, not legal or corporate policy.
- Add rate limiting, structured error monitoring, backups, and an explicit retention policy before broad rollout.

## Deployment

The project is compatible with the Manus WebDev full-stack scaffold. A typical deployment flow is:

1. Provision the project with the `web-db-user` scaffold.
2. Configure the environment variables and database connection.
3. Run `pnpm db:push` against the target database.
4. Run `pnpm check && pnpm test && pnpm build`.
5. Save a deployment checkpoint and publish through the WebDev project controls.

For other hosting providers, deploy the Node production bundle generated by `pnpm build`, provide the required environment variables, and run `pnpm start`.

## License

MIT. Confirm the license and the treatment of any Veridian-specific policy content with the repository owner before external distribution.
