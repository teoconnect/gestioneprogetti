import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";
import { sendTaskModificationEmail } from "@/lib/email";
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

    const whereClause: any = { id: resolvedParams.id };
    if (session.role !== "ADMIN") {
      // Ensure the user has access to the task's project
      whereClause.project = {
        users: {
          some: {
            id: session.id,
          },
        },
      };
    }

    const task = await prisma.task.findFirst({
      where: whereClause,
      include: {
        items: true,
        users: {
          select: {
            id: true,
            username: true,
          }
        },
        notifiedUsers: {
          select: {
            id: true,
            username: true,
          }
        }
      },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch task" },
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
    const updateData = { ...data };

    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    if (updateData.progress !== undefined) {
      updateData.progress = parseInt(updateData.progress, 10);
    }

    const { userIds, notifiedUserIds, notificationsEnabled, ...taskData } = updateData;

    // Recupera il task originale per confrontare i campi
    const originalTask = await prisma.task.findUnique({
      where: { id: resolvedParams.id },
      include: {
        users: { select: { email: true } },
        notifiedUsers: { select: { email: true } },
        project: {
          include: {
            users: { select: { email: true } }
          }
        }
      }
    });

    // Gestione automatica bidirezionale dello stato e del progresso
    if (originalTask) {
      const statusChanged = updateData.status !== undefined && updateData.status !== originalTask.status;
      const progressChanged = updateData.progress !== undefined && updateData.progress !== originalTask.progress;

      if (statusChanged && !progressChanged) {
        // Se cambia lo stato, aggiorniamo il progresso
        if (updateData.status === "DONE") {
          updateData.progress = 100;
        } else if (updateData.status === "TODO") {
          updateData.progress = 0;
        } else if (updateData.status === "IN_PROGRESS") {
          updateData.progress = 50;
        }
      } else if (progressChanged) {
        // Se cambia il progresso, aggiorniamo lo stato
        const progress = updateData.progress;
        if (progress === 100) {
          updateData.status = "DONE";
        } else if (progress === 0) {
          updateData.status = "TODO";
        } else if (progress >= 1 && progress <= 99) {
          updateData.status = "IN_PROGRESS";
        }
      }
    }

    const task = await prisma.task.update({
      where: { id: resolvedParams.id },
      data: {
        ...taskData,
        ...(userIds !== undefined ? {
          users: {
            set: userIds.map((id: string) => ({ id }))
          }
        } : {}),
        ...(notifiedUserIds !== undefined ? {
          notifiedUsers: {
            set: notifiedUserIds.map((id: string) => ({ id }))
          }
        } : {})
      },
    });

    // Trova le differenze
    const changedFields: string[] = [];
    if (originalTask) {
      if (originalTask.name !== task.name) changedFields.push("Nome");
      if (originalTask.description !== task.description) changedFields.push("Descrizione");
      if (new Date(originalTask.startDate).toISOString().split('T')[0] !== new Date(task.startDate).toISOString().split('T')[0]) changedFields.push("Data Inizio");
      if (new Date(originalTask.endDate).toISOString().split('T')[0] !== new Date(task.endDate).toISOString().split('T')[0]) changedFields.push("Data Fine");
      if (originalTask.status !== task.status) changedFields.push("Stato");
      if (originalTask.progress !== task.progress) changedFields.push("Progresso");
      if (originalTask.color !== task.color) changedFields.push("Colore");
      if (originalTask.dependencies !== task.dependencies) changedFields.push("Dipendenze");
    } else {
      changedFields.push("Task aggiornato in modo massivo");
    }

    const updatedTaskWithRelations = await prisma.task.findUnique({
      where: { id: task.id },
      include: {
        users: { select: { email: true } },
        notifiedUsers: { select: { email: true } },
        project: {
          include: {
            users: { select: { email: true } }
          }
        }
      }
    });

    if (updatedTaskWithRelations && updatedTaskWithRelations.notifiedUsers.length > 0 && changedFields.length > 0) {
      const recipients = updatedTaskWithRelations.notifiedUsers.filter(u => u.email).map(u => u.email as string);

      if (recipients.length > 0) {
        await sendTaskModificationEmail(
          recipients,
          task.name,
          task.projectId,
          task.id,
          username,
          changedFields
        ).catch(e => console.error("Error sending email on task update:", e));
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update task" },
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

    // Recupera tutti i task items di tipo allegato collegati a questo task
    const attachmentItems = await prisma.taskItem.findMany({
      where: {
        taskId: resolvedParams.id,
        type: "attachment"
      },
    });

    // Elimina i file fisici degli allegati
    for (const item of attachmentItems) {
      if (item.value) {
        try {
          const filename = item.value.split("/").pop();
          if (filename) {
            const filepath = path.join(process.cwd(), "public", "uploads", filename);
            await unlink(filepath);
          }
        } catch (err) {
          console.error("Errore durante l'eliminazione del file allegato dal task:", err);
        }
      }
    }

    await prisma.task.delete({
      where: { id: resolvedParams.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
