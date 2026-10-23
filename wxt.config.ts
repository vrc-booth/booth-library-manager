import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type WxtViteConfig } from 'wxt';

// 개발 중 확장 ID를 스토어와 같게 고정하는 공개 키. 게시용 빌드에는 넣지 않는다.
const DEV_EXTENSION_KEY = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqCr1Qci7akMBXq1JtkbrsB2gPZil2DwQ9wfdrCSloIr8ilMXmjwmijkOMLuDLZUjXtg8z7/IBiBc6Dp4vfy0a4VRsJlphvgeS7qt/kMfdBvRansAcBrE0VhUVK5VmU/OYgowJTaLavpvWCGJRAND1OqNNt3V8Y1G6MgXEcTkz/evnw3WEU7n40n06/F6PX/4tyLrRRBvb2oqSLQwBYH+fIL0gtAQ3MINvsbwfHiEtorWvNRXaKNX4nGXsHX0f0WxsI9mbVUnaglaeATx+AaVKEy5tC6sn0eVZg6yFLz903TIsCN1K4fZcuTC88WA/tYeg3nQ6uxNYOrBkNLfcMmSaQIDAQAB";

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: (): WxtViteConfig => ({
    plugins: [tailwindcss()],
  } as WxtViteConfig),
  modules: ['@wxt-dev/module-react'],
  // host_permissions는 두지 않는다. 라이브러리 요청은 콘텐츠 스크립트의 같은 사이트 요청이고,
  // 파일 다운로드는 downloads 권한만으로, GitHub 규칙 파일은 공개 파일이라 권한 없이 받을 수 있다.
  manifest: ({ command }) => ({
    ...(command === "serve" ? { key: DEV_EXTENSION_KEY } : {}),
    permissions: ["storage", "downloads"],
    icons: {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png",
    },
    action: {
      default_icon: {
        "16": "icons/icon-16.png",
        "32": "icons/icon-32.png",
      },
    },
  }),
  webExt: {
    startUrls: ["https://accounts.booth.pm/library"],
  },
  outDir: 'dist',
});
