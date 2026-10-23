# Booth Library Manager - Implementation Plan

## 개요

Booth.pm 구매 라이브러리를 효율적으로 관리하는 Chrome 확장프로그램.
공식 API 부재로 `fetch` + `DOMParser` 방식으로 HTML을 파싱하여 데이터를 수집한다.

### 아키텍처 결정

| 항목 | 결정 | 근거 |
|------|------|------|
| 프레임워크 | WXT (유지) | manifest 자동 생성, HMR, 빌드 자동화 |
| UI | React 19 (유지) | 컴포넌트 기반 UI, 상태 관리 용이 |
| 캐시/상태 | TanStack Query v5 (유지) | 서버 상태 관리, 캐싱, 페이지네이션 |
| 스타일 | Tailwind CSS v4 (유지) | Shadow DOM 내 스타일 격리, 유틸리티 클래스 |
| UI 방식 | Content Script Overlay | Shadow DOM 내 사이드패널, Booth 페이지에 오버레이 |
| 스크래핑 | Content Script 내 fetch | 동일 출처(accounts.booth.pm), 쿠키 자동 포함 |
| 저장소 | chrome.storage.local | 유저 설정(즐겨찾기/숨김/태그) 영구 저장 |
| 캐시 데이터 | React Query 메모리 캐시 | 상품 정보는 메모리에만 (staleTime: 5min) |

### 디렉토리 구조

```
booth-library-manager/
├── entrypoints/
│   └── content/
│       ├── index.tsx              # Content Script 진입점 (Shadow DOM)
│       ├── App.tsx                # Root (QueryClientProvider, 상태)
│       └── components/
│           ├── FloatingButton.tsx  # 플로팅 버튼
│           ├── LibraryPanel.tsx    # 메인 사이드패널
│           ├── ItemCard.tsx        # 개별 상품 카드
│           ├── ItemGrid.tsx        # 상품 그리드 리스트
│           ├── SearchBar.tsx       # 검색창
│           ├── FilterTabs.tsx      # 필터 탭 (전체/즐겨찾기/숨김)
│           ├── SyncButton.tsx      # 동기화 버튼 (진행률 표시)
│           └── SkeletonCard.tsx    # 로딩 스켈레톤
├── utils/
│   ├── parser.ts                  # HTML → BoothItem[] 변환 (순수 함수)
│   ├── storage.ts                 # chrome.storage.local 타입세이프 래퍼
│   └── scraper.ts                 # fetch + parse + 페이지네이션 오케스트레이터
├── hooks/
│   ├── useLibraryFetcher.ts       # TanStack Query 기반 라이브러리 데이터 훅
│   ├── useUserPreferences.ts      # chrome.storage 유저 설정 훅
│   └── useLibrarySearch.ts        # 클라이언트 사이드 검색/필터 훅
├── types/
│   └── booth.ts                   # BoothItem, UserPreferences 등 타입 정의
├── assets/
│   └── tailwind.css               # Tailwind 진입점
├── wxt.config.ts                  # WXT 설정
├── tsconfig.json
└── package.json
```

---

## Phase 1: 프로젝트 설정 업데이트

**Goal**: 확장프로그램이 Booth 사이트 데이터에 접근하고 저장할 수 있도록 권한 설정.

### 작업 목록

- [ ] `wxt.config.ts` 수정
  - `storage` 퍼미션 추가
  - `host_permissions`에 `*://*.booth.pm/*` 추가
- [ ] `entrypoints/content/index.tsx` 수정
  - `matches`를 `*://accounts.booth.pm/*`로 한정
- [ ] 디렉토리 생성: `utils/`, `hooks/`, `types/`

### 성공 기준

- `bun run build` 시 manifest.json에 `storage` 퍼미션과 `host_permissions` 포함
- Content script가 `accounts.booth.pm` 에서만 로드됨

---

## Phase 2: 타입 정의 & 코어 유틸리티

**Goal**: 스크래핑 데이터의 타입 시스템과 핵심 유틸리티 함수 구현.

### 2-1. 타입 정의 (`types/booth.ts`)

```typescript
interface BoothItem {
  id: string;                    // 상품 고유 ID
  title: string;                 // 상품명
  creator: string;               // 제작자/샵 이름
  thumbnailUrl: string;          // 썸네일 이미지 URL
  boothUrl: string;              // 상품 페이지 URL
  downloadUrls: DownloadFile[];  // 다운로드 파일 목록
  purchasedAt?: string;          // 구매일 (있으면)
}

interface DownloadFile {
  name: string;                  // 파일명
  url: string;                   // 다운로드 URL
}

interface UserPreferences {
  favorites: string[];           // 즐겨찾기 item ID 목록
  hidden: string[];              // 숨김 item ID 목록
  tags: Record<string, string[]>; // item ID → 사용자 태그 매핑
}

interface LibraryPage {
  items: BoothItem[];
  currentPage: number;
  hasNextPage: boolean;
  totalPages?: number;
}

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

interface SyncProgress {
  status: SyncStatus;
  currentPage: number;
  totalPages?: number;
  itemsCollected: number;
}
```

### 2-2. HTML 파서 (`utils/parser.ts`)

- 순수 함수: `parseLibraryPage(html: string): LibraryPage`
- `DOMParser`로 HTML 문자열 → Document 변환
- CSS 셀렉터로 상품 정보 추출
- 페이지네이션 정보(다음 페이지 존재 여부) 추출
- **주의**: Booth.pm HTML 구조가 변경될 수 있으므로 셀렉터를 상수로 분리

### 2-3. 스토리지 래퍼 (`utils/storage.ts`)

- `getPreferences(): Promise<UserPreferences>`
- `savePreferences(prefs: UserPreferences): Promise<void>`
- `toggleFavorite(itemId: string): Promise<void>`
- `toggleHidden(itemId: string): Promise<void>`
- `addTag(itemId: string, tag: string): Promise<void>`
- `removeTag(itemId: string, tag: string): Promise<void>`

### 2-4. 스크래퍼 (`utils/scraper.ts`)

- `fetchLibraryPage(page: number): Promise<LibraryPage>`
  - `fetch('https://accounts.booth.pm/library?page=${page}', { credentials: 'include' })`
  - 응답 HTML을 `parser.ts`로 파싱
- `fetchAllLibrary(onProgress?: (progress: SyncProgress) => void): Promise<BoothItem[]>`
  - 모든 페이지를 순회하며 수집
  - 페이지 간 1~2초 딜레이 (rate limit 방지)
  - 진행률 콜백 지원

### 성공 기준

- `tsc --noEmit` 통과
- parser가 샘플 HTML을 올바르게 파싱

---

## Phase 3: 데이터 페칭 훅

**Goal**: React 컴포넌트에서 사용할 커스텀 훅 구현.

### 3-1. `useLibraryFetcher`

- TanStack Query의 `useMutation` 또는 `useQuery` 활용
- 동기화(Sync) 트리거 시 모든 페이지 수집
- 수집 완료 후 Query 캐시에 저장
- 진행률 상태 노출 (`SyncProgress`)

### 3-2. `useUserPreferences`

- `chrome.storage.local`에서 유저 설정 로드/저장
- `useEffect`로 초기 로드
- 업데이트 시 chrome.storage와 React 상태 동기화

### 3-3. `useLibrarySearch`

- 입력: 전체 아이템 배열 + 검색어 + 필터 조건
- 출력: 필터링된 아이템 배열
- 클라이언트 사이드 검색 (제목, 제작자명 기준)
- 필터: 전체 / 즐겨찾기 / 숨김

### 성공 기준

- `tsc --noEmit` 통과
- 훅이 정상적으로 데이터를 반환 (콘솔 확인)

---

## Phase 4: UI 컴포넌트 개발

**Goal**: 넷플릭스 스타일 그리드 뷰, 검색, 필터를 포함한 완성된 사이드패널 UI.

### 4-1. 신규 컴포넌트

| 컴포넌트 | 설명 |
|----------|------|
| `ItemCard` | 썸네일 + 제목 + 제작자 + 즐겨찾기/숨기기 버튼 |
| `ItemGrid` | 아이템 카드 그리드 레이아웃 (CSS Grid) |
| `SearchBar` | 실시간 필터링 검색창 |
| `FilterTabs` | 전체 / 즐겨찾기 / 숨김 탭 전환 |
| `SyncButton` | 동기화 버튼 + 진행률 프로그레스바 |
| `SkeletonCard` | 로딩 중 표시할 스켈레톤 UI |

### 4-2. 기존 컴포넌트 수정

| 컴포넌트 | 변경 사항 |
|----------|----------|
| `LibraryPanel` | 검색/필터/그리드 통합, 데이터 훅 연결 |
| `App` | 상태 관리 훅 연결 |
| `FloatingButton` | 동기화 상태 인디케이터 추가 (선택) |

### 레이아웃 설계

```
┌─────────────────────────┐
│ Booth Library      [X]  │  ← 헤더 + 닫기
├─────────────────────────┤
│ [🔍 검색...]            │  ← SearchBar
│ [전체] [즐겨찾기] [숨김] │  ← FilterTabs
│ [🔄 동기화] 150개 수집  │  ← SyncButton + 카운트
├─────────────────────────┤
│ ┌───┐ ┌───┐            │
│ │ 📦│ │ 📦│            │  ← ItemGrid
│ │img│ │img│            │
│ │ttl│ │ttl│            │
│ └───┘ └───┘            │
│ ┌───┐ ┌───┐            │
│ │ 📦│ │ 📦│            │
│ │...│ │...│            │
│ └───┘ └───┘            │
└─────────────────────────┘
```

### 성공 기준

- UI가 Shadow DOM 내에서 정상 렌더링
- 검색/필터가 실시간으로 동작
- 동기화 버튼 클릭 시 데이터 수집 + 그리드 표시

---

## Phase 5: 편의 기능 & 마무리

**Goal**: 사용성 향상 및 에러 처리.

### 작업 목록

- [ ] **에러 핸들링**
  - 로그인 안 된 상태 감지 → "Booth에 로그인해주세요" 안내
  - 네트워크 에러 → 재시도 버튼
  - 파싱 에러 → "데이터 구조가 변경됨" 안내
- [ ] **로딩 상태**
  - 동기화 중 프로그레스바
  - 스켈레톤 카드 표시
- [ ] **스마트 태그** (선택)
  - 상품명에 "Unity", "VRChat" 등 키워드 → 자동 태그
- [ ] **다운로드 직링크** (선택)
  - 카드 클릭 시 다운로드 파일 목록 표시
- [ ] **다크 모드** (선택)
  - Tailwind의 `dark:` 유틸리티 활용

### 성공 기준

- `tsc --noEmit` 통과
- `bun run build` 정상 완료
- Booth 페이지에서 확장프로그램 동작 확인

---

## 주의사항

1. **Rate Limiting**: 페이지 요청 간 1~2초 딜레이 필수 (차단 방지)
2. **쿠키 의존**: `credentials: 'include'` 없으면 로그인 세션 안 붙음
3. **HTML 구조 변경**: Booth.pm이 HTML을 바꾸면 파서가 깨짐 → 셀렉터를 상수로 분리하여 유지보수 용이하게
4. **Shadow DOM 제약**: 모든 스타일이 Shadow DOM 안에서 동작해야 함
5. **barrel export 금지**: `index.ts`에서 re-export 하지 않음, 직접 import
