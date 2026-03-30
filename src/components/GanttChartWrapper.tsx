"use client";

import dynamic from "next/dynamic";

const GanttChart = dynamic(() => import("./GanttChart"), { ssr: false });

export default function GanttChartWrapper(props: any) {
  return <GanttChart {...props} />;
}
