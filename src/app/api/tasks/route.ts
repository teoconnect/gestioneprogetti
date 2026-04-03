import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    let progress = data.progress ? parseInt(data.progress, 10) : 0;
    const status = data.status || "TODO";

    if (status === "DONE") {
      progress = 100;
    }

    const task = await prisma.task.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: status,
        progress: progress,
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
