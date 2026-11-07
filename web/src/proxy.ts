import { NextResponse, type NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE, type Session } from "@/lib/session";
import { accountState } from "@/lib/users";

// Paths reachable without a session. Everything else requires login.
const PUBLIC_PATHS = ["/login", "/api/health", "/robots.txt"];
// Only administrators: the panel. Pages and actions check again (requireAdmin).
const ADMIN_PATHS = ["/admin"];
// Where an account with a temporary password is sent until it sets its own.
const PASSWORD_PATH = "/account/password";

function under(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

// An account's session is valid only while the account is enabled and its
// session_version is the one in the cookie (a new password, role or
// disabling raises it). The main administrator has no row to check.
async function current(session: Session | null): Promise<Session | null> {
  if (!session?.uid) return session;
  try {
    const state = await accountState(session.uid);
    if (!state || state.disabled || state.session_version !== session.ver) return null;
    return { ...session, role: state.role, pc: state.must_change_password };
  } catch {
    // Without the database the site cannot show anything anyway; refuse.
    return null;
  }
}

function redirectTo(request: NextRequest, pathname: string, next?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (next) url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const read = readSessionToken(token);
  const session = await current(read);
  const { pathname, search } = request.nextUrl;

  if (!session) {
    if (under(pathname, PUBLIC_PATHS)) {
      const response = NextResponse.next();
      if (token) response.cookies.delete(SESSION_COOKIE);
      return response;
    }
    const response = redirectTo(request, "/login", pathname !== "/" ? pathname + search : undefined);
    // A cookie that no longer opens anything (disabled account, old password)
    // is removed, so the login page does not bounce back.
    if (token) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (pathname === "/login") return redirectTo(request, "/");

  if (session.pc && pathname !== PASSWORD_PATH && request.method === "GET") {
    return redirectTo(request, PASSWORD_PATH);
  }

  if (under(pathname, ADMIN_PATHS) && session.role !== "admin") {
    return redirectTo(request, "/");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except Next.js internals and static images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
