"use client";

import { useEffect, useRef, useState } from "react";
import Gantt from "frappe-gantt";

interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string;
  custom_class?: string;
}

interface GanttChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTaskUpdate: (task: any, start: string, end: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTaskProgressUpdate?: (task: any, progress: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTaskClick?: (task: any) => void;
}

export default function GanttChart({ tasks, onTaskUpdate, onTaskProgressUpdate, onTaskClick }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ganttInst, setGanttInst] = useState<any>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;

    const handleMouseDown = (e: MouseEvent) => {
      startPosRef.current = { x: e.clientX, y: e.clientY };
      isDraggingRef.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (
        Math.abs(e.clientX - startPosRef.current.x) > 3 ||
        Math.abs(e.clientY - startPosRef.current.y) > 3
      ) {
        isDraggingRef.current = true;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousedown", handleMouseDown, true);
      container.addEventListener("mousemove", handleMouseMove, true);
    }

    const formattedTasks: GanttTask[] = tasks.map((t) => {
      const startDate = new Date(t.startDate);
      const endDate = new Date(t.endDate);
      const now = new Date();

      let custom_class = "gantt-task-upcoming";
      if (t.color) {
        // We'll generate a dynamic class in the styled block later,
        // but frappe-gantt uses custom_class. We can pass the color to be handled via CSS or inject it.
        // Actually frappe-gantt doesn't support inline styles for bars easily,
        // so we can use a generated class or simply use status colors.
        // Let's create a custom class name based on the color hex code (stripping the #)
        custom_class = `gantt-task-color-${t.color.replace('#', '')}`;
      } else if (t.status === "DONE") {
        custom_class = "gantt-task-done";
      } else if (endDate < now && t.status !== "DONE") {
        custom_class = "gantt-task-overdue";
      } else if (startDate <= now && endDate >= now && t.status !== "DONE") {
        custom_class = "gantt-task-ongoing";
      }

      return {
        id: t.id,
        name: t.name,
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        progress: t.progress !== undefined ? t.progress : 100,
        dependencies: t.dependencies || "",
        custom_class,
      };
    });

    if (ganttInst) {
      containerRef.current.innerHTML = "";
    }

    // Clone formatted tasks because frappe-gantt mutates them internally
    // which can lead to nasty bugs with React state and staleness


    const newGantt = new Gantt(containerRef.current, formattedTasks, {
      view_mode: "Day",
      move_dependencies: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on_date_change: (task: any, start: Date, end: Date) => {
        const originalTask = tasks.find((t) => t.id === task.id);
        if (originalTask) {
          // Format using local date to prevent UTC offsets shifting it to the previous day
          const formatLocal = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };

          onTaskUpdate(
            originalTask,
            formatLocal(start),
            formatLocal(end)
          );
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on_progress_change: (task: any, progress: number) => {
        const originalTask = tasks.find((t) => t.id === task.id);
        if (originalTask && onTaskProgressUpdate) {
          onTaskProgressUpdate(originalTask, progress);
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on_click: (task: any) => {
        if (isDraggingRef.current) return;
        const originalTask = tasks.find((t) => t.id === task.id);
        if (originalTask && onTaskClick) {
          onTaskClick(originalTask);
        }
      },
      language: "it",
    });

    // Disable automatic cascading of dependent tasks in frappe-gantt
    if (newGantt) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (newGantt as any).update_dependent_tasks = () => {};

      // We also need to hook into the drag/resize events if frappe-gantt
      // modifies children during dragging, or if `update_dependent_tasks` is sufficient.
      // Usually `update_dependent_tasks` is called on end of drag, but dragging might also snap.
    }


    setGanttInst(newGantt);

    const cleanupRef = containerRef.current;

    return () => {
      if (cleanupRef) {
        cleanupRef.innerHTML = "";
        cleanupRef.removeEventListener("mousedown", handleMouseDown, true);
        cleanupRef.removeEventListener("mousemove", handleMouseMove, true);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(tasks)]);

  if (tasks.length === 0) {
    return <div className="p-4 text-center text-gray-500 bg-gray-50 rounded border">Nessun task nel progetto.</div>;
  }

  // Generate dynamic CSS rules for custom colors
  const colorStyles = tasks
    .filter((t) => t.color)
    .map((t) => {
      const className = `gantt-task-color-${t.color.replace('#', '')}`;
      return `.${className} .bar { fill: ${t.color} !important; }`;
    })
    .join('\n');

  return (
    <div className="w-full overflow-x-auto bg-white p-4 rounded-lg shadow border border-gray-100">
      <style>{`
        .gantt-task-overdue .bar {
          fill: #ef4444 !important;
        }
        .gantt-task-ongoing .bar {
          fill: #3b82f6 !important;
        }
        .gantt-task-upcoming .bar {
          fill: #10b981 !important;
        }
        .gantt-task-done .bar {
          fill: #6b7280 !important;
        }
        .gantt-container {
          overflow-y: hidden !important;
        }
        ${colorStyles}
      `}</style>
      <div className="mb-4 flex gap-2">
        <button className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded" onClick={() => ganttInst?.change_view_mode('Day')}>Giorno</button>
        <button className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded" onClick={() => ganttInst?.change_view_mode('Week')}>Settimana</button>
        <button className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded" onClick={() => ganttInst?.change_view_mode('Month')}>Mese</button>
      </div>
      <div ref={containerRef} className="w-full"></div>
    </div>
  );
}
