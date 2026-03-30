"use client";

import dynamic from "next/dynamic";

const GanttChart = dynamic(() => import("./GanttChart"), { ssr: false });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function GanttChartWrapper(props: { tasks: any[]; onTaskUpdate: (task: any, start: string, end: string) => void; onTaskProgressUpdate?: (task: any, progress: number) => void; }) {
  return <GanttChart {...props} />;
}
