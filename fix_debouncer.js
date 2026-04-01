const fs = require('fs');

let content = fs.readFileSync('src/app/projects/[id]/page.tsx', 'utf8');

// Clean up pendingTaskUpdateRef logic as it's no longer needed if we debounce direct APIs
content = content.replace(/const pendingTaskUpdateRef = useRef<\{ task: Task, start: string, end: string \} \| null>\(null\);\n/g, '');
content = content.replace(/const pendingProgressUpdateRef = useRef<\{ task: Task, progress: number \} \| null>\(null\);\n/g, '');

fs.writeFileSync('src/app/projects/[id]/page.tsx', content);
