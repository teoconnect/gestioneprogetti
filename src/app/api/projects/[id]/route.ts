import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) return null;
  try {
    return await verifyAuth(token);
  } catch (error) {
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resolvedParams = await params;

    // Authorization check for single project access
    const whereClause: any = { id: resolvedParams.id };
    if (session.role !== "ADMIN") {
      whereClause.users = {
        some: {
          id: session.id,
        },
      };
    }

    const project = await prisma.project.findFirst({
      where: whereClause,
      include: {
        users: {
          select: {
            id: true,
            username: true,
          }
        },
        tasks: {
          include: {
            items: true,
            users: {
              select: {
                id: true,
                username: true
              }
            }
          },
          orderBy: { startDate: "asc" },
        },
      },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const data = await request.json();

    const { userIds, ...projectData } = data;

    const updateData: any = { ...projectData };
    delete updateData.defaultNotificationEmail;

    if (userIds) {
       updateData.users = {
           set: userIds.map((id: string) => ({ id }))
       };
    }

    const project = await prisma.project.update({
      where: { id: resolvedParams.id },
      data: updateData,
    });
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    // Recupera tutti i task items di tipo allegato collegati a questo progetto
    const project = await prisma.project.findUnique({
      where: { id: resolvedParams.id },
      include: {
        tasks: {
          include: {
            items: {
              where: { type: "attachment" }
            }
          }
        }
      }
    });

    if (project) {
      for (const task of project.tasks) {
        for (const item of task.items) {
          if (item.value) {
            try {
              const filename = item.value.split("/").pop();
              if (filename) {
                const filepath = path.join(process.cwd(), "public", "uploads", filename);
                await unlink(filepath);
              }
            } catch (err) {
              console.error("Errore durante l'eliminazione del file allegato dal progetto:", err);
            }
          }
        }
      }
    }

    await prisma.project.delete({
      where: { id: resolvedParams.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
