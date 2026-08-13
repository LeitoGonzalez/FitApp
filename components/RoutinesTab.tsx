"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";

export default function RoutinesTab() {
  const {
    data,
    hydrated,
    addRoutine,
    updateRoutineName,
    deleteRoutine,
    addExercise,
    updateExerciseName,
    deleteExercise,
  } = useStore();

  const [newRoutine, setNewRoutine] = useState("");
  const [exerciseDrafts, setExerciseDrafts] = useState<Record<string, string>>({});
  const [editingRoutine, setEditingRoutine] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <div className="px-4 pb-28 pt-8">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-800" />
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-zinc-900" />
      </div>
    );
  }

  function submitRoutine() {
    addRoutine(newRoutine);
    setNewRoutine("");
  }

  return (
    <div className="px-4 pb-28 pt-6">
      <header className="mb-5">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Rutinas</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Tus plantillas</h1>
        <p className="mt-1 text-sm text-zinc-500">Creá y editá los ejercicios de cada día</p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitRoutine();
        }}
        className="mb-5 flex gap-2"
      >
        <input
          type="text"
          value={newRoutine}
          onChange={(e) => setNewRoutine(e.target.value)}
          placeholder="Nombre de rutina (ej. Push)"
          className="h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-base text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <button
          type="submit"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 touch-manipulation active:scale-95"
          aria-label="Crear rutina"
        >
          <Plus className="h-5 w-5" />
        </button>
      </form>

      {data.routines.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
          Todavía no hay rutinas. Escribí un nombre y tocá +.
        </p>
      ) : (
        <div className="space-y-4">
          {data.routines.map((routine) => (
            <section key={routine.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="mb-3 flex items-center gap-2">
                {editingRoutine === routine.id ? (
                  <input
                    autoFocus
                    defaultValue={routine.name}
                    onBlur={(e) => {
                      updateRoutineName(routine.id, e.target.value);
                      setEditingRoutine(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateRoutineName(routine.id, e.currentTarget.value);
                        setEditingRoutine(null);
                      }
                    }}
                    className="h-11 flex-1 rounded-xl border border-emerald-500 bg-zinc-950 px-3 text-base font-semibold focus:outline-none"
                  />
                ) : (
                  <h2 className="flex-1 text-lg font-semibold">{routine.name}</h2>
                )}
                <button
                  type="button"
                  aria-label="Editar nombre"
                  onClick={() => setEditingRoutine(routine.id)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 touch-manipulation"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Eliminar rutina"
                  onClick={() => {
                    if (confirm(`¿Eliminar la rutina "${routine.name}"?`)) deleteRoutine(routine.id);
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-red-400 touch-manipulation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <ul className="space-y-2">
                {routine.exercises.map((exercise) => (
                  <li
                    key={exercise.id}
                    className="flex items-center gap-2 rounded-xl bg-zinc-950/70 px-3 py-2"
                  >
                    {editingExercise === exercise.id ? (
                      <input
                        autoFocus
                        defaultValue={exercise.name}
                        onBlur={(e) => {
                          updateExerciseName(routine.id, exercise.id, e.target.value);
                          setEditingExercise(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateExerciseName(routine.id, exercise.id, e.currentTarget.value);
                            setEditingExercise(null);
                          }
                        }}
                        className="h-10 flex-1 rounded-lg border border-emerald-500 bg-zinc-900 px-2 text-sm focus:outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditingExercise(exercise.id)}
                        className="flex-1 truncate text-left text-sm text-zinc-200"
                      >
                        {exercise.name}
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Quitar ejercicio"
                      onClick={() => deleteExercise(routine.id, exercise.id)}
                      className="flex h-10 w-10 items-center justify-center text-zinc-500 touch-manipulation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addExercise(routine.id, exerciseDrafts[routine.id] ?? "");
                  setExerciseDrafts((prev) => ({ ...prev, [routine.id]: "" }));
                }}
                className="mt-3 flex gap-2"
              >
                <input
                  type="text"
                  value={exerciseDrafts[routine.id] ?? ""}
                  onChange={(e) =>
                    setExerciseDrafts((prev) => ({ ...prev, [routine.id]: e.target.value }))
                  }
                  placeholder="Agregar ejercicio"
                  className="h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <button
                  type="submit"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-700 text-zinc-200 touch-manipulation active:scale-95"
                  aria-label="Agregar ejercicio"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </form>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
