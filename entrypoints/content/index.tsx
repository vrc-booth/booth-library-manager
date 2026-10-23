import { ContentScriptContext } from "#imports";
import ReactDOM from "react-dom/client";
import "~/assets/tailwind.css";
import App from "./App.tsx";

const OVERLAY_Z_INDEX = 1100;

export default defineContentScript({
  matches: ["https://accounts.booth.pm/*"],
  cssInjectionMode: "ui",

  async main(ctx: ContentScriptContext) {
    const ui = await createShadowRootUi(ctx, {
      name: 'booth-library',
      position: 'overlay',
      anchor: 'body',
      zIndex: OVERLAY_Z_INDEX,
      onMount: (container, shadow, shadowHost) => {
        // Shadow host의 position 스타일이 :host{all:initial!important}에 의해
        // 리셋되므로, !important로 다시 강제 적용
        shadowHost.style.setProperty("position", "relative", "important");
        shadowHost.style.setProperty("width", "0", "important");
        shadowHost.style.setProperty("height", "0", "important");
        shadowHost.style.setProperty("overflow", "visible", "important");
        shadowHost.style.setProperty("display", "block", "important");
        shadowHost.style.setProperty("z-index", String(OVERLAY_Z_INDEX), "important");

        const root = ReactDOM.createRoot(container);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
