const fs = require('fs');

let content = fs.readFileSync('src/app/projects/[id]/page.tsx', 'utf8');
content = content.replace(
  /const updateTimeoutRef = useRef<NodeJS\.Timeout \| null>\(null\);/,
  `const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const projectRef = useRef(project);
  useEffect(() => { projectRef.current = project; }, [project]);`
);

content = content.replace(/if \(!project\) return;/g, 'const currentProject = projectRef.current;\n      if (!currentProject) return;');
content = content.replace(/project\.tasks/g, 'currentProject.tasks');

fs.writeFileSync('src/app/projects/[id]/page.tsx', content);
