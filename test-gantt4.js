const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.create({
    data: {
      code: 'TEST-4' + Date.now(),
      name: 'Test Project 4',
    }
  });

  const task1 = await prisma.task.create({
    data: {
      projectId: project.id,
      name: 'Task 1',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-05'),
    }
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project.id,
      name: 'Task 2',
      startDate: new Date('2023-01-06'),
      endDate: new Date('2023-01-10'),
      dependencies: task1.id
    }
  });

  console.log(`Created project with tasks ${project.id} Task1: ${task1.id} Task2: ${task2.id}`);
}

main();
