# AGENTS.md — booth-library-manager

## Project Overview

Chrome extension (MV3) for managing Booth.pm purchase library. Built with **WXT** (Web Extension Tools), **React 19**, **TanStack Query v5**, and **Tailwind CSS v4**. Runs as a content script overlay inside Shadow DOM on Booth.pm pages.

No official Booth API — data is fetched via DOM parsing of `https://accounts.booth.pm/library`.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Extension Framework | WXT | 0.21.x |
| UI Framework | React | 19.x |
| State/Cache | TanStack React Query | 5.x |
| Styling | Tailwind CSS (Vite plugin) | 4.x |
| Language | TypeScript | 5.9.x |
| Package Manager | Bun | 1.3.x |
| Build Tool | Vite (via WXT) | — |

## Build & Dev Commands

```bash
# Install dependencies
bun install

# Development (Chrome, with hot reload)
bun run dev

# Development (Firefox)
bun run dev:firefox

# Production build (Chrome)
bun run build

# Production build (Firefox)
bun run build:firefox

# Package for distribution
bun run zip
bun run zip:firefox

# Type check
bunx tsc --noEmit

# Prepare WXT types (runs automatically on install via postinstall)
bun run postinstall
```

### Testing

No test framework is configured yet. When adding tests:
- Use **Vitest** (already compatible with Vite/WXT)
- Use WXT's `wxt/testing` utilities and `fake-browser` for extension API mocking
- Configure via `vitest.config.ts` or integrate into `wxt.config.ts`

## Project Structure

```
booth-library-manager/
├── entrypoints/           # WXT entry points (content scripts, background, etc.)
│   └── content/           # Content script — injected into Booth.pm pages
│       ├── index.tsx       # defineContentScript + Shadow DOM setup
│       ├── App.tsx         # Root component (QueryClientProvider, state)
│       └── components/     # UI components
├── assets/
│   └── tailwind.css       # Tailwind entry point (@import "tailwindcss")
├── docs/planning/          # Dev planning documents (Korean)
├── wxt.config.ts           # WXT configuration (Vite plugins, manifest, modules)
├── tsconfig.json           # TypeScript config (extends .wxt/tsconfig.json)
├── .wxt/                   # WXT auto-generated types (DO NOT EDIT)
└── dist/                   # Build output (DO NOT EDIT)
```

### Planned directories (per project roadmap)

```
src/                       # Will hold non-entrypoint source code
├── components/ui/          # Shared UI primitives
├── hooks/                  # Custom React hooks (useLibraryFetcher, useUserPreferences)
├── utils/                  # Pure utility functions (parser.ts, storage.ts)
└── types/                  # Shared TypeScript types
```

## Code Style & Conventions

### TypeScript

- **Strict mode** — never use `as any`, `@ts-ignore`, or `@ts-expect-error`
- **Always run `bunx tsc --noEmit`** after editing `.ts`/`.tsx` files
- Use `interface` for component props (e.g., `interface FloatingButtonProps { ... }`)
- Path alias: `@/*` maps to project root (configured in tsconfig.json)
- `allowImportingTsExtensions` is enabled — use `.tsx` extensions in imports

### React

- **Function components only** — use `export default function ComponentName()`
- Props interface defined directly above the component in the same file
- Use `useState` / React hooks — no class components
- TanStack Query for async state — `QueryClient` configured with 5min staleTime, no refetchOnWindowFocus

### Imports

- WXT auto-imports: `defineContentScript`, `createShadowRootUi` (from `#imports`)
- React: standard named imports from `"react"`
- TanStack Query: named imports from `"@tanstack/react-query"`
- Local imports: relative paths with `.tsx` extension (e.g., `"./App.tsx"`)
- Tailwind CSS: import via `"~/assets/tailwind.css"` (WXT alias for project root)
- **No barrel exports** — import directly from source files

### Styling

- **Tailwind CSS v4** via Vite plugin (not PostCSS)
- All UI runs inside **Shadow DOM** — styles are isolated from host page
- Use Tailwind utility classes inline via `className`
- Booth brand color: `#fc4d50` (hover: `#e03e41`)
- Template literal classNames with conditional logic for dynamic styles

### Naming Conventions

- **Files**: PascalCase for components (`FloatingButton.tsx`), camelCase for utilities
- **Components**: PascalCase (`FloatingButton`, `LibraryPanel`)
- **Props interfaces**: `{ComponentName}Props` (e.g., `FloatingButtonProps`)
- **Hooks**: `use` prefix (e.g., `useLibraryFetcher`)
- **Event handlers**: `handle` prefix in parent, `on` prefix in props (e.g., `handleToggle` → `onClick`)

### Error Handling

- Use try/catch with descriptive error messages
- Fail fast with early returns
- Never silently swallow exceptions (no empty `catch {}`)
- Handle errors at the appropriate level

### File Encoding

- All files **must** be UTF-8

## WXT-Specific Patterns

### Content Script Entry Point

```tsx
export default defineContentScript({
  matches: ["*://accounts.booth.pm/*"],
  cssInjectionMode: "ui",
  async main(ctx: ContentScriptContext) {
    const ui = await createShadowRootUi(ctx, { ... });
    ui.mount();
  },
});
```

### Shadow DOM

All UI renders inside Shadow DOM (`createShadowRootUi`). This means:
- Host page styles don't leak in
- Extension styles don't leak out
- Tailwind CSS must be injected into the shadow root (handled by WXT's `cssInjectionMode: "ui"`)
- Use `pointer-events: none` on wrapper, `pointer-events-auto` on interactive elements

### Manifest Permissions

Declared in `wxt.config.ts` under `manifest.permissions`:
- `tabs` — for tab management
- Host permissions configured via `matches` in content script definition

## Key Design Decisions

1. **Overlay UI** (not popup/sidebar) — content script injects directly into Booth.pm pages
2. **Shadow DOM isolation** — prevents style conflicts with host page
3. **Client-side parsing** — no backend; fetches Booth library pages and parses HTML
4. **React Query caching** — parsed data kept in memory cache, user prefs in Chrome Storage
5. **Bun** — enforced via `packageManager` field in package.json

## Don'ts

- Don't edit files in `.wxt/` or `dist/` — they are auto-generated
- Don't use `npm`, `yarn`, or `pnpm` — this project uses `bun`
- Don't add barrel exports (`index.ts` re-exports)
- Don't suppress TypeScript errors
- Don't commit code that fails `tsc --noEmit`
- Don't install new dependencies without justification
