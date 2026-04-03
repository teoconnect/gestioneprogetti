import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";
import { sendTaskModificationEmail } from "@/lib/email";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth";

async function deleteFileIfAttachment(type: string, value: string | null) {
  if (type === "attachment" && value) {
    try {
      const filename = value.split("/").pop();
      if (filename) {
        const filepath = path.join(process.cwd(), "public", "uploads", filename);
        await unlink(filepath);
      }
    } catch (err) {
      console.error("Errore durante l'eliminazione del file allegato:", err);
    }
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
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

    // Recupera l'elemento esistente per controllare se è un allegato e se il valore sta cambiando
    const existingItem = await prisma.taskItem.findUnique({
      where: { id: resolvedParams.id },
    });

    if (existingItem && existingItem.type === "attachment" && data.value && existingItem.value !== data.value) {
      // Se era un allegato, e il nuovo valore è diverso, elimina il vecchio file
      await deleteFileIfAttachment(existingItem.type, existingItem.value);
    }

    const taskItem = await prisma.taskItem.update({
      where: { id: resolvedParams.id },
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
        [`Riga dettaglio modificata: ${taskItem.name}`]
      ).catch(e => console.error("Error sending email on task item update:", e));
    }

    return NextResponse.json(taskItem);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update task item" },
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

    // Recupera l'elemento per verificare se è un allegato
    const existingItem = await prisma.taskItem.findUnique({
      where: { id: resolvedParams.id },
    });

    if (existingItem) {
      await deleteFileIfAttachment(existingItem.type, existingItem.value);
    }

    await prisma.taskItem.delete({
      where: { id: resolvedParams.id },
    });

    if (existingItem) {
      const task = await prisma.task.findUnique({ where: { id: existingItem.taskId } });

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

      if (task && task.notificationsEnabled && task.notificationEmail) {
        await sendTaskModificationEmail(
          task.notificationEmail,
          task.name,
          task.projectId,
          task.id,
          username,
          [`Riga dettaglio eliminata: ${existingItem.name}`]
        ).catch(e => console.error("Error sending email on task item delete:", e));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete task item" },
      { status: 500 }
    );
  }
}
