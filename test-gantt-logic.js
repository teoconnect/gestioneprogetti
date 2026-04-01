const projectTasks = [
    {
        id: 'task-1', // padre
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-05T00:00:00.000Z',
        dependencies: ''
    },
    {
        id: 'task-2', // figlio
        startDate: '2024-01-06T00:00:00.000Z',
        endDate: '2024-01-10T00:00:00.000Z',
        dependencies: 'task-1'
    }
];

const taskId = 'task-1';
const newStart = '2024-02-01T00:00:00.000Z'; // Spostato avanti di un mese
const newEnd = '2024-02-05T00:00:00.000Z';
const oldStart = '2024-01-01T00:00:00.000Z';

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

console.log(tasksToUpdate);
