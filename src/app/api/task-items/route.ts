import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTaskModificationEmail } from "@/lib/email";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Recupera l'utente
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    let username = "Utente sconosciuto";
    if (token) {
      try {
        const payload = await verifyAuth(token);
        if (payload && typeof payload.username === "string") {
          username = payload.username;
        }
      } catch (e) {
        // Ignora
      }
    }

    const taskItem = await prisma.taskItem.create({
      data,
      include: { task: true },
    });

    if (taskItem.task.notificationsEnabled && taskItem.task.notificationEmail) {
      await sendTaskModificationEmail(
        taskItem.task.notificationEmail,
        taskItem.task.name,
        taskItem.task.projectId,
        taskItem.taskId,
        username,
        [`Nuova riga dettaglio: ${taskItem.name}`]
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
