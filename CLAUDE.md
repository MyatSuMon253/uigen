# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (install deps + generate Prisma client + run migrations)
npm run setup

# Development server (uses Turbopack)
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Reset the database
npm run db:reset

# Regenerate Prisma client after schema changes
npx prisma generate && npx prisma migrate dev
```

## Architecture

UIGen is a Next.js 15 (App Router) application that lets users describe React components in a chat interface and see them rendered live in an iframe — no files are ever written to disk.

### Core Data Flow

1. **User sends a chat message** → `src/app/api/chat/route.ts` streams a response using Vercel AI SDK (`streamText`)
2. **AI uses tools** to create/edit files in a `VirtualFileSystem` instance (server-side)
3. **Tool calls are streamed** back to the client, which applies them to its own `VirtualFileSystem` instance via `FileSystemContext`
4. **Preview iframe** reads from the client-side VFS, transforms JSX via Babel standalone, and renders the component

### Key Abstractions

**`VirtualFileSystem`** (`src/lib/file-system.ts`): In-memory file system backed by a `Map<string, FileNode>`. Supports create/read/update/delete/rename, plus text-editor-style operations (`viewFile`, `replaceInFile`, `insertInFile`). A singleton `fileSystem` is exported but server routes instantiate fresh instances per request.

**AI Tools** (both defined in `src/lib/tools/`):
- `str_replace_editor`: Primary tool — view/create/str_replace/insert in VFS files (mirrors Claude's text editor tool interface)
- `file_manager`: rename/delete files/directories

**AI Provider** (`src/lib/provider.ts`): `getLanguageModel()` returns the real Anthropic model (`claude-haiku-4-5`) if `ANTHROPIC_API_KEY` is set, otherwise returns a `MockLanguageModel` that streams static counter/form/card component code without hitting any API.

**JSX Transform** (`src/lib/transform/jsx-transformer.ts`): Transforms JSX/TSX to executable JS using `@babel/standalone` in the browser. Handles missing imports by creating placeholder modules, strips CSS imports.

**Contexts** (`src/lib/contexts/`):
- `FileSystemContext`: Wraps `VirtualFileSystem`, handles `handleToolCall` to apply streaming AI tool calls to the client-side VFS, triggers re-renders via `refreshTrigger`
- `ChatContext`: Manages chat messages and AI streaming state

### Auth & Persistence

- JWT sessions stored in httpOnly cookies; `src/lib/auth.ts` handles sign/verify with `jose`
- Prisma + SQLite (`prisma/dev.db`); schema has `User` and `Project` models
- `Project.messages` and `Project.data` are JSON-serialized strings (chat history + serialized VFS)
- Anonymous users can work freely; their session data is temporarily stored in `sessionStorage` via `src/lib/anon-work-tracker.ts` to offer project save on signup
- Server actions for project CRUD are in `src/actions/`

### App Routes

- `/` — landing/main page (`src/app/page.tsx` + `src/app/main-content.tsx`)
- `/[projectId]` — loads a saved project by ID
- `/api/chat` — POST endpoint that streams AI responses

### Component Structure

- `src/components/chat/` — `ChatInterface`, `MessageList`, `MessageInput`, `MarkdownRenderer`
- `src/components/editor/` — `CodeEditor` (Monaco), `FileTree`
- `src/components/preview/` — `PreviewFrame` (iframe-based live preview)
- `src/components/auth/` — `AuthDialog`, `SignInForm`, `SignUpForm`
- `src/components/ui/` — shadcn/ui components (Radix-based)

### Testing

Tests use Vitest + jsdom + `@testing-library/react`. Test files are colocated in `__tests__` subdirectories. The vitest config (`vitest.config.mts`) uses `vite-tsconfig-paths` so `@/` path aliases work.

### Environment

- `ANTHROPIC_API_KEY` — optional; app works with mock data if absent
- `JWT_SECRET` — optional; defaults to `"development-secret-key"` in dev
- `NODE_OPTIONS='--require ./node-compat.cjs'` is prepended to all Next.js commands (see `node-compat.cjs`) for Node.js compatibility shims
