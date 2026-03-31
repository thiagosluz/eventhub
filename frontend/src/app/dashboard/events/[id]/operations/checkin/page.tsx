"use client";

import { use } from "react";
import { CheckinScanner } from "@/components/dashboard/checkin/CheckinScanner";

export default function CheckinScannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <CheckinScanner eventId={id} backUrl={`/dashboard/events/${id}`} />;
}
