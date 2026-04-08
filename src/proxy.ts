import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAuth, createToken } from "./lib/auth";

export async function proxy(req: NextRequest) {
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

  // Sliding Session logic: if the token is valid but expires in less than 15 days, refresh it.
  const res = NextResponse.next();

  if (verifiedToken && verifiedToken.exp) {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = verifiedToken.exp - currentTime;
    const fifteenDaysInSeconds = 15 * 24 * 60 * 60;

    if (timeUntilExpiry < fifteenDaysInSeconds && timeUntilExpiry > 0) {
      // Refresh token
      const newToken = await createToken(verifiedToken.id, verifiedToken.username, verifiedToken.role);
      res.cookies.set({
        name: "auth-token",
        value: newToken,
        httpOnly: true,
        path: "/",
        secure: false, // Forzato a false per permettere i test su rete locale HTTP
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|manifest.json|sw.js|icons).*)"],
};
