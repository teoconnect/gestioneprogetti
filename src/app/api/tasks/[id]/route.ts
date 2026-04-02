import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";
import { sendTaskModificationEmail } from "@/lib/email";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const data = await request.json();
    console.log(`[API PUT] Task ${resolvedParams.id} data received:`, JSON.stringify(data));
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

    const task = await prisma.task.update({
      where: { id: resolvedParams.id },
      data: updateData,
    });

    if (task.notificationsEnabled && task.notificationEmail) {
      await sendTaskModificationEmail(
        task.notificationEmail,
        task.name,
        task.projectId,
        task.id
      ).catch(e => console.error("Error sending email on task update:", e));
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
