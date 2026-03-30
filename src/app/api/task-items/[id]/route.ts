import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const data = await request.json();
    const taskItem = await prisma.taskItem.update({
      where: { id: resolvedParams.id },
      data,
    });
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
    await prisma.taskItem.delete({
      where: { id: resolvedParams.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete task item" },
      { status: 500 }
    );
  }
}
