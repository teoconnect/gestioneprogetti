const fs = require('fs');

let content = fs.readFileSync('src/components/GanttChart.tsx', 'utf8');

// Aggiungiamo un log per capire se scatta l'update
content = content.replace(/onTaskUpdate\(\n            \{ \.\.\.originalTask \},\n            start\.toISOString\(\),\n            end\.toISOString\(\)\n          \);/g,
`console.log("Triggering onTaskUpdate for", originalTask.name, start.toISOString());
          onTaskUpdate(
            { ...originalTask },
            start.toISOString(),
            end.toISOString()
          );`);

fs.writeFileSync('src/components/GanttChart.tsx', content);
