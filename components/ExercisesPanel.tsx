"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";

export default function ExercisesPanel() {
  const { data, addCatalogExercise, updateCatalogExercise, deleteCatalogExercise } = useStore();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const exercises = [...data.exercises].sort((a, b) => a.name.localeCompare(b.name, "es"));

  function submitNew() {
    const result = addCatalogExercise(draft);
    if ("error" in result) {
      setError(result.error === "duplicate" ? "Ese ejercicio ya existe" : "Escribí un nombre");
      return;
    }
    setDraft("");
    setError("");
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitNew();
        }}
        className="mb-3 flex gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError("");
          }}
          placeholder="Nuevo ejercicio"
          className="h-12 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-base text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <button
          type="submit"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 touch-manipulation active:scale-95"
          aria-label="Crear ejercicio"
        >
          <Plus className="h-5 w-5" />
        </button>
      </form>
      {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}

      {exercises.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
          Todavía no hay ejercicios. Creá uno para armar las rutinas.
        </p>
      ) : (
        <ul className="space-y-2">
          {exercises.map((exercise) => (
            <li
              key={exercise.id}
              className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2"
            >
              {editingId === exercise.id ? (
                <input
                  autoFocus
                  defaultValue={exercise.name}
                  onBlur={(e) => {
                    const result = updateCatalogExercise(exercise.id, e.target.value);
                    if ("error" in result && result.error === "duplicate") {
                      alert("Ya existe un ejercicio con ese nombre");
                    }
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const result = updateCatalogExercise(exercise.id, e.currentTarget.value);
                      if ("error" in result && result.error === "duplicate") {
                        alert("Ya existe un ejercicio con ese nombre");
                      }
                      setEditingId(null);
                    }
                  }}
                  className="h-11 flex-1 rounded-xl border border-emerald-500 bg-zinc-950 px-3 text-sm focus:outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingId(exercise.id)}
                  className="flex-1 truncate text-left text-sm font-medium text-zinc-100"
                >
                  {exercise.name}
                </button>
              )}
              <button
                type="button"
                aria-label="Editar ejercicio"
                onClick={() => setEditingId(exercise.id)}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 touch-manipulation"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Eliminar ejercicio"
                onClick={() => {
                  if (
                    confirm(
                      `¿Sacar "${exercise.name}" de las rutinas? Las sesiones pasadas se conservan.`
                    )
                  ) {
                    deleteCatalogExercise(exercise.id);
                  }
                }}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-red-400 touch-manipulation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
