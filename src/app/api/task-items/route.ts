import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const taskItem = await prisma.taskItem.create({
      data,
    });
    return NextResponse.json(taskItem, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task item" },
      { status: 500 }
    );
  }
}
