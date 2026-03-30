import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  const verifiedToken =
    token &&
    (await verifyAuth(token).catch((err) => {
      console.error(err.message);
    }));

  if (req.nextUrl.pathname.startsWith("/login") && !verifiedToken) {
    return;
  }

  const url = req.url;

  if (
    url.includes("/login") &&
    verifiedToken
  ) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!verifiedToken) {
    // API routes
    if (req.nextUrl.pathname.startsWith("/api/")) {
      // Allow login API
      if (req.nextUrl.pathname === "/api/auth/login") {
        return;
      }
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
