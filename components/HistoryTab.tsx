"use client";

import { ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatLongDate, isSessionMeaningful } from "@/lib/storage";

function setSummary(weight: string, reps: string, rir: string): string {
  const load = weight ? `${weight} kg` : "—";
  const r = reps ? `× ${reps}` : "";
  const reserve = rir !== "" ? ` RIR ${rir}` : "";
  return `${load} ${r}${reserve}`.replace(/\s+/g, " ").trim();
}

export default function HistoryTab() {
  const { data, hydrated } = useStore();

  if (!hydrated) {
    return (
      <div className="px-4 pb-28 pt-8">
        <div className="h-8 w-36 animate-pulse rounded-lg bg-zinc-800" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-zinc-900" />
      </div>
    );
  }

  const sessions = [...data.sessions]
    .filter(isSessionMeaningful)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  return (
    <div className="px-4 pb-28 pt-6">
      <header className="mb-5">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Historial</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Sesiones guardadas</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {sessions.length === 0 ? "Todavía no hay entrenamientos" : `${sessions.length} sesión${sessions.length === 1 ? "" : "es"}`}
        </p>
      </header>

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
          Completá series en Hoy y van a aparecer acá, ordenadas por fecha.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const logged = session.exercises.filter((ex) =>
              ex.sets.some((s) => s.completed || s.weight || s.reps)
            );
            const completedSets = session.exercises.reduce(
              (n, ex) => n + ex.sets.filter((s) => s.completed).length,
              0
            );

            return (
              <details
                key={session.id}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900 open:border-zinc-700"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 touch-manipulation">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold capitalize text-zinc-100">
                      {formatLongDate(session.date)}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      {session.routineName} · {completedSets} series · {logged.length} ejercicios
                    </p>
                  </div>
                  <ChevronDown className="h-5 w-5 shrink-0 text-zinc-500 transition-transform group-open:rotate-180" />
                </summary>

                <div className="space-y-3 border-t border-zinc-800 px-4 pb-4 pt-3">
                  {logged.map((exercise) => (
                    <div key={exercise.exerciseId}>
                      <p className="text-sm font-medium text-zinc-200">{exercise.exerciseName}</p>
                      <ul className="mt-1 space-y-0.5">
                        {exercise.sets
                          .filter((s) => s.completed || s.weight || s.reps)
                          .map((set, i) => (
                            <li key={set.id} className="text-xs text-zinc-400">
                              S{i + 1}: {setSummary(set.weight, set.reps, set.rir)}
                              {set.completed ? " ✓" : ""}
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
