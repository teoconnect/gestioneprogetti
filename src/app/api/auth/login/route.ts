import { NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // 1. Sync users from env if they don't exist
    const usersStr = process.env.APP_USERS || "admin:admin123,user:user123";
    const usersList = usersStr.split(",").map((u) => u.trim()).filter(Boolean);

    for (let i = 0; i < usersList.length; i++) {
      const [confUser, confPass] = usersList[i].split(":");
      const existingUser = await prisma.user.findUnique({
        where: { username: confUser },
      });

      if (!existingUser) {
        const passwordHash = await bcrypt.hash(confPass, 10);
        await prisma.user.create({
          data: {
            username: confUser,
            passwordHash,
            role: i === 0 ? "ADMIN" : "USER", // First user is ADMIN
            email: i === 0 ? "admin@example.com" : `user${i}@example.com`,
          },
        });
      }
    }

    // 2. Validate against Database
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await createToken(user.id, user.username, user.role);

    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );

    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: false, // Forzato a false per permettere i test su rete locale HTTP
      maxAge: 60 * 60 * 24 * 30, // 30 days
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
