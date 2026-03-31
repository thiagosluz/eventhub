"use client";

import { use } from "react";
import { CheckinScanner } from "@/components/dashboard/checkin/CheckinScanner";

export default function MonitorCheckinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <CheckinScanner eventId={id} backUrl={`/monitor/events`} />;
}
