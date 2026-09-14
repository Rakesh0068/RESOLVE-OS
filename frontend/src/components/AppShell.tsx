"use client";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useEffect, useState } from "react";
import { getStats } from "@/lib/api";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getStats();
        setStats(s);
      } catch {}
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar stats={stats} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
