const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.create({
    data: {
      code: 'TEST-8' + Date.now(),
      name: 'Test Project 8',
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

  // Here comes getTasksToUpdateWithDependencies logic:

  const getTasksToUpdateWithDependencies = (projectTasks, taskId, newStart, newEnd, oldStart) => {
    const offsetMs = new Date(newStart).getTime() - new Date(oldStart).getTime();
    const tasksToUpdate = [{ id: taskId, start: newStart, end: newEnd }];
    const processedIds = new Set([taskId]);

    if (offsetMs !== 0) {
      const findDependencies = (parentId) => {
        const children = projectTasks.filter(t => {
          if (!t.dependencies) return false;
          const deps = t.dependencies.split(",").map(d => d.trim());
          return deps.includes(parentId);
        });

        for (const child of children) {
          if (processedIds.has(child.id)) continue;
          processedIds.add(child.id);

          const childOldStart = new Date(child.startDate).getTime();
          const childOldEnd = new Date(child.endDate).getTime();

          const childNewStart = new Date(childOldStart + offsetMs).toISOString();
          const childNewEnd = new Date(childOldEnd + offsetMs).toISOString();

          tasksToUpdate.push({ id: child.id, start: childNewStart, end: childNewEnd });
          findDependencies(child.id);
        }
      };

      findDependencies(taskId);
    }
    return tasksToUpdate;
  };

  const p1 = await prisma.project.findUnique({
    where: { id: project.id },
    include: { tasks: true }
  });

  const newStart = '2024-05-01T00:00:00.000Z'; // Spostato avanti di un mese
  const newEnd = '2024-05-05T00:00:00.000Z';
  const originalStartDate = p1.tasks.find(t => t.id === task1.id).startDate;

  const tasksToUpdate = getTasksToUpdateWithDependencies(p1.tasks, task1.id, newStart, newEnd, originalStartDate);

  console.log("Tasks to update:", tasksToUpdate);

  for (const update of tasksToUpdate) {
        await fetch(`http://localhost:3000/api/tasks/${update.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: update.start,
            endDate: update.end,
          }),
        });
  }

  // await to let local server update db
  await new Promise(r => setTimeout(r, 2000));

  const p2 = await prisma.project.findUnique({
    where: { id: project.id },
    include: { tasks: true }
  });

  console.log(p2.tasks.map(t => `${t.name}: ${t.startDate} - ${t.endDate}`));
}

main();
