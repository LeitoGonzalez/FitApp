"use client";

import { useState } from "react";
import { StoreProvider } from "@/lib/store";
import BottomNav, { type Tab } from "@/components/BottomNav";
import TodayTab from "@/components/TodayTab";
import RoutinesTab from "@/components/RoutinesTab";
import HistoryTab from "@/components/HistoryTab";
import ProgressTab from "@/components/ProgressTab";

export default function Home() {
  const [tab, setTab] = useState<Tab>("hoy");

  return (
    <StoreProvider>
      <div className="mx-auto min-h-dvh max-w-lg">
        {tab === "hoy" && <TodayTab />}
        {tab === "rutinas" && <RoutinesTab />}
        {tab === "historial" && <HistoryTab />}
        {tab === "progreso" && <ProgressTab />}
        <BottomNav tab={tab} onChange={setTab} />
      </div>
    </StoreProvider>
  );
}
