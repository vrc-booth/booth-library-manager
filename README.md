# booth-library-manager

> Notice: This project was built with AI assistance.
>
> Dedicated purpose: This extension is intended specifically for managing personal BOOTH purchase/gift libraries on `accounts.booth.pm`.

Chrome extension (MV3) for managing your BOOTH purchase library inside `accounts.booth.pm`.

This project uses WXT + React and injects an overlay panel (Shadow DOM) into the BOOTH library page.

## Features

- Overlay panel UI on `https://accounts.booth.pm/*`
- Source tabs: `Library` / `Gifts`
- Filter tabs: `All` / `Favorites` / `Hidden` (per selected source) / `Custom`
- `Custom` tab: organize items into nested folders (across Library and Gifts)
  - Add items with the folder button on a card, by selecting several items, or by drag and drop
  - An item can be in several folders; drag folders onto other folders to rearrange them
- Downloads start directly without opening new tabs
  - `All (N)` downloads every file of an item; the arrow opens a file list that stays open
  - Download a whole folder (including subfolders) or the selected items at once
- The floating button is hidden while you are signed out
- Search by title and creator
- Resizable panel width
- Responsive card grid (more columns as panel width grows)
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
  - User preferences (`favorites`, `hidden`, `tags`, `folders`)
- `booth-library-parser-rules`
  - Cached remote parser selector rules (refreshed every 24 hours)

## Project Layout

```text
entrypoints/background.ts    # remote parser rules + download queue

entrypoints/content/
  index.tsx                  # content script entry
  App.tsx                    # root app wiring
  components/                # overlay UI components

hooks/
  useLibraryFetcher.ts       # sync, refresh, cache hydration
  useUserPreferences.ts      # favorites/hidden/tags storage
  useLibrarySearch.ts        # source/filter/search logic

utils/
  folders.ts                 # folder tree helpers (pure functions)
  downloads.ts               # download requests + background queue
  session.ts                 # sign-in check
  parser.ts                  # BOOTH HTML parser
  parserRules.ts             # built-in selectors + remote rule validation/merge
  remoteParserRules.ts       # remote rule fetching + cache
  scraper.ts                 # page fetching + batch orchestration
  storage.ts                 # preferences storage wrapper
  libraryCache.ts            # item cache storage wrapper

types/
  booth.ts                   # shared types

rules/
  parser-rules.json          # remote parser selectors (served from GitHub)
```

## Notes

- BOOTH has no official public API for this workflow, so parsing depends on DOM structure.
- The panel is rendered in Shadow DOM with z-index above page overlays.

## Updating Parser Selectors Without a Store Release

When BOOTH changes class names or attributes, add selectors to `rules/parser-rules.json` and push to `main`.
Installed extensions fetch the file from `raw.githubusercontent.com` and pick it up within 24 hours, or within 1 hour when a page parses to zero items.

- Remote selectors are tried first; the built-in defaults in `utils/parserRules.ts` stay as the fallback.
- Only CSS selector strings are accepted. Invalid selectors and unknown keys are ignored.
- If the file can't be fetched or fails validation, the extension uses the last cached rules, then the built-in defaults.
- Structural changes (data moved to a separate API, a modal, or embedded JSON) still need a code change and a store release.
- Bump `schemaVersion` only for a breaking format change. Older extension versions ignore files with an unknown `schemaVersion`.

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
- 필터 탭: `All` / `Favorites` / `Hidden` (선택한 소스 기준) / `Custom`
- `Custom` 탭: 하위 폴더까지 만들어 아이템 정리 (Library/Gifts 구분 없음)
  - 카드의 폴더 버튼, 여러 개 선택, 드래그 앤 드롭으로 폴더에 넣기
  - 한 아이템을 여러 폴더에 넣을 수 있고, 폴더를 끌어 다른 폴더 안으로 옮길 수 있음
- 새 탭 없이 바로 다운로드
  - `All (N)`으로 아이템의 파일 전부 받기, 화살표로 계속 열려 있는 파일 목록 열기
  - 폴더(하위 폴더 포함) 또는 선택한 아이템을 한꺼번에 받기
- 로그인하지 않은 상태에서는 플로팅 버튼을 띄우지 않음
- 제목/작가명 검색
- 패널 너비 리사이즈
- 패널 너비에 따라 그리드 열 수 자동 증가
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
  - 사용자 설정 (`favorites`, `hidden`, `tags`, `folders`)
- `booth-library-parser-rules`
  - 원격 파서 셀렉터 규칙 캐시 (24시간마다 갱신)

### 참고

- BOOTH는 이 워크플로우용 공식 공개 API가 없어 HTML 파싱에 의존합니다.
- 패널은 Shadow DOM으로 렌더링되며 페이지 오버레이보다 높은 z-index로 표시됩니다.

### 스토어 배포 없이 파서 셀렉터 업데이트하기

BOOTH가 클래스 이름이나 속성을 바꾸면 `rules/parser-rules.json`에 셀렉터를 추가하고 `main`에 push합니다.
설치된 확장은 `raw.githubusercontent.com`에서 이 파일을 받아 24시간 안에 반영합니다. 페이지에서 아이템이 하나도 파싱되지 않으면 1시간 안에 반영합니다.

- 원격 셀렉터를 먼저 시도하고, `utils/parserRules.ts`의 내장 기본값은 폴백으로 남습니다.
- CSS 셀렉터 문자열만 받습니다. 잘못된 셀렉터와 모르는 키는 무시합니다.
- 파일을 받지 못하거나 검증에 실패하면 마지막 캐시 규칙, 그다음 내장 기본값을 사용합니다.
- 구조 변경(데이터가 별도 API, 모달, 내장 JSON으로 이동)은 코드 수정과 스토어 배포가 필요합니다.
- `schemaVersion`은 형식이 호환되지 않게 바뀔 때만 올립니다. 이전 버전 확장은 모르는 `schemaVersion` 파일을 무시합니다.
