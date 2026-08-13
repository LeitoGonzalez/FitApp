"use client";

import { useStore } from "@/lib/store";
import { formatLongDate, todayISO } from "@/lib/storage";
import { isSetDone } from "@/lib/metrics";
import ExerciseCard from "@/components/ExerciseCard";

export default function TodayTab() {
  const {
    data,
    hydrated,
    todaySession,
    setActiveRoutine,
    updateSet,
    addSet,
    removeSet,
    lastSetsFor,
    updateNotes,
  } = useStore();

  if (!hydrated) {
    return (
      <div className="px-4 pb-28 pt-8">
        <div className="h-8 w-24 animate-pulse rounded-lg bg-zinc-800" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-zinc-900" />
      </div>
    );
  }

  const totalSets = todaySession?.exercises.reduce((n, e) => n + e.sets.length, 0) ?? 0;
  const doneSets =
    todaySession?.exercises.reduce((n, e) => n + e.sets.filter(isSetDone).length, 0) ?? 0;
  const progress = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  return (
    <div className="px-4 pb-28 pt-6">
      <header className="mb-5">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Hoy</p>
        <h1 className="mt-1 text-2xl font-bold capitalize tracking-tight">{formatLongDate(todayISO())}</h1>
        <p className="mt-1 text-sm text-zinc-500">Se guarda solo en este dispositivo</p>
      </header>

      {data.routines.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
          Creá una rutina en la pestaña Rutinas para empezar a registrar.
        </p>
      ) : (
        <>
          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
            {data.routines.map((routine) => {
              const active = routine.id === data.activeRoutineId;
              return (
                <button
                  key={routine.id}
                  type="button"
                  onClick={() => setActiveRoutine(routine.id)}
                  className={`h-11 shrink-0 rounded-full px-5 text-sm font-semibold touch-manipulation active:scale-95 ${
                    active
                      ? "bg-emerald-500 text-zinc-950"
                      : "bg-zinc-900 text-zinc-300 ring-1 ring-zinc-800"
                  }`}
                >
                  {routine.name}
                </button>
              );
            })}
          </div>

          {todaySession && todaySession.exercises.length > 0 && (
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">Series completadas</span>
                <span className="font-medium text-zinc-200">
                  {doneSets}/{totalSets}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {todaySession && todaySession.exercises.length === 0 ? (
            <p className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
              Esta rutina no tiene ejercicios. Agregalos desde Rutinas.
            </p>
          ) : (
            <div className="space-y-4">
              {todaySession?.exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.exerciseId}
                  exercise={exercise}
                  lastSets={lastSetsFor(exercise.exerciseId, exercise.exerciseName)}
                  onUpdateSet={(setId, patch) => updateSet(exercise.exerciseId, setId, patch)}
                  onAddSet={() => addSet(exercise.exerciseId)}
                  onRemoveSet={(setId) => removeSet(exercise.exerciseId, setId)}
                />
              ))}
            </div>
          )}

          {todaySession ? (
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-zinc-300">Notas de la sesión</span>
              <textarea
                value={todaySession.notes}
                onChange={(e) => updateNotes(todaySession.id, e.target.value)}
                placeholder="¿Cómo se sintió? Dolor, sueño, etc."
                rows={3}
                className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </label>
          ) : null}
        </>
      )}
    </div>
  );
}
