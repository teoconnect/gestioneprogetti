import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTaskModificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const taskItem = await prisma.taskItem.create({
      data,
      include: { task: true },
    });

    if (taskItem.task.notificationsEnabled && taskItem.task.notificationEmail) {
      await sendTaskModificationEmail(
        taskItem.task.notificationEmail,
        taskItem.task.name,
        taskItem.task.projectId,
        taskItem.taskId
      ).catch(e => console.error("Error sending email on task item create:", e));
    }

    return NextResponse.json(taskItem, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task item" },
      { status: 500 }
    );
  }
}
