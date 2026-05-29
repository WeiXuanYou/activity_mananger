# 相聚 Together — Agent / Contributor Map

This file is the entry point for AI assistants and new contributors.
Read this before editing anything else.

## 1. What this product is
A closed, invite-only social space for **family AND friends** to:
- Organize events with RSVPs
- Run polls (Line-style: deadline, multi-select, anonymous, allow-add-option)
- Post articles, recommendations, notes (with pinning)
- Tag everything with categories (default + user-defined)
- Build custom CMS pages
- Request higher permissions through an audited approval flow

Public-only — no DMs.

## 2. Top-level layout
```
app/                  Routing & page composition ONLY. No business logic.
  mockup/             Phase A interactive prototype (current state).
  (later: (app)/, (analytics)/, (marketing)/)

modules/              All business logic, types, data, and feature components.
  core/               Social core (members, categories, activities, posts, polls, feed)
  custom-pages/       CMS module
  permissions/        Roles, permission matrix, request/approval
  auth/               Invite codes, sessions
  analytics/          Read-only event aggregations (isolated)

components/ui/        Cross-feature UI primitives (Button, Toggle, Tag, ...)
lib/                  Pure utilities (cn, formatters, env, ...)
prisma/               (Phase B+) DB schema and seed
```

## 3. Module contract
Every feature module follows the same shape so AI / humans can predict file layout:
```
modules/<area>/<feature>/
  index.ts           Re-exports the PUBLIC API (types + functions + components)
  types.ts           TypeScript types
  data.ts            Mock data (Phase A) → swapped for queries.ts (Phase B+)
  queries.ts         Pure read functions (filter, lookup, aggregate)
  actions.ts         (Phase B+) Server actions for mutations — guarded by requirePermission
  components/        React components specific to this feature
```

**Rule:** A page in `app/` may ONLY import from `<module>/index.ts`. Never reach into a module's internals from a page. This keeps the seam clean for future refactors.

## 4. Cross-module dependencies (the seams)
```
                   ┌────────────────┐
                   │   auth         │  → identity only
                   └───────┬────────┘
                           │ getCurrentUser()
                           ▼
                   ┌────────────────┐
                   │  permissions   │  ← single chokepoint
                   └───────┬────────┘
                           │ requirePermission()
                           ▼
        ┌──────────────────┴──────────────────┐
        │            core (social)            │
        │  members · categories · activities  │
        │      posts · polls · feed           │
        └──────┬────────────────────┬─────────┘
               │                    │
        analytics.emit()      custom-pages
               │              (independent)
               ▼
        ┌────────────────┐
        │  analytics     │  READ-ONLY consumer of events
        │  (isolated)    │  Never JOINs into core tables.
        └────────────────┘
```

Three rules an agent should never break:
1. `core` never imports from `analytics`. Only calls `analytics.emit(...)`.
2. `analytics` never reads from `core` tables. Only from `AnalyticsEvent` (or its mock).
3. Every mutating action lives inside a module and starts with `requirePermission(...)`.

## 5. Where to add a new thing
- **New post category** → seed in `modules/core/categories/data.ts`
- **New content type** (e.g. wishes, recipes) → new folder `modules/core/<thing>/` following the contract; register a card in `modules/core/feed/index.ts`
- **New CMS block** (markdown, video, embed) → new renderer in `modules/custom-pages/block-renderers/` + register in `index.ts`
- **New permission** → add to `modules/permissions/data.ts` permission list and role matrix
- **New analytics chart** → new component in `modules/analytics/components/`; query function in `modules/analytics/queries.ts`

## 6. Visual / UX conventions
- Warm "family album" palette: paper `#FBF7F1`, terracotta `#C75B3A`, sage `#7A8E6E`
- Serif (`Fraunces`) for headings, sans (`Inter`) for UI
- Rounded `12–16px` corners, soft shadows
- Analytics module deliberately uses **dark slate header** to signal module boundary
- Categories use emoji + named color from the small palette in `modules/core/categories/types.ts`

## 7. Phase
- ✅ **Phase A** mockup with mock data (under `/mockup/*`)
- ✅ **Phase B** Prisma + SQLite + invite-code login + real `requirePermission()` (under `/login` and `/app/*`)
- ✅ **Phase C** social core via Prisma + real CRUD mutations (`/app/feed`, `/app/activities`, `/app/activity/[id]` w/ RSVP, `/app/poll/[id]` w/ vote, `/app/posts/new`, `/app/permissions` w/ admin inbox)
- ✅ **Phase D** CMS block-renderer registry expanded: richtext / markdown (react-markdown + GFM) / html (DOMPurify-sanitized) / image / embed-poll. Real `/app/pages`, `/app/pages/[slug]`, `/app/pages/new`
- ✅ **Phase E** analytics events real: `emit()` writes to `AnalyticsEvent`; `/app/analytics` reads ONLY that table (no JOIN into core); gated by `analytics.view`
- ✅ **Phase F** notifications (`modules/notifications`, `notify()` seam, bell + `/app/notifications`) + admin tools (`/app/admin`: invite-code generation, role management, audit log)
- ✅ **Phase G** AI assistant wired to Anthropic SDK: `modules/ai-assistant/client.ts` calls Claude Opus 4.8 (adaptive thinking) when `ANTHROPIC_API_KEY` is set, else a deterministic stub. `/app/assistant` is a live playground. The assistant only *suggests* — it never writes to core tables, so it can't bypass `requirePermission`.

**Server-only boundary:** `modules/ai-assistant/client.ts` imports `server-only` + `@anthropic-ai/sdk`. Client components must NOT import the `@/modules/ai-assistant` barrel — import UI pieces from their narrow paths (`.../components/AssistantSuggestions`, `.../data`) instead, or the Node-only SDK leaks into the browser bundle and the build fails.

**Mock and real coexist:**
- `/mockup/*` pages use `getMockCurrentUser()` (sync) + module `data.ts` sync helpers like `listPosts()`.
- `/app/*` pages use `getCurrentUser()` (async) + module `db.ts` async helpers like `listPostsDb()`.
- Cards (`PostCard`, `ActivityCard`, `PollCard`) accept the same `Post`/`Activity`/`Poll` TS type — DB sources pre-resolve `author`/`host`/`categories` via the adapter; mock sources leave them undefined and the card falls back to sync mock lookups.
- Server actions live in `modules/<x>/actions.ts` ("use server") and gate every mutation with `await requirePermission(...)`.

## 8. Quick command reference
```bash
npm install        # install deps
npm run dev        # http://localhost:3000
npm run build      # production build (verify TS + page generation)
```
