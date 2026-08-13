"use client";

import { Check, Minus, Plus } from "lucide-react";
import type { LastSet, SessionExercise } from "@/lib/types";
import { sanitizeDecimal, sanitizeInt } from "@/lib/storage";

type Props = {
  exercise: SessionExercise;
  lastSets: LastSet[];
  onUpdateSet: (setId: string, patch: { weight?: string; reps?: string; rir?: string; completed?: boolean }) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
};

function lastHint(lastSets: LastSet[]): string | null {
  const filled = lastSets.filter((s) => s.weight || s.reps);
  if (!filled.length) return null;
  return filled
    .map((s) => {
      const load = s.weight ? `${s.weight} kg` : "—";
      const reps = s.reps ? `× ${s.reps}` : "";
      const rir = s.rir !== "" ? ` @${s.rir}` : "";
      return `${load} ${reps}${rir}`.replace(/\s+/g, " ").trim();
    })
    .join("  ·  ");
}

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
  const hint = lastHint(lastSets);
  const done = exercise.sets.filter((s) => s.completed).length;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold leading-tight text-zinc-50">{exercise.exerciseName}</h2>
          {hint ? (
            <p className="mt-1 text-xs leading-snug text-zinc-400">Última: {hint}</p>
          ) : (
            <p className="mt-1 text-xs text-zinc-600">Sin registro previo</p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
          {done}/{exercise.sets.length}
        </span>
      </div>

      <div className="space-y-3">
        {exercise.sets.map((set, index) => {
          const prev = lastSets[index] ?? lastSets[lastSets.length - 1];
          return (
            <div
              key={set.id}
              className={`rounded-xl border p-3 transition-colors ${
                set.completed
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-zinc-800 bg-zinc-950/60"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-400">Serie {index + 1}</span>
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
                    aria-label={set.completed ? "Desmarcar serie" : "Completar serie"}
                    onClick={() => onUpdateSet(set.id, { completed: !set.completed })}
                    className={`flex h-11 w-11 items-center justify-center rounded-xl touch-manipulation active:scale-95 ${
                      set.completed
                        ? "bg-emerald-500 text-zinc-950"
                        : "border border-zinc-700 bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <Check className="h-5 w-5" strokeWidth={2.6} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Field
                  label="Peso (kg)"
                  value={set.weight}
                  placeholder={prev?.weight || ""}
                  inputMode="decimal"
                  onChange={(v) => onUpdateSet(set.id, { weight: sanitizeDecimal(v) })}
                />
                <Field
                  label="Reps"
                  value={set.reps}
                  placeholder={prev?.reps || ""}
                  inputMode="numeric"
                  onChange={(v) => onUpdateSet(set.id, { reps: sanitizeInt(v) })}
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
