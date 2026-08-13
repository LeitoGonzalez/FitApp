"use client";

import { useRef, useState } from "react";
import { ChevronDown, Clipboard, ClipboardCheck, Download, Upload } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatLongDate, formatShortDate, isSessionMeaningful } from "@/lib/storage";
import {
  findPreviousExercise,
  formatSetLine,
  formatSetsCompact,
  isSetDone,
  loggedSets,
} from "@/lib/metrics";
import { copyToClipboard, downloadBackup, formatSessionMarkdown, parseBackup } from "@/lib/export";

export default function HistoryTab() {
  const { data, hydrated, replaceData, updateNotes } = useStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [importError, setImportError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function copySession(id: string) {
    const session = data.sessions.find((s) => s.id === id);
    if (!session) return;
    const ok = await copyToClipboard(formatSessionMarkdown(session));
    if (ok) {
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1500);
    }
  }

  async function onImport(file: File | undefined) {
    setImportError("");
    if (!file) return;
    const text = await file.text();
    const parsed = parseBackup(text);
    if (!parsed) {
      setImportError("Archivo inválido. Tiene que ser un backup JSON de FitApp.");
      return;
    }
    if (
      !confirm("Esto reemplaza todos los datos de este dispositivo. ¿Seguir?")
    ) {
      return;
    }
    replaceData(parsed);
  }

  return (
    <div className="px-4 pb-28 pt-6">
      <header className="mb-5">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">Historial</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Sesiones guardadas</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {sessions.length === 0
            ? "Todavía no hay entrenamientos"
            : `${sessions.length} sesión${sessions.length === 1 ? "" : "es"}`}
        </p>
      </header>

      {sessions.length === 0 ? (
        <p className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
          Completá series en Hoy y van a aparecer acá, ordenadas por fecha.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const logged = session.exercises.filter((ex) => loggedSets(ex).length);
            const completedSets = session.exercises.reduce(
              (n, ex) => n + ex.sets.filter(isSetDone).length,
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
                  {logged.map((exercise) => {
                    const prev = findPreviousExercise(
                      data.sessions,
                      session.id,
                      exercise.exerciseId,
                      exercise.exerciseName,
                      session.date
                    );
                    return (
                      <div key={exercise.exerciseId}>
                        <p className="text-sm font-medium text-zinc-200">{exercise.exerciseName}</p>
                        {prev ? (
                          <p className="mt-0.5 text-[11px] text-zinc-500">
                            vs anterior ({formatShortDate(prev.session.date)}):{" "}
                            {formatSetsCompact(prev.exercise)}
                          </p>
                        ) : null}
                        <ul className="mt-1 space-y-0.5">
                          {loggedSets(exercise).map((set, i) => (
                            <li key={set.id} className="text-xs text-zinc-400">
                              S{i + 1}: {formatSetLine(set)}
                              {isSetDone(set) ? " ✓" : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}

                  <textarea
                    value={session.notes}
                    onChange={(e) => updateNotes(session.id, e.target.value)}
                    placeholder="Agregar nota…"
                    rows={2}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => copySession(session.id)}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-zinc-950 touch-manipulation active:scale-[0.99]"
                  >
                    {copied === session.id ? (
                      <ClipboardCheck className="h-4 w-4" />
                    ) : (
                      <Clipboard className="h-4 w-4" />
                    )}
                    {copied === session.id ? "Copiado" : "Copiar sesión"}
                  </button>
                </div>
              </details>
            );
          })}
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <h2 className="text-base font-semibold">Backup</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Exportá o restaurá todos tus datos en este dispositivo.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => downloadBackup(data)}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-200 touch-manipulation"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-700 text-sm font-medium text-zinc-200 touch-manipulation"
          >
            <Upload className="h-4 w-4" />
            Importar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              onImport(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        {importError ? <p className="mt-2 text-sm text-red-400">{importError}</p> : null}
      </section>
    </div>
  );
}
