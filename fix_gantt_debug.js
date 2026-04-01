const fs = require('fs');
let content = fs.readFileSync('src/components/GanttChart.tsx', 'utf8');

content = content.replace(/console\.log\("Triggering onTaskUpdate for", originalTask\.name, start\.toISOString\(\)\);/g,
  'console.log("Triggering onTaskUpdate for", originalTask.name, start.toISOString());');

// Assicuriamoci di ricostruire bene
fs.writeFileSync('src/components/GanttChart.tsx', content);
