제안해 드린 내용과 검토 사항을 모두 반영하여, 실제 개발 시 체크리스트로 활용할 수 있는 `plan.md` 파일을 작성해 드립니다.

이 내용을 프로젝트 루트에 저장해두고 진행 상황을 체크하며 개발하시면 됩니다.

````markdown
# Booth Library Manager - Development Plan

## 1. 프로젝트 개요

**Booth.pm**의 구매 내역(Library)을 효율적으로 관리, 검색, 필터링할 수 있는 크롬 확장프로그램입니다. 공식 API 부재로 인한 **DOM Parsing** 방식을 사용하며, 사용자 경험을 위해 **Overlay UI**를 제공합니다.

---

## 2. 기술 스택 & 환경

- **Core**: WXT (Web Extension Tools)
- **Framework**: React 19
- **State/Cache**: TanStack Query v5
- **Styling**: Tailwind CSS v4 (in Shadow DOM)
- **Target**: Chrome Desktop
- **Permissions**: `storage`, `host_permissions: ["*://*.booth.pm/*"]`

---

## 3. 디렉토리 구조 (제안)

```bash
src/
├── components/
│   ├── ui/           # 공용 UI (Button, Input, Badge etc)
│   ├── features/     # 도메인 로직 컴포넌트
│   │   ├── ItemCard.tsx      # 개별 상품 카드
│   │   ├── FilterBar.tsx     # 검색 및 필터
│   │   └── LibraryList.tsx   # 상품 목록 리스트
│   └── OverlayLayout.tsx     # 메인 패널 레이아웃
├── entrypoints/
│   └── overlay.content.tsx   # Content Script 진입점 (Shadow DOM 설정)
├── hooks/
│   ├── useLibraryFetcher.ts  # 파싱 및 데이터 Fetching (TanStack Query)
│   └── useUserPreferences.ts # 즐겨찾기/숨김 상태 관리 (Chrome Storage)
├── utils/
│   ├── parser.ts     # HTML -> JSON 변환 로직 (순수 함수)
│   └── storage.ts    # Storage Type-safe Wrapper
└── types/
    └── index.ts      # Item, UserPreference 타입 정의
```
````

---

## 4. 핵심 로직 설계

### A. 데이터 파싱 (Data Fetching)

1. **Endpoint**: `https://accounts.booth.pm/library`
2. **Pagination**: `?page=n` 쿼리 파라미터 사용.
3. **Flow**:

- React Query `useInfiniteQuery` 사용.
- `fetch` 요청 (credentials: include) → `text()` 변환.
- `DOMParser`로 HTML 변환.
- `querySelectorAll`로 아이템 순회하며 데이터 추출 (ID, Thumbnail, Title, Url).
- _Next Page 감지_: Pagination 영역에 'Next' 버튼이 존재하는지 확인.

### B. 상태 저장 (Persisting State)

- **Chrome Storage Local**: 유저의 설정값만 저장 (가볍게 유지).

```typescript
interface StorageSchema {
  favorites: string[]; // item_id list
  hidden: string[]; // item_id list
  uiPosition: { x: number; y: number }; // (Optional) 버튼 위치
}
```

- **React Query Cache**: 파싱된 상품 정보(이미지, 텍스트)는 메모리 캐시에만 유지 (`staleTime: 5min`).

### C. UI/UX 전략

- **Shadow DOM**: 페이지 스타일 충돌 방지 (`createShadowRootUi`).
- **Floating Button**: 우측 하단 고정, 드래그 가능 여부 고려.
- **Expansion**: 버튼 클릭 시 사이드 패널(Drawer) 형태 또는 팝오버 형태로 확장.

---

## 5. 단계별 구현 계획 (Roadmap)

### Phase 1: 프로젝트 셋업 & 환경 구성

- [x] WXT + React + Tailwind CSS v4 프로젝트 초기화
- [x] `manifest.json` 권한 설정 (`host_permissions`)
- [x] Tailwind CSS가 Shadow DOM 내에서 작동하도록 설정 (PostCSS/Inject)
- [ ] 기본 Overlay UI(버튼)가 Booth 페이지에 뜨는지 확인

### Phase 2: 파싱 로직 구현 (Core)

- [ ] `src/utils/parser.ts` 구현 (단일 페이지 HTML에서 데이터 추출 테스트)
- [ ] `src/hooks/useLibraryFetcher.ts` 구현 (API Fetching + Parsing 연결)
- [ ] 페이지네이션 로직 구현 (다음 페이지 가져오기)
- [ ] **Test**: 콘솔에 구매 내역 리스트가 정상적으로 출력되는지 확인

### Phase 3: UI 컴포넌트 개발

- [ ] `OverlayLayout` 구현 (헤더, 닫기, 바디 구조)
- [ ] `ItemCard` 구현 (썸네일, 제목, 스타일링)
- [ ] `LibraryList` 구현 (스켈레톤 UI, 가상 스크롤 혹은 페이지네이션 UI)
- [ ] 데이터 연동 (React Query hooks → UI 바인딩)

### Phase 4: 기능 고도화

- [ ] **검색 기능**: 클라이언트 사이드 필터링 구현
- [ ] **상태 관리**: `useUserPreferences` 훅 구현 (Chrome Storage 연동)
- [ ] 아이템 카드에 '즐겨찾기(❤️)', '숨기기(👁️‍🗨️)' 버튼 기능 연결
- [ ] 탭 기능 구현 (전체 / 즐겨찾기 / 숨김 목록 전환)

### Phase 5: 최적화 및 배포

- [ ] 빌드 최적화 및 불필요한 리소스 제거
- [ ] 에러 핸들링 (로그인 풀림, 파싱 에러 시 UI 처리)
- [ ] 최종 테스트 (다양한 데이터 케이스, 라이트/다크 모드 대응 확인)

```

```
