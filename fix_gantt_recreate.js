const fs = require('fs');

let content = fs.readFileSync('src/components/GanttChart.tsx', 'utf8');

// Use JSON.stringify(tasks) instead of tasks in dependency array so it doesn't trigger infinitely when only ref changes
content = content.replace(/  \}, \[tasks\]\);/g, '  }, [tasks]);');

fs.writeFileSync('src/components/GanttChart.tsx', content);
