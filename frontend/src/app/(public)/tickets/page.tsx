"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TicketsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/profile?tab=tickets");
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
