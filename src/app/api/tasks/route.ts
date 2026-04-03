import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    let progress = data.progress !== undefined ? parseInt(data.progress, 10) : undefined;
    let status = data.status;

    // Logica di sincronizzazione iniziale
    if (status && progress === undefined) {
      if (status === "DONE") progress = 100;
      else if (status === "TODO") progress = 0;
      else if (status === "IN_PROGRESS") progress = 50;
    } else if (progress !== undefined && !status) {
      if (progress === 100) status = "DONE";
      else if (progress === 0) status = "TODO";
      else if (progress >= 1 && progress <= 99) status = "IN_PROGRESS";
    } else if (status && progress !== undefined) {
      // Se entrambi sono forniti, diamo priorità alla coerenza (lo stato vince se discordanti?)
      // In base alla richiesta, implementiamo la sincronizzazione coerente.
      if (status === "DONE") progress = 100;
      else if (status === "TODO") progress = 0;
      // Per IN_PROGRESS, se il progresso è già tra 1-99 lo teniamo, altrimenti 50
      else if (status === "IN_PROGRESS" && (progress === 0 || progress === 100)) progress = 50;
    }

    const task = await prisma.task.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: status || "TODO",
        progress: progress !== undefined ? progress : 0,
        color: data.color || null,
        dependencies: data.dependencies || null,
      },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
