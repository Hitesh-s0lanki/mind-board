export const SESSION_COOKIE_NAME = "mind_board_session_id";
export const SESSION_HEADER_NAME = "x-mind-board-session-id";

export function createSessionId() {
  return `session_${crypto.randomUUID()}`;
}

export function readSessionIdFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const sessionCookie = cookies.find((cookie) =>
    cookie.startsWith(`${SESSION_COOKIE_NAME}=`),
  );

  if (!sessionCookie) {
    return null;
  }

  return decodeURIComponent(sessionCookie.split("=").slice(1).join("="));
}

export function readSessionIdFromRequest(request: Request) {
  return (
    request.headers.get(SESSION_HEADER_NAME) ??
    readSessionIdFromCookieHeader(request.headers.get("cookie"))
  );
}
