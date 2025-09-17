---
description: A description of your rule
---

Needix — Agent Operating Manual (Paste as System Prompt / Project Rules)
Mission

You are editing Needix, a Next.js 15 (App Router) SaaS for subscription tracking and smart orders. Your job is to make precise, reviewable changes that compile on strict TypeScript and match the project’s conventions.

Tech Stack (authoritative)

Framework: Next.js 15, App Router

Language: TypeScript (strict) — never use any

Styling: Tailwind CSS (avoid inline styles except tiny one-offs)

UI components: basic custom components (shadcn optional, don’t add unless asked)

Auth: NextAuth (Credentials/GitHub), PrismaAdapter

DB: Prisma ORM + Neon Postgres

Email: Resend for /api/newsletter and /api/contact

Payments: Stripe (present/placeholder)

Hosting: Vercel

Analytics: Vercel Analytics already wired in app/layout.tsx

Global Editing Rules

Full-file replacements. When changing a file, output the entire file, ready to paste.

Put the exact repo path as the first line comment, e.g. // components/Navbar.tsx.

No breaking type safety. Strict TS must pass; do not introduce any, @ts-ignore, or implicit anys.

Minimal deps. Don’t add new packages unless absolutely needed and explicitly requested.

App Router patterns. Use server components by default; mark client code with "use client". Prefer route.ts handlers for APIs.

State/data flow. Use server actions or route handlers as appropriate; avoid fetching from client when server can render.

Env safety. Never hardcode secrets. Expect env via Vercel/.env. Don’t rename existing env keys.

Auth. Protect APIs with session checks; scope queries by userId. Never expose private user data.

Migrations. If you touch Prisma schema, include the entire schema and migration steps. Keep models/enums complete to avoid drift.

Accessibility/UX. Reasonable aria labels, keyboard focus, and responsive layout. No visual regressions to header/footer/CTA.

Copy & links. Keep tone concise and product-like. Don’t invent marketing copy unless asked.

Folder & File Conventions

app/(site)/... public site routes

app/dashboard/... authenticated app surface (tabs like subscriptions, orders)

components/... shared, headless where possible

app/api/.../route.ts API endpoints (validate input; never leak stack traces)

lib/... utilities (validation, helpers, prisma, auth)

UI Guidelines

Navbar (simplified): Needix (left) · Dashboard · UserStatus · Menu (right)

Use Tailwind utilities; avoid ad-hoc CSS files unless necessary.

Provide sensible empty/load/error states; avoid spinner-only screens.

API Guidelines (App Router)

Validate with Zod in lib/validators/*.ts

On error: return typed 4xx/5xx with human-safe message; don’t forward Prisma errors

Always constrain by userId from session

Prisma & Data

Use cents for money (e.g., amountCents: Int, currency: "USD" for now).

Indices for frequent filters (userId, status, dates).

If adding models (e.g., Order), include enums and relations, plus an explanation of cadence/date rules.

Deployment & Runtime

Must build on Vercel without extra config. Don’t rely on Node APIs not supported in edge functions unless you pin runtime.

No runtime secrets in client components. Use server actions/handlers for sensitive work.

Git Hygiene (for agents that can commit)

Create/update only the files specified in the plan. No sweeping mass refactors.

Keep diffs small & scoped. Include a short rationale at top of each file as a comment.

Change Workflow the Agent Must Follow

Plan first. Output a numbered plan listing: files to edit/add, high-level steps, and risks.

Confirm paths. Use correct repo paths; do not create new folders unless the plan says so.

Implement in batches. For each step, output complete file(s) with path comments.

Validation checklist (before finishing):

pnpm typecheck would pass (no any, no ts-ignore)

Next.js rules OK (server/client boundaries)

API handlers validate inputs and require session

Prisma types imported from @prisma/client (no custom re-defs)

UI renders without Tailwind class typos (basic smoke check)

Post-change notes. If you introduced new env vars, routes, or schema fields, list them and how to migrate.

Guardrails (Never Do)

Don’t rename or remove existing env variables, auth callbacks, or analytics imports.

Don’t add third-party SDKs or heavy UI kits without explicit request.

Don’t ship commented-out blocks as “todo” in final code (keep clean).

Don’t mix app and legacy pages router patterns.

Don’t push schema changes without enumerating the migration steps.