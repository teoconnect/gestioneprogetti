const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.create({
    data: {
      code: 'TEST-5' + Date.now(),
      name: 'Test Project 5',
    }
  });

  const task1 = await prisma.task.create({
    data: {
      projectId: project.id,
      name: 'Task 1',
      startDate: new Date('2024-04-01T00:00:00.000Z'),
      endDate: new Date('2024-04-05T00:00:00.000Z'),
    }
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project.id,
      name: 'Task 2',
      startDate: new Date('2024-04-06T00:00:00.000Z'),
      endDate: new Date('2024-04-10T00:00:00.000Z'),
      dependencies: task1.id
    }
  });

  console.log("Task1:", task1.id, "Task2:", task2.id);

  // Simulate the drag (offsetMs = 1 month)
  const offsetMs = new Date('2024-05-01T00:00:00.000Z').getTime() - new Date('2024-04-01T00:00:00.000Z').getTime();

  // Task 1 Update
  await prisma.task.update({
    where: { id: task1.id },
    data: { startDate: new Date('2024-05-01T00:00:00.000Z'), endDate: new Date('2024-05-05T00:00:00.000Z') }
  });

  // Task 2 Update
  const childOldStart = new Date(task2.startDate).getTime();
  const childOldEnd = new Date(task2.endDate).getTime();

  const childNewStart = new Date(childOldStart + offsetMs).toISOString();
  const childNewEnd = new Date(childOldEnd + offsetMs).toISOString();

  await prisma.task.update({
    where: { id: task2.id },
    data: { startDate: childNewStart, endDate: childNewEnd }
  });

  const p = await prisma.project.findUnique({
    where: { id: project.id },
    include: { tasks: true }
  });

  console.log(p.tasks.map(t => `${t.name}: ${t.startDate} - ${t.endDate}`));
}

main();
