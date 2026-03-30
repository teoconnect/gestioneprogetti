import { NextResponse } from "next/server";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const usersStr = process.env.APP_USERS || "admin:admin123,user:user123";
    const usersList = usersStr.split(",").map((u) => u.trim()).filter(Boolean);

    let isValid = false;

    for (const userConfig of usersList) {
      const [confUser, confPass] = userConfig.split(":");
      if (confUser === username && confPass === password) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createToken(username);

    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
