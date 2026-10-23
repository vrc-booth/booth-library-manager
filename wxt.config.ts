import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type WxtViteConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: (): WxtViteConfig => ({
    plugins: [tailwindcss()],
  } as WxtViteConfig),
  modules: ['@wxt-dev/module-react'],
  manifest: {
    key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqCr1Qci7akMBXq1JtkbrsB2gPZil2DwQ9wfdrCSloIr8ilMXmjwmijkOMLuDLZUjXtg8z7/IBiBc6Dp4vfy0a4VRsJlphvgeS7qt/kMfdBvRansAcBrE0VhUVK5VmU/OYgowJTaLavpvWCGJRAND1OqNNt3V8Y1G6MgXEcTkz/evnw3WEU7n40n06/F6PX/4tyLrRRBvb2oqSLQwBYH+fIL0gtAQ3MINvsbwfHiEtorWvNRXaKNX4nGXsHX0f0WxsI9mbVUnaglaeATx+AaVKEy5tC6sn0eVZg6yFLz903TIsCN1K4fZcuTC88WA/tYeg3nQ6uxNYOrBkNLfcMmSaQIDAQAB",
    permissions: ["storage", "tabs"],
    host_permissions: ["*://*.booth.pm/*"],
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
  },
  webExt: {
    startUrls: ["https://accounts.booth.pm/library"],
  },
  outDir: 'dist',
});
