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

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { taskIds } = await request.json();

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
      },
      include: {
        items: true,
        users: true,
        notifiedUsers: true,
        project: {
          include: {
            users: true
          }
        }
      },
    });

    // Check authorization for all tasks
    if (session.role !== "ADMIN") {
        for (const task of tasks) {
            const isMember = task.project.users.some(u => u.id === session.id);
            if (!isMember) {
                return NextResponse.json({ error: "Unauthorized access to some tasks" }, { status: 403 });
            }
        }
    }

    const duplicatePromises = tasks.map((task) => {
      return prisma.task.create({
        data: {
          projectId: task.projectId,
          name: `${task.name} (Copia)`,
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
    });

    await prisma.$transaction(duplicatePromises);

    return NextResponse.json({ message: "Tasks duplicated successfully" });
  } catch (error) {
    console.error("Bulk duplicate error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
