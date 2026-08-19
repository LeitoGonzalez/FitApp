"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { resolveExercises } from "@/lib/storage";
import ExercisesPanel from "@/components/ExercisesPanel";
import ReorderableExerciseList from "@/components/ReorderableExerciseList";

export default function RoutinesTab() {
  const {
    data,
    hydrated,
    addRoutine,
    updateRoutineName,
    deleteRoutine,
    addExerciseToRoutine,
    removeExerciseFromRoutine,
    reorderRoutineExercises,
    addCatalogExercise,
  } = useStore();

  const [view, setView] = useState<"plantillas" | "ejercicios">("plantillas");
  const [newRoutine, setNewRoutine] = useState("");
  const [editingRoutine, setEditingRoutine] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [createDraft, setCreateDraft] = useState<Record<string, string>>({});

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

  function addSelected(routineId: string) {
    const exerciseId = selected[routineId];
    if (!exerciseId) return;
    addExerciseToRoutine(routineId, exerciseId);
    setSelected((prev) => ({ ...prev, [routineId]: "" }));
  }

  function createAndAdd(routineId: string) {
    const name = (createDraft[routineId] ?? "").trim();
    if (!name) return;
    const existing = data.exercises.find((e) => e.name.trim().toLowerCase() === name.toLowerCase());
    if (existing) {
      addExerciseToRoutine(routineId, existing.id);
    } else {
      const result = addCatalogExercise(name);
      if ("id" in result) addExerciseToRoutine(routineId, result.id);
    }
    setCreateDraft((prev) => ({ ...prev, [routineId]: "" }));
  }

  return (
    <div className="px-4 pb-28 pt-6">
      <header className="mb-4">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Rutinas</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Tus plantillas</h1>
        <p className="mt-1 text-sm text-zinc-500">Catálogo único, rutinas que lo reutilizan</p>
      </header>

      <div className="mb-5 grid grid-cols-2 rounded-xl bg-zinc-900 p-1">
        <button
          type="button"
          onClick={() => setView("plantillas")}
          className={`h-11 rounded-lg text-sm font-semibold touch-manipulation ${
            view === "plantillas" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"
          }`}
        >
          Plantillas
        </button>
        <button
          type="button"
          onClick={() => setView("ejercicios")}
          className={`h-11 rounded-lg text-sm font-semibold touch-manipulation ${
            view === "ejercicios" ? "bg-zinc-800 text-zinc-50" : "text-zinc-400"
          }`}
        >
          Ejercicios
        </button>
      </div>

      {view === "ejercicios" ? (
        <ExercisesPanel />
      ) : (
        <>
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
              {data.routines.map((routine) => {
                const items = resolveExercises(data.exercises, routine.exerciseIds);
                const available = data.exercises
                  .filter((e) => !routine.exerciseIds.includes(e.id))
                  .sort((a, b) => a.name.localeCompare(b.name, "es"));

                return (
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

                    {items.length > 1 ? (
                      <p className="mb-2 text-xs text-zinc-500">Arrastrá las rayitas para reordenar</p>
                    ) : null}
                    <ReorderableExerciseList
                      items={items}
                      onReorder={(exerciseIds) => reorderRoutineExercises(routine.id, exerciseIds)}
                      onRemove={(id) => removeExerciseFromRoutine(routine.id, id)}
                    />

                    {available.length > 0 ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          addSelected(routine.id);
                        }}
                        className="mt-3 flex gap-2"
                      >
                        <select
                          value={selected[routine.id] ?? ""}
                          onChange={(e) =>
                            setSelected((prev) => ({ ...prev, [routine.id]: e.target.value }))
                          }
                          className="h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        >
                          <option value="">Agregar ejercicio…</option>
                          {available.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-700 text-zinc-200 touch-manipulation active:scale-95"
                          aria-label="Agregar ejercicio"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </form>
                    ) : data.exercises.length === 0 ? (
                      <p className="mt-3 text-xs text-zinc-500">Creá ejercicios en la pestaña Ejercicios.</p>
                    ) : (
                      <p className="mt-3 text-xs text-zinc-500">Todos los ejercicios ya están en esta rutina.</p>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        createAndAdd(routine.id);
                      }}
                      className="mt-2 flex gap-2"
                    >
                      <input
                        type="text"
                        value={createDraft[routine.id] ?? ""}
                        onChange={(e) =>
                          setCreateDraft((prev) => ({ ...prev, [routine.id]: e.target.value }))
                        }
                        placeholder="¿No está? Crear y agregar"
                        className="h-12 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                      <button
                        type="submit"
                        className="h-12 shrink-0 rounded-xl px-3 text-xs font-semibold text-emerald-400 touch-manipulation"
                      >
                        Crear
                      </button>
                    </form>
                  </section>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
