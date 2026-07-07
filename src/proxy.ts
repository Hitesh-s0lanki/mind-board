import { NextResponse, type NextRequest } from "next/server";
import {
  createSessionId,
  SESSION_COOKIE_NAME,
  SESSION_HEADER_NAME,
} from "@/lib/session";

export function proxy(request: NextRequest) {
  const existingSessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionId = existingSessionId ?? createSessionId();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SESSION_HEADER_NAME, sessionId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (!existingSessionId) {
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionId,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
