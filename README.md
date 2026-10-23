# booth-library-manager

> Notice: This project was built with AI assistance.
>
> Dedicated purpose: This extension is intended specifically for managing personal BOOTH purchase/gift libraries on `accounts.booth.pm`.

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

- WXT `0.21.x`
- React `19`
- TanStack Query `5`
- Tailwind CSS `4`
- TypeScript `5.9`
- bun `1.3`

## Commands

```bash
bun install

# dev (chrome)
bun run dev

# dev (firefox)
bun run dev:firefox

# production build
bun run build

# firefox build
bun run build:firefox

# zip package
bun run zip
bun run zip:firefox

# type check
bunx tsc --noEmit
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

---

## 한국어 버전

> 안내: 이 프로젝트는 AI의 도움을 받아 제작되었습니다.
>
> 전용 목적: 이 확장프로그램은 `accounts.booth.pm`에서 개인의 BOOTH 구매/선물 라이브러리를 관리하는 용도로만 설계되었습니다.

`accounts.booth.pm` 내 구매 라이브러리를 관리하기 위한 Chrome 확장 프로그램(MV3)입니다.

WXT + React 기반으로 동작하며, BOOTH 라이브러리 페이지에 Shadow DOM 오버레이 패널을 주입합니다.

### 주요 기능

- `https://accounts.booth.pm/*` 오버레이 패널 UI
- 소스 탭: `Library` / `Gifts`
- 필터 탭: `All` / `Favorites` / `Hidden` (선택한 소스 기준)
- 제목/작가명 검색
- 패널 너비 리사이즈
- 패널 너비에 따라 그리드 열 수 자동 증가
- 다운로드 버튼 + 호버 드롭다운 링크
- Library/Gifts 동시 동기화
- 5페이지 단위 배치 로딩
- 동기화 중 점진적 렌더링
- 확장 스토리지 로컬 캐시
  - 캐시가 비어 있으면 첫 실행 시 자동 동기화
- 1분마다 1페이지 자동 리프레시
- 패널 열 때 1페이지 즉시 리프레시

### 기술 스택

- WXT `0.21.x`
- React `19`
- TanStack Query `5`
- Tailwind CSS `4`
- TypeScript `5.9`
- bun `1.3`

### 명령어

```bash
bun install

# 개발 (Chrome)
bun run dev

# 개발 (Firefox)
bun run dev:firefox

# 프로덕션 빌드
bun run build

# Firefox 빌드
bun run build:firefox

# 배포용 zip
bun run zip
bun run zip:firefox

# 타입 체크
bunx tsc --noEmit
```

### 스토리지

확장은 `browser.storage.local`을 사용합니다.

- `booth-library-cache`
  - 라이브러리 아이템 캐시 (`BoothItem[]`)
- `booth-library-preferences`
  - 사용자 설정 (`favorites`, `hidden`, `tags`)

### 참고

- BOOTH는 이 워크플로우용 공식 공개 API가 없어 HTML 파싱에 의존합니다.
- BOOTH 마크업이 바뀌면 `utils/parser.ts` 셀렉터 업데이트가 필요할 수 있습니다.
- 패널은 Shadow DOM으로 렌더링되며 페이지 오버레이보다 높은 z-index로 표시됩니다.
