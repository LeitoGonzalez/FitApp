"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import type { LastSet, SessionExercise } from "@/lib/types";
import { sanitizeDecimal, sanitizeInt } from "@/lib/storage";
import { formatReadableSets, isSetDone, isSetValid, setDelta } from "@/lib/metrics";

type Props = {
  exercise: SessionExercise;
  lastSets: LastSet[];
  onUpdateSet: (
    setId: string,
    patch: { weight?: string; reps?: string; rir?: string; completed?: boolean }
  ) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
};

function Field({
  label,
  value,
  placeholder,
  inputMode,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  inputMode: "decimal" | "numeric";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <input
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        enterKeyHint="next"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-2 text-center text-lg font-semibold text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
      />
    </label>
  );
}

export default function ExerciseCard({
  exercise,
  lastSets,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
}: Props) {
  const lastSummary = formatReadableSets(lastSets);
  const done = exercise.sets.filter(isSetDone).length;
  const [blockedId, setBlockedId] = useState<string | null>(null);

  function patchSet(
    set: SessionExercise["sets"][number],
    patch: { weight?: string; reps?: string; rir?: string; completed?: boolean }
  ) {
    const next = { ...set, ...patch };
    if (patch.completed === true && !isSetValid(next)) return false;
    if ((patch.weight !== undefined || patch.reps !== undefined) && next.completed && !isSetValid(next)) {
      onUpdateSet(set.id, { ...patch, completed: false });
      return true;
    }
    onUpdateSet(set.id, patch);
    return true;
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold leading-tight text-zinc-50">{exercise.exerciseName}</h2>
          <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
            {done}/{exercise.sets.length}
          </span>
        </div>
        {lastSummary ? (
          <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
            Última vez: {lastSummary}
          </p>
        ) : (
          <p className="mt-1 text-xs text-zinc-600">Sin registro previo</p>
        )}
      </div>

      <div className="space-y-3">
        {exercise.sets.map((set, index) => {
          const prev = lastSets[index] ?? lastSets[lastSets.length - 1];
          const marked = isSetDone(set);
          const delta = setDelta(set, lastSets[index]);
          const canComplete = isSetValid(set);
          return (
            <div
              key={set.id}
              className={`rounded-xl border p-3 transition-colors ${
                marked
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-zinc-800 bg-zinc-950/60"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-zinc-400">Serie {index + 1}</span>
                  {delta ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        delta.kind === "up"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : delta.kind === "down"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {delta.label}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  {exercise.sets.length > 1 && (
                    <button
                      type="button"
                      aria-label="Quitar serie"
                      onClick={() => onRemoveSet(set.id)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 touch-manipulation active:scale-95"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={marked ? "Desmarcar serie" : "Completar serie"}
                    onClick={() => {
                      if (marked) {
                        onUpdateSet(set.id, { completed: false });
                        setBlockedId(null);
                        return;
                      }
                      if (!patchSet(set, { completed: true })) {
                        setBlockedId(set.id);
                        return;
                      }
                      setBlockedId(null);
                    }}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl touch-manipulation active:scale-95 ${
                      marked
                        ? "bg-emerald-500 text-zinc-950"
                        : canComplete
                          ? "border border-zinc-700 bg-zinc-800 text-zinc-400"
                          : "border border-zinc-800 bg-zinc-900 text-zinc-600"
                    }`}
                  >
                    <Check className="h-5 w-5" strokeWidth={2.6} />
                  </button>
                </div>
              </div>
              {blockedId === set.id && !canComplete ? (
                <p className="mb-2 text-xs text-amber-300">Cargá peso y reps para marcarla lista.</p>
              ) : null}

              <div className="grid grid-cols-3 gap-2">
                <Field
                  label="Peso (kg)"
                  value={set.weight}
                  placeholder={prev?.weight || ""}
                  inputMode="decimal"
                  onChange={(v) => {
                    patchSet(set, { weight: sanitizeDecimal(v) });
                    if (blockedId === set.id) setBlockedId(null);
                  }}
                />
                <Field
                  label="Reps"
                  value={set.reps}
                  placeholder={prev?.reps || ""}
                  inputMode="numeric"
                  onChange={(v) => {
                    patchSet(set, { reps: sanitizeInt(v) });
                    if (blockedId === set.id) setBlockedId(null);
                  }}
                />
                <Field
                  label="RIR"
                  value={set.rir}
                  placeholder={prev?.rir || ""}
                  inputMode="numeric"
                  onChange={(v) => onUpdateSet(set.id, { rir: sanitizeInt(v) })}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddSet}
        className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-700 text-sm font-medium text-zinc-300 touch-manipulation active:scale-[0.99]"
      >
        <Plus className="h-4 w-4" />
        Agregar serie
      </button>
    </section>
  );
}
