import { cookies, headers } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_HEADER_NAME } from "./session";

export async function getRequestSessionId() {
  const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);

  return (
    headerStore.get(SESSION_HEADER_NAME) ??
    cookieStore.get(SESSION_COOKIE_NAME)?.value ??
    null
  );
}
