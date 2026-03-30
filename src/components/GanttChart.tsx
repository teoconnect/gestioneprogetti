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
  tasks: any[];
  onTaskUpdate: (task: any, start: string, end: string) => void;
}

export default function GanttChart({ tasks, onTaskUpdate }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ganttInst, setGanttInst] = useState<any>(null);

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;

    const formattedTasks: GanttTask[] = tasks.map((t) => {
      const startDate = new Date(t.startDate);
      const endDate = new Date(t.endDate);
      const now = new Date();

      let custom_class = "gantt-task-upcoming";
      if (endDate < now) {
        custom_class = "gantt-task-overdue";
      } else if (startDate <= now && endDate >= now) {
        custom_class = "gantt-task-ongoing";
      }

      return {
        id: t.id,
        name: t.name,
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        progress: 100,
        dependencies: "",
        custom_class,
      };
    });

    if (ganttInst) {
      containerRef.current.innerHTML = "";
    }

    const newGantt = new Gantt(containerRef.current, formattedTasks, {
      view_mode: "Day",
      on_date_change: (task: any, start: Date, end: Date) => {
        const originalTask = tasks.find((t) => t.id === task.id);
        if (originalTask) {
          const adjustedEnd = new Date(end);
          adjustedEnd.setDate(adjustedEnd.getDate() + 1);

          onTaskUpdate(
            originalTask,
            start.toISOString(),
            end.toISOString()
          );
        }
      },
      language: "it",
    });

    setGanttInst(newGantt);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [tasks]);

  if (tasks.length === 0) {
    return <div className="p-4 text-center text-gray-500 bg-gray-50 rounded border">Nessun task nel progetto.</div>;
  }

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
