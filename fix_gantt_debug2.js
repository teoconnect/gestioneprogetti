const fs = require('fs');
let content = fs.readFileSync('src/components/GanttChart.tsx', 'utf8');
content = content.replace(/    \/\/ Clone formatted tasks because frappe-gantt mutates them internally\n    \/\/ which can lead to nasty bugs with React state and staleness\n\n/g, '');
content = content.replace(/          \/\/ Pass a clone so the parent component gets an untainted object\n/g, '');
fs.writeFileSync('src/components/GanttChart.tsx', content);
