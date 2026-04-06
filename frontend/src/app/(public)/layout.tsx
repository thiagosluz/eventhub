"use client";

import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { tenantsService } from "@/services/tenants.service";
import { useEffect, useState } from "react";
import { Tenant } from "@/types/event";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tenant, setTenant] = useState<Tenant | undefined>(undefined);

  useEffect(() => {
    tenantsService.getPublicTenant().then(setTenant).catch(console.error);
  }, []);

  return (
    <ThemeProvider themeConfig={tenant?.themeConfig}>
      <Navbar tenant={tenant} />
      <div className="min-h-[calc(100vh-80px)] pt-20">
        {children}
      </div>
      <Footer />
    </ThemeProvider>
  );
}
