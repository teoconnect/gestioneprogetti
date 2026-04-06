import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await verifyAuth(token); // Just verify they are logged in
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
      },
      orderBy: { username: "asc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users list:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
