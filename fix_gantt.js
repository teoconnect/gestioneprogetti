const fs = require('fs');

let pageContent = fs.readFileSync('src/app/projects/[id]/page.tsx', 'utf8');

// Replace the mouseup logic with a simple debouncer on handleGanttTaskUpdate directly!
pageContent = pageContent.replace(/const isDraggingRef = useRef\(false\);/, '// Debounce ref\n  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);');

// Remove mouse listeners from useEffect
pageContent = pageContent.replace(/document\.addEventListener\("mousedown".*/g, '');
pageContent = pageContent.replace(/document\.addEventListener\("mouseup".*/g, '');
pageContent = pageContent.replace(/document\.removeEventListener\("mousedown".*/g, '');
pageContent = pageContent.replace(/document\.removeEventListener\("mouseup".*/g, '');
pageContent = pageContent.replace(/const handleMouseDown = \(\) => \{\n      isDraggingRef\.current = true;\n    \};\n\n    const handleMouseUp = async \(\) => \{[\s\S]*?fetchProject\(\);\n      \}\n    \};\n\n/g, '');

pageContent = pageContent.replace(/if \(isDraggingRef\.current\) \{[\s\S]*?return;\n    \}/g, '');

// Apply debouncer in handleGanttTaskUpdate
pageContent = pageContent.replace(/const handleGanttTaskUpdate = async \(task: Task, start: string, end: string\) => \{/,
`const handleGanttTaskUpdate = async (task: Task, start: string, end: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(async () => {`);

// Close debouncer
pageContent = pageContent.replace(/console\.error\("Error updating task from Gantt", error\);\n    \}\n  \};/,
`console.error("Error updating task from Gantt", error);
      }
    }, 500);
  };`);

// Apply debouncer in handleGanttProgressUpdate
pageContent = pageContent.replace(/const handleGanttProgressUpdate = async \(task: Task, progress: number\) => \{/,
`const handleGanttProgressUpdate = async (task: Task, progress: number) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(async () => {`);

pageContent = pageContent.replace(/console\.error\("Error updating task progress from Gantt", error\);\n    \}\n  \};/,
`console.error("Error updating task progress from Gantt", error);
      }
    }, 500);
  };`);

fs.writeFileSync('src/app/projects/[id]/page.tsx', pageContent);
