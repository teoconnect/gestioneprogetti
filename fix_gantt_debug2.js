const fs = require('fs');
let content = fs.readFileSync('src/components/GanttChart.tsx', 'utf8');

content = content.replace(/console\.log\("Triggering onTaskUpdate for", originalTask\.name, start\.toISOString\(\)\);/g,
  '');

fs.writeFileSync('src/components/GanttChart.tsx', content);
