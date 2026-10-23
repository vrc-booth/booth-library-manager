import { useEffect, useState } from "react";
import { checkLoggedIn } from "../utils/session.ts";

export type LoginStatus = "checking" | "logged-in" | "logged-out";

export function useLoginStatus(): LoginStatus {
  const [status, setStatus] = useState<LoginStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    checkLoggedIn()
      .then((isLoggedIn) => {
        if (!cancelled) {
          setStatus(isLoggedIn ? "logged-in" : "logged-out");
        }
      })
      .catch((error: unknown) => {
        // 확인에 실패했을 때 로그인한 사용자가 버튼을 못 쓰게 되지 않도록 보여주는 쪽으로 둔다.
        console.warn("[booth-library-manager] Failed to check login status", error);
        if (!cancelled) {
          setStatus("logged-in");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
