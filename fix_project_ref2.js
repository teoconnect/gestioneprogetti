const fs = require('fs');

let content = fs.readFileSync('src/app/projects/[id]/page.tsx', 'utf8');

content = content.replace(/const totalTasks = currentProject.tasks.length;/g, 'const totalTasks = project.tasks.length;');
content = content.replace(/const overdueTasks = currentProject.tasks/g, 'const overdueTasks = project.tasks');
content = content.replace(/const tasksWithAttachments = currentProject.tasks/g, 'const tasksWithAttachments = project.tasks');
content = content.replace(/<GanttChartWrapper tasks=\{currentProject\.tasks\}/g, '<GanttChartWrapper tasks={project.tasks}');
content = content.replace(/currentProject\.tasks\.length === 0/g, 'project.tasks.length === 0');
content = content.replace(/currentProject\.tasks\.map/g, 'project.tasks.map');

fs.writeFileSync('src/app/projects/[id]/page.tsx', content);
