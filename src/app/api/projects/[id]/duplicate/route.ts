import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const resolvedParams = await params;
    const { newName } = await request.json();

    if (!newName) {
      return NextResponse.json({ error: "Nuovo nome del progetto mancante" }, { status: 400 });
    }

    // Authorization check
    const whereClause: any = { id: resolvedParams.id };
    if (session.role !== "ADMIN") {
      whereClause.users = {
        some: {
          id: session.id,
        },
      };
    }

    // Fetch the original project with all its relations
    const originalProject = await prisma.project.findFirst({
      where: whereClause,
      include: {
        users: true,
        tasks: {
          include: {
            items: true,
            users: true,
            notifiedUsers: true,
          },
        },
      },
    });

    if (!originalProject) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    const newProjectCode = `PRJ-${Date.now()}`;

    // Create the new project in a transaction to ensure all related data is inserted successfully
    const duplicatedProject = await prisma.$transaction(async (tx) => {
      // 1. Create the new project
      const newProject = await tx.project.create({
        data: {
          name: newName,
          code: newProjectCode,
          description: originalProject.description,
          status: "active",
          users: {
            connect: originalProject.users.map(u => ({ id: u.id }))
          }
        }
      });

      // 2. Duplicate tasks and their items
      for (const task of originalProject.tasks) {
        await tx.task.create({
          data: {
            projectId: newProject.id,
            name: task.name,
            description: task.description,
            startDate: task.startDate,
            endDate: task.endDate,
            color: task.color,
            dependencies: task.dependencies,
            status: "TODO",
            progress: 0,
            users: {
              connect: task.users.map(u => ({ id: u.id }))
            },
            notifiedUsers: {
              connect: task.notifiedUsers.map(u => ({ id: u.id }))
            },
            items: {
              create: task.items.map(item => ({
                type: item.type,
                name: item.name,
                description: item.description,
                value: null // Reset value for duplicated items
              }))
            }
          }
        });
      }

      return newProject;
    });

    return NextResponse.json({ success: true, newProjectId: duplicatedProject.id }, { status: 201 });
  } catch (error) {
    console.error("Duplicate project error:", error);
    return NextResponse.json(
      { error: "Failed to duplicate project" },
      { status: 500 }
    );
  }
}
