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

console.log("Tasks length at beginning: ", tasksToUpdate.length);
