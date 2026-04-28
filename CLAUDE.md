# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code style

Use comments sparingly. Only comment complex code.

## Commands

```bash
# First-time setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (uses Turbopack + node-compat shim)
npm run dev

# Background dev server (logs to logs.txt)
npm run dev:daemon

# Build
npm run build

# Lint
npm run lint

# Tests (vitest + jsdom)
npm test

# Run a single test file
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx

# Reset database
npm run db:reset

# Regenerate Prisma client after schema changes
npx prisma generate && npx prisma migrate dev
```

To use real Claude generation, set `ANTHROPIC_API_KEY` in a `.env` file at the project root. Without it, a mock provider returns static code. The live model is `claude-haiku-4-5` (configured in `src/lib/provider.ts`).

## Architecture

UIGen is a Next.js 15 (App Router) application where users describe React components in a chat and see them rendered live. No files are written to disk during generation.

### Request / generation flow

1. User submits a chat message → `POST /api/chat` (`src/app/api/chat/route.ts`)
2. The route reconstructs a `VirtualFileSystem` from the serialized state sent in the request body, attaches two AI tools (`str_replace_editor`, `file_manager`), and calls `streamText` via the Vercel AI SDK.
3. The AI streams tool calls back to the client. The Vercel AI SDK's `useChat` hook (in `ChatContext`) fires `onToolCall` for each one, which delegates to `handleToolCall` in `FileSystemContext`.
4. `handleToolCall` applies the tool call against the in-memory `VirtualFileSystem` and increments `refreshTrigger`.
5. `PreviewFrame` watches `refreshTrigger`, calls `createImportMap` to Babel-transform all files client-side (via `@babel/standalone`), builds blob URLs, and injects an `importmap`-based HTML document into a sandboxed `<iframe>`.

### Virtual file system (`src/lib/file-system.ts`)

`VirtualFileSystem` is an in-memory tree of `FileNode` objects. It is instantiated fresh on the server for each chat request, serialized to JSON and sent back to the client, and held in React state via `FileSystemContext`. It is never written to disk — Prisma stores its serialized form (`data` column as JSON string) when a project is saved.

### Preview rendering (`src/lib/transform/jsx-transformer.ts`)

`createImportMap` transforms all `.jsx/.tsx/.ts/.js` files with Babel and creates blob URLs. Local imports use the blob URL map; unresolved third-party packages fall back to `https://esm.sh/<package>`. `createPreviewHTML` builds a complete HTML document with an `<script type="importmap">` and a module script that mounts the React app. The entry point is resolved in priority order: `/App.jsx` → `/App.tsx` → `/index.jsx` → `/index.tsx` → first `.jsx/.tsx` found.

### AI tools

- `str_replace_editor` — create/str_replace/view/insert operations on files in the virtual FS
- `file_manager` — rename and delete operations

Both tools are built in `src/lib/tools/` and receive the server-side `VirtualFileSystem` instance. The same write operations are mirrored client-side in `FileSystemContext.handleToolCall` so the preview updates in real time during streaming. The `view` command is server-only (read-only, no client mirror needed). The system prompt sent to the model is in `src/lib/prompts/generation.tsx`.

### Host app UI

The host application's UI components (chat panel, editor, dialogs) use [shadcn/ui](https://ui.shadcn.com/) (new-york style, neutral base color) with Radix UI primitives and Tailwind. Add new UI primitives to `src/components/ui/` using the shadcn CLI or by hand following the existing pattern.

### Auth (`src/lib/auth.ts`, `src/middleware.ts`)

JWT-based sessions stored in an httpOnly cookie (`auth-token`). `jose` is used for signing/verification. Session duration is 7 days. The middleware only guards `/api/projects` and `/api/filesystem` routes; `/api/chat` is public but project saving is skipped when no session exists.

### Anonymous work (`src/lib/anon-work-tracker.ts`)

When a user generates components without being signed in, the chat messages and file system state are persisted to `sessionStorage`. After sign-in/sign-up the client can recover this state to associate it with the new account.

### Persistence

Prisma with SQLite (`prisma/dev.db`). The generated client is output to `src/generated/prisma`. Two models:
- `User` — email + bcrypt-hashed password
- `Project` — stores `messages` and `data` (serialized `VirtualFileSystem`) as JSON strings

The database schema is defined in `prisma/schema.prisma`. Reference it whenever you need to understand the structure of data stored in the database.

### Key conventions

- All AI-generated files must have `/App.jsx` as the root entry point with a default export.
- Local imports inside generated code use the `@/` alias (e.g. `@/components/Button`), which `createImportMap` resolves to the corresponding blob URL.
- Tailwind CSS is loaded via CDN inside the preview iframe — do not use Next.js Tailwind setup for preview styles.
- `node-compat.cjs` is required at startup to polyfill Node.js builtins needed by some dependencies under the Next.js runtime.
- Prisma client output is `src/generated/prisma` (non-standard location) — import from there, not from `@prisma/client`.
