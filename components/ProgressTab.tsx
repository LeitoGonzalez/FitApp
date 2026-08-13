"use client";

import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatShortDate, isSessionMeaningful } from "@/lib/storage";
import { formatVolume, progressPoints, trainedExercises } from "@/lib/metrics";
import LineChart from "@/components/LineChart";

export default function ProgressTab() {
  const { data, hydrated } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metric, setMetric] = useState<"volume" | "weight">("weight");

  const meaningful = useMemo(
    () => data.sessions.filter(isSessionMeaningful),
    [data.sessions]
  );
  const exercises = useMemo(
    () => trainedExercises(meaningful, data.exercises),
    [meaningful, data.exercises]
  );

  if (!hydrated) {
    return (
      <div className="px-4 pb-28 pt-8">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-800" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-zinc-900" />
      </div>
    );
  }

  const selected = exercises.find((e) => e.id === selectedId) ?? null;
  const series = selected ? progressPoints(meaningful, selected.id) : [];
  const chartPoints = series.map((p) => ({
    label: formatShortDate(p.date),
    value: metric === "volume" ? p.volume : p.bestWeight,
  }));
  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const best = series.reduce(
    (m, p) => Math.max(m, metric === "volume" ? p.volume : p.bestWeight),
    0
  );
  const lastVal = last ? (metric === "volume" ? last.volume : last.bestWeight) : 0;
  const prevVal = prev ? (metric === "volume" ? prev.volume : prev.bestWeight) : null;
  const diff = prevVal === null ? null : lastVal - prevVal;

  function formatMetric(n: number): string {
    if (metric === "volume") return `${formatVolume(n)} kg`;
    return `${n} kg`;
  }

  return (
    <div className="px-4 pb-28 pt-6">
      <header className="mb-5">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Progreso</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          {selected ? selected.name : "Tus ejercicios"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {selected ? "Últimas sesiones de este movimiento" : "Elegí un ejercicio para ver la curva"}
        </p>
      </header>

      {selected ? (
        <div>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="mb-4 flex h-11 items-center gap-1 text-sm font-medium text-zinc-300 touch-manipulation"
          >
            <ChevronLeft className="h-4 w-4" />
            Todos
          </button>

          <div className="mb-4 grid grid-cols-2 rounded-xl bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => setMetric("weight")}
              className={`h-11 rounded-lg text-sm font-semibold touch-manipulation ${
                metric === "weight" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"
              }`}
            >
              Mejor peso
            </button>
            <button
              type="button"
              onClick={() => setMetric("volume")}
              className={`h-11 rounded-lg text-sm font-semibold touch-manipulation ${
                metric === "volume" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"
              }`}
            >
              Volumen
            </button>
          </div>

          {metric === "volume" ? (
            <p className="mb-3 text-xs leading-snug text-zinc-500">
              Volumen = peso × reps de cada serie, sumadas. No es el peso de la barra.
            </p>
          ) : null}

          <div className="mb-4 grid grid-cols-3 gap-2">
            <Stat label="Último" value={last ? formatMetric(lastVal) : "—"} />
            <Stat label="Mejor" value={best ? formatMetric(best) : "—"} />
            <Stat
              label="Vs anterior"
              value={
                diff === null
                  ? "—"
                  : diff === 0
                    ? "="
                    : `${diff > 0 ? "+" : ""}${metric === "volume" ? formatVolume(diff) : Math.round(diff)} ${metric === "volume" ? "kg×rep" : "kg"}`
              }
              tone={diff === null || diff === 0 ? "neutral" : diff > 0 ? "up" : "down"}
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
            {chartPoints.length < 2 ? (
              <p className="px-2 py-10 text-center text-sm text-zinc-500">
                Entrenalo 2 veces para ver la curva.
              </p>
            ) : (
              <LineChart points={chartPoints} />
            )}
          </div>
        </div>
      ) : exercises.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
          Cuando completes series en Hoy, los ejercicios van a aparecer acá.
        </p>
      ) : (
        <ul className="space-y-2">
          {exercises.map((exercise) => {
            const pts = progressPoints(meaningful, exercise.id);
            const lastPt = pts[pts.length - 1];
            return (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(exercise.id)}
                  className="flex h-16 w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-left touch-manipulation active:scale-[0.99]"
                >
                  <span className="truncate font-medium text-zinc-100">{exercise.name}</span>
                  <span className="shrink-0 text-sm text-zinc-500">
                    {lastPt ? `${lastPt.bestWeight} kg` : `${pts.length} ses.`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "up" | "down";
}) {
  const color =
    tone === "up" ? "text-emerald-400" : tone === "down" ? "text-amber-300" : "text-zinc-100";
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold leading-tight ${color}`}>{value}</p>
    </div>
  );
}
