const LIBRARY_URL = "https://accounts.booth.pm/library";
const AUTH_PAGE_PATTERN = /^\/users\/(sign_in|sign_up|password)/;

/**
 * 로그인하지 않으면 BOOTH가 라이브러리 페이지를 로그인 페이지로 리다이렉트(302)한다.
 * 본문을 받지 않도록 HEAD로 요청하고, 리다이렉트는 따라가지 않는다.
 */
export async function checkLoggedIn(): Promise<boolean> {
  if (AUTH_PAGE_PATTERN.test(window.location.pathname)) {
    return false;
  }

  const response = await fetch(LIBRARY_URL, {
    method: "HEAD",
    credentials: "include",
    redirect: "manual",
  });

  if (response.type === "opaqueredirect") {
    return false;
  }

  if (!response.ok) {
    throw new Error(`Failed to check login status: ${response.status}`);
  }

  return true;
}
