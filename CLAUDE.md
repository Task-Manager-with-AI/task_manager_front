# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **frontend** for "Software de Gestión Ágil" — a collaborative task and meeting-minutes management platform with AI capabilities for real-time team coordination.

The **current codebase is a UI template/prototype** (originally from v0.dev) that serves as the visual and structural starting point. All data is static and hardcoded; the goal is to progressively replace it with real API calls, authentication, and backend integration.

### Final Product Scope (6 modules)

| # | Module | Description |
|---|---|---|
| 1 | User & Access Management | Registration, login, profiles, roles |
| 2 | Meeting Management | Schedule and store meetings with participants |
| 3 | Automatic Minutes (AI) | AI-generated meeting minutes extracting key agreements |
| 4 | Task Management | Convert agreements into tasks with assignees, priorities, deadlines |
| 5 | Activity Tracking | Track task progress (pending / in-progress / completed) |
| 6 | Centralized History | Full audit trail of all meetings and tasks |

### Planned Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (this repo) |
| Backend | Node.js REST API |
| Database | PostgreSQL |
| Real-time | Socket.IO |
| AI | LLM integration for minutes processing |

### Current State vs. Target

- **Routing & layout:** Done — sidebar, header, and all page shells exist.
- **UI components:** Done — full shadcn/ui component set is available.
- **Data:** Static/hardcoded — must be replaced with API calls (backend not yet built).
- **Auth:** Not implemented — RF-01/RF-02 (registration + login) are pending.
- **Real-time:** Not implemented — Socket.IO integration is pending.
- **AI minutes:** Not implemented — RF-09 is pending backend + LLM integration.

## Commands

```bash
# Development
npm run dev        # or: pnpm dev

# Build
npm run build      # or: pnpm build

# Lint
npm run lint       # or: pnpm lint
```

> Note: both `package-lock.json` and `pnpm-lock.yaml` are present. Either npm or pnpm can be used.

The project has `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true` in `next.config.mjs`, so builds succeed even with TS/lint errors.

## Architecture

**Framework:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui (Radix UI).

### Routing

Pages live under `app/` using Next.js App Router:

| Route | File |
|---|---|
| `/` | `app/page.tsx` — "My Task" (main dashboard view) |
| `/dashboard` | `app/dashboard/page.tsx` |
| `/projects` | `app/projects/page.tsx` |
| `/people` | `app/people/page.tsx` |
| `/chats` | `app/chats/page.tsx` |
| `/documents` | `app/documents/page.tsx` |
| `/receipts` | `app/receipts/page.tsx` |

### Layout Hierarchy

```
app/layout.tsx          — Root: ThemeProvider wraps ClientLayout
  app/client-layout.tsx — "use client": owns project list state, renders DashboardLayout
    components/dashboard-layout.tsx — Sidebar + header shell, renders {children}
```

`ClientLayout` is the state boundary for shared data (the projects list). If new cross-page state is needed, add it here and pass it down as props.

### Data Layer

All data is currently **static / local state** — placeholder until the Node.js + PostgreSQL backend is built. The source of truth for people/team data is `lib/people.ts`, which exports:
- `people` — array of 16 `Person` objects with `id`, `name`, `imageURL`, `email`, `workingHours`, `team`
- `teams` — array of 5 teams (dev, qa, design, product, marketing)
- `isPersonWorking(person)` — checks if person is currently within their working hours
- `getTeamById(teamId)` — lookup helper

`lib/documents.ts` follows the same static pattern for document data.

Task and schedule data is initialized as `useState` inside `app/page.tsx` rather than in a shared store.

### UI Components

`components/ui/` contains the full shadcn/ui component set. Add new shadcn components with:
```bash
npx shadcn@latest add <component>
```

The `cn()` utility in `lib/utils.ts` merges Tailwind classes (`clsx` + `tailwind-merge`). Use it whenever conditionally combining class names.

Icons come from `lucide-react`.

### Theming

Light/dark mode is handled by `next-themes` via `components/theme-provider.tsx`. The toggle is in `components/theme-toggle.tsx`. All components use Tailwind's `dark:` variants — follow the existing pattern of pairing light and dark classes (e.g., `bg-white dark:bg-gray-800`).

### Path Aliases

`@/` maps to the project root. Standard aliases from `components.json`:
- `@/components` → `components/`
- `@/components/ui` → `components/ui/`
- `@/lib` → `lib/`
- `@/hooks` → `hooks/`
