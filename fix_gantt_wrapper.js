const fs = require('fs');
let content = fs.readFileSync('src/components/GanttChartWrapper.tsx', 'utf8');
content = content.replace(/ssr: false/g, 'ssr: false');
fs.writeFileSync('src/components/GanttChartWrapper.tsx', content);
