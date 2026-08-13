"use client";

import { CalendarDays, Dumbbell, LayoutList } from "lucide-react";

export type Tab = "hoy" | "rutinas" | "historial";

const items: { id: Tab; label: string; icon: typeof Dumbbell }[] = [
  { id: "hoy", label: "Hoy", icon: Dumbbell },
  { id: "rutinas", label: "Rutinas", icon: LayoutList },
  { id: "historial", label: "Historial", icon: CalendarDays },
];

export default function BottomNav({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
        {items.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 touch-manipulation transition-colors ${
                active ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
