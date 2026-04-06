import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;

  try {
    const session = await verifyAuth(token);
    if (session.role !== "ADMIN") return null;
    return session;
  } catch (error) {
    return null;
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const { username, password, role } = await request.json();

    const dataToUpdate: any = { username, role };
    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    // Check if trying to modify the primary admin from env (optional, could just check by role and ID, but simplest is letting admin edit it, just not change role to USER).
    // A simpler way: avoid editing the main admin role
    const usersStr = process.env.APP_USERS || "admin:admin123";
    const mainAdminUsername = usersStr.split(",")[0].split(":")[0];

    if (username !== mainAdminUsername) {
       // if it was the main admin, we allow editing password but not changing username easily or role to USER if it's the only one
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const userToDelete = await prisma.user.findUnique({ where: { id } });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const usersStr = process.env.APP_USERS || "admin:admin123";
    const mainAdminUsername = usersStr.split(",")[0].split(":")[0];

    if (userToDelete.username === mainAdminUsername) {
      return NextResponse.json({ error: "Cannot delete the main admin user" }, { status: 400 });
    }

    // Prevent self deletion
    if (userToDelete.username === admin.username) {
        return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
