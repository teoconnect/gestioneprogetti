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
    const data = await request.json();

    if (!data.tasks || !Array.isArray(data.tasks)) {
      return NextResponse.json({ error: "Invalid data format. Expected an array of tasks." }, { status: 400 });
    }

    const createdTasks = [];

    // Process tasks sequentially to ensure connections are handled properly
    for (const taskData of data.tasks) {
      let progress = taskData.progress !== undefined ? parseInt(taskData.progress, 10) : undefined;
      let status = taskData.status;

      // Synchronization logic
      if (status && progress === undefined) {
        if (status === "DONE") progress = 100;
        else if (status === "TODO") progress = 0;
        else if (status === "IN_PROGRESS") progress = 50;
      } else if (progress !== undefined && !status) {
        if (progress === 100) status = "DONE";
        else if (progress === 0) status = "TODO";
        else if (progress >= 1 && progress <= 99) status = "IN_PROGRESS";
      } else if (status && progress !== undefined) {
        if (status === "DONE") progress = 100;
        else if (status === "TODO") progress = 0;
        else if (status === "IN_PROGRESS" && (progress === 0 || progress === 100)) progress = 50;
      }

      const { userIds, ...otherTaskData } = taskData;

      const createdTask = await prisma.task.create({
        data: {
          projectId: otherTaskData.projectId,
          name: otherTaskData.name,
          startDate: new Date(otherTaskData.startDate),
          endDate: new Date(otherTaskData.endDate),
          status: status || "TODO",
          progress: progress !== undefined ? progress : 0,
          color: otherTaskData.color || null,
          dependencies: otherTaskData.dependencies || null,
          ...(userIds && userIds.length > 0 ? {
            users: {
              connect: userIds.map((id: string) => ({ id }))
            }
          } : {})
        }
      });
      createdTasks.push(createdTask);
    }

    return NextResponse.json({ success: true, tasks: createdTasks }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks/bulk error:", error);
    return NextResponse.json(
      { error: "Failed to create bulk tasks" },
      { status: 500 }
    );
  }
}
