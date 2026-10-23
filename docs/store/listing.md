# Chrome 웹 스토어 등록 정보 (v1.1.0)

스토어 개발자 대시보드에 그대로 붙여 넣을 수 있게 정리한 문구입니다.

---

## 요약 (132자 이내)

**한국어**

> BOOTH 구매·선물 라이브러리를 사이드 패널에서 검색하고, 폴더로 정리하고, 원하는 파일만 골라 내려받으세요.

**English**

> Browse, search, and organize your BOOTH purchases and gifts in a side panel, with folders and selective file downloads.

---

## 상세 설명

**한국어**

```
BOOTH 라이브러리(accounts.booth.pm/library)에서 구매한 상품과 받은 선물을 한 화면에서 관리하는 확장 프로그램입니다.

■ 주요 기능
- 사이드 패널: BOOTH 라이브러리 페이지 오른쪽에 패널을 열어 구매·선물 목록을 카드로 봅니다.
- 검색: 상품 이름과 작가 이름으로 바로 찾습니다.
- 즐겨찾기·숨기기: 자주 쓰는 상품은 즐겨찾기, 보기 싫은 상품은 숨깁니다.
- Custom 폴더: 하위 폴더까지 만들어 상품을 정리합니다. 한 상품을 여러 폴더에 넣을 수 있고, 카드의 폴더 버튼·여러 개 선택·드래그 앤 드롭으로 넣습니다.
- 골라서 다운로드: 다운로드 버튼을 누르면 파일 목록이 뜨고, 체크한 파일만 새 탭 없이 바로 내려받습니다. 폴더 전체나 선택한 상품도 같은 방식으로 받습니다.
- 자동 동기화: 구매·선물 목록을 불러와 저장해 두고, 패널을 열 때와 1분마다 첫 페이지를 새로 확인합니다.

■ 개인정보
- 모든 데이터(목록 캐시, 즐겨찾기, 폴더 등)는 브라우저 안에만 저장되며, 개발자 서버로 보내지 않습니다.
- 로그인하지 않은 상태에서는 동작하지 않습니다.

※ 이 확장 프로그램은 pixiv 및 BOOTH와 관계없는 비공식 도구입니다.
```

**English**

```
Manage everything you bought or received as a gift on BOOTH (accounts.booth.pm/library) from one panel.

■ Features
- Side panel: open a panel on the BOOTH library page and see your purchases and gifts as cards.
- Search: find items by title or creator.
- Favorites and hidden items: pin the items you use often and hide the ones you don't.
- Custom folders: organize items into nested folders. An item can be in several folders. Add items with the folder button on a card, by selecting several items, or by drag and drop.
- Pick files to download: the download button opens a file list, and only the files you check are downloaded, without opening new tabs. Folders and selected items work the same way.
- Sync: your purchases and gifts are loaded and cached, and the first page is checked again when you open the panel and every minute.

■ Privacy
- All data (item cache, favorites, folders, and so on) stays in your browser and is never sent to the developer.
- The extension does nothing while you are signed out.

* This is an unofficial tool and is not affiliated with pixiv or BOOTH.
```

---

## 1.1.0 업데이트 내용

**한국어**

```
- Custom 탭 추가: 하위 폴더까지 만들어 상품을 정리할 수 있습니다.
- 다운로드 개선: 받을 파일을 골라 새 탭 없이 바로 내려받습니다. 폴더 전체·선택한 상품도 한 번에 받을 수 있습니다.
- 로그인하지 않은 상태에서는 버튼을 표시하지 않습니다.
- 사이드 패널 너비를 기억합니다.
- BOOTH 페이지 구조가 바뀌어도 업데이트 없이 대응할 수 있도록 개선했습니다.
- 필요 없는 권한을 정리했습니다.
```

**English**

```
- New Custom tab: organize items into nested folders.
- Better downloads: pick the files you want and download them without opening new tabs. Download a whole folder or selected items at once.
- The button is hidden while you are signed out.
- The side panel remembers its width.
- Faster recovery when BOOTH changes its page layout, without waiting for an extension update.
- Removed permissions that were no longer needed.
```

---

## 개인정보 보호 관행 탭

### 단일 목적

```
Help users manage their own BOOTH purchase and gift library on accounts.booth.pm: browse, search, organize into folders, and download purchased files.
```

### 권한 사유

| 권한 | 입력할 사유 |
|---|---|
| `storage` | Stores the user's favorites, hidden items, folders, the cached item list, and the panel width locally in the browser. |
| `downloads` | Downloads the purchased files the user picks in the download dialog directly, without opening a new tab for each file. Only https://booth.pm URLs are downloaded. |

사이트 접근 권한(`host_permissions`)은 요청하지 않습니다. 콘텐츠 스크립트는 `https://accounts.booth.pm/*`에서만 실행됩니다.

### 원격 코드 사용 여부

**"아니요, 원격 코드를 사용하지 않습니다"**를 선택합니다. 설명란에는 아래 내용을 적습니다.

```
The extension does not load or execute any remote code. It fetches one public JSON file (https://raw.githubusercontent.com/vrc-booth/booth-library-manager/main/rules/parser-rules.json) that contains only lists of CSS selector strings. These strings are passed to querySelectorAll to read the BOOTH library page. All logic is bundled in the extension package, and the extension falls back to built-in selectors if the file cannot be loaded.
```

### 개인정보 처리방침 URL

저장소의 `PRIVACY.md` 링크를 입력합니다.

```
https://github.com/vrc-booth/booth-library-manager/blob/main/PRIVACY.md
```

---

## 참고

- 스토어에 표시되는 이름은 매니페스트의 `name`을 따릅니다. 지금은 `booth-library-manager`입니다.
