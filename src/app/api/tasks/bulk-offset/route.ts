import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { taskIds, daysOffset } = await request.json();

    if (!Array.isArray(taskIds) || typeof daysOffset !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (taskIds.length === 0 || daysOffset === 0) {
      return NextResponse.json({ message: "No updates needed" });
    }

    // Fetch the tasks to get their current dates
    const tasks = await prisma.task.findMany({
      where: {
        id: { in: taskIds },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
      },
    });

    // Update each task individually within a transaction
    const updatePromises = tasks.map((task) => {
      // Calculate new dates by adding/subtracting days (milliseconds)
      const newStartDate = new Date(task.startDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
      const newEndDate = new Date(task.endDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);

      return prisma.task.update({
        where: { id: task.id },
        data: {
          startDate: newStartDate,
          endDate: newEndDate,
        },
      });
    });

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ message: "Tasks updated successfully" });
  } catch (error) {
    console.error("Bulk offset error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
