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

    const taskWithUsers = await prisma.task.findUnique({
      where: { id: taskItem.taskId },
      include: {
        notifiedUsers: { select: { email: true } }
      }
    });

    if (taskWithUsers && taskWithUsers.notifiedUsers.length > 0) {
      const recipients = taskWithUsers.notifiedUsers.filter(u => u.email).map(u => u.email as string);

      if (recipients.length > 0) {
        await sendTaskModificationEmail(
          recipients,
          taskWithUsers.name,
          taskWithUsers.projectId,
          taskWithUsers.id,
          username,
          [`Nuova riga dettaglio aggiunta: ${taskItem.name}`]
        ).catch(e => console.error("Error sending email on task item create:", e));
      }
    }

    return NextResponse.json(taskItem, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task item" },
      { status: 500 }
    );
  }
}
