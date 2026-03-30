import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const task = await prisma.task.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
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
