"use client";

import { clearToken, getToken } from "@/lib/api";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminHeaderLinks() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const token = typeof window !== "undefined" ? getToken() : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && !!token;
  const redirect = pathname ? encodeURIComponent(pathname) : "";

  function handleLogout() {
    clearToken();
    router.push("/");
    router.refresh();
  }

  if (!mounted) {
    return <span className="text-muted-foreground text-sm">…</span>;
  }

  if (isLoggedIn) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className="text-muted-foreground hover:text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded"
      >
        Sair
      </button>
    );
  }

  return (
    <Link
      href={redirect ? `/login?redirect=${redirect}` : "/login"}
      className="text-muted-foreground hover:text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded"
    >
      Entrar
    </Link>
  );
}
