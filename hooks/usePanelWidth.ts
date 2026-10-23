import { useEffect, useRef, useState } from "react";
import { getPanelWidth, savePanelWidth } from "../utils/storage.ts";

export const MIN_PANEL_WIDTH = 320;
export const MAX_PANEL_WIDTH = 720;
const DEFAULT_PANEL_WIDTH = 384;
const SAVE_DELAY_MS = 300;

export function clampPanelWidth(width: number): number {
  return Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, width));
}

/**
 * 사이드바 너비를 확장 로컬 저장소에 남겨 다음에 열 때도 유지한다.
 * 드래그 중에는 값이 계속 바뀌므로 멈춘 뒤 한 번만 저장한다.
 */
export function usePanelWidth() {
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH);
  const [isLoaded, setIsLoaded] = useState(false);
  const savedWidthRef = useRef(DEFAULT_PANEL_WIDTH);

  useEffect(() => {
    let cancelled = false;

    getPanelWidth()
      .then((storedWidth) => {
        if (!cancelled && storedWidth !== null) {
          const width = clampPanelWidth(storedWidth);
          savedWidthRef.current = width;
          setPanelWidth(width);
        }
      })
      .catch((error: unknown) => {
        console.warn("[booth-library-manager] Failed to load panel width", error);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // 저장된 값을 읽기 전에 기본값으로 덮어쓰지 않도록 불러온 뒤부터, 바뀐 값만 저장한다.
    if (!isLoaded || panelWidth === savedWidthRef.current) {
      return;
    }

    const timeoutId = setTimeout(() => {
      savedWidthRef.current = panelWidth;
      savePanelWidth(panelWidth).catch((error: unknown) => {
        console.warn("[booth-library-manager] Failed to save panel width", error);
      });
    }, SAVE_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [isLoaded, panelWidth]);

  return [panelWidth, setPanelWidth] as const;
}
