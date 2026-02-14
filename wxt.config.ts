import tailwindcss from "@tailwindcss/vite";
import { defineConfig, WxtViteConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: (): WxtViteConfig => ({
    plugins: [tailwindcss()],
  } as WxtViteConfig),
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ["storage", "tabs"],
    host_permissions: ["*://*.booth.pm/*"],
  },
  webExt: {
    startUrls: ["https://accounts.booth.pm/library"],
  },
  outDir: 'dist',
});
