const fs = require('fs');

let content = fs.readFileSync('src/app/projects/[id]/page.tsx', 'utf8');

// Aggiungiamo un log dentro handleGanttTaskUpdate
content = content.replace(/const handleGanttTaskUpdate = async \(task: Task, start: string, end: string\) => \{/g,
`const handleGanttTaskUpdate = async (task: Task, start: string, end: string) => {
    console.log("handleGanttTaskUpdate called for", task.name, start, end);`);

fs.writeFileSync('src/app/projects/[id]/page.tsx', content);
