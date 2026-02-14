# booth-library-manager

Chrome extension (MV3) for managing your BOOTH purchase library inside `accounts.booth.pm`.

This project uses WXT + React and injects an overlay panel (Shadow DOM) into the BOOTH library page.

## Features

- Overlay panel UI on `https://accounts.booth.pm/*`
- Source tabs: `Library` / `Gifts`
- Filter tabs: `All` / `Favorites` / `Hidden` (per selected source)
- Search by title and creator
- Resizable panel width
- Responsive card grid (more columns as panel width grows)
- Quick download button with hover dropdown links
- Sync across both library and gifts pages
- Batched loading (5 pages per batch)
- Progressive rendering while syncing
- Local cache in extension storage
  - If cache is empty, auto-sync runs once on first load
- Auto-refresh first page every 60 seconds
- Auto-refresh first page when panel is opened

## Tech Stack

- WXT `0.20.x`
- React `19`
- TanStack Query `5`
- Tailwind CSS `4`
- TypeScript `5.9`
- pnpm `10`

## Commands

```bash
pnpm install

# dev (chrome)
pnpm dev

# dev (firefox)
pnpm dev:firefox

# production build
pnpm build

# firefox build
pnpm build:firefox

# zip package
pnpm zip
pnpm zip:firefox

# type check
npx tsc --noEmit
```

## Storage

The extension uses `browser.storage.local` (extension storage):

- `booth-library-cache`
  - Cached library items (`BoothItem[]`)
- `booth-library-preferences`
  - User preferences (`favorites`, `hidden`, `tags`)

## Project Layout

```text
entrypoints/content/
  index.tsx                  # content script entry
  App.tsx                    # root app wiring
  components/                # overlay UI components

hooks/
  useLibraryFetcher.ts       # sync, refresh, cache hydration
  useUserPreferences.ts      # favorites/hidden/tags storage
  useLibrarySearch.ts        # source/filter/search logic

utils/
  parser.ts                  # BOOTH HTML parser
  scraper.ts                 # page fetching + batch orchestration
  storage.ts                 # preferences storage wrapper
  libraryCache.ts            # item cache storage wrapper

types/
  booth.ts                   # shared types
```

## Notes

- BOOTH has no official public API for this workflow, so parsing depends on DOM structure.
- If BOOTH markup changes, selectors in `utils/parser.ts` may need updates.
- The panel is rendered in Shadow DOM with z-index above page overlays.
