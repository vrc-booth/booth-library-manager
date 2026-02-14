import { browser } from "wxt/browser";
export async function injectScript(path, options) {
  const url = browser.runtime.getURL(path);
  const script = document.createElement("script");
  if (browser.runtime.getManifest().manifest_version === 2) {
    script.text = await fetch(url).then((res) => res.text());
  } else {
    script.src = url;
  }
  const loadedPromise = makeLoadedPromise(script);
  await options?.modifyScript?.(script);
  (document.head ?? document.documentElement).append(script);
  if (!options?.keepInDom) {
    script.remove();
  }
  await loadedPromise;
  return {
    script
  };
}
function makeLoadedPromise(script) {
  return new Promise((resolve, reject) => {
    const onload = () => {
      resolve();
      cleanup();
    };
    const onerror = () => {
      reject(new Error(`Failed to load script: ${script.src}`));
      cleanup();
    };
    const cleanup = () => {
      script.removeEventListener("load", onload);
      script.removeEventListener("error", onerror);
    };
    script.addEventListener("load", onload);
    script.addEventListener("error", onerror);
  });
}
