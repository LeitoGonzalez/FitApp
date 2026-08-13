import type { LastSet, SessionExercise, SetEntry, WorkoutSession } from "./types";

export function parseNum(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function formatDeltaNum(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function formatVolume(n: number): string {
  return Math.round(n).toLocaleString("es-AR");
}

export function setVolume(set: SetEntry): number {
  return parseNum(set.weight) * parseNum(set.reps);
}

export function isSetValid(set: Pick<SetEntry, "weight" | "reps">): boolean {
  return set.weight.trim() !== "" && set.reps.trim() !== "" && parseNum(set.reps) > 0;
}

export function isSetDone(set: SetEntry): boolean {
  return set.completed && isSetValid(set);
}

export function loggedSets(exercise: SessionExercise): SetEntry[] {
  return exercise.sets.filter(isSetValid);
}

export function exerciseVolume(exercise: SessionExercise): number {
  return loggedSets(exercise).reduce((n, s) => n + setVolume(s), 0);
}

export function exerciseBestWeight(exercise: SessionExercise): number {
  const weights = loggedSets(exercise).map((s) => parseNum(s.weight));
  return weights.length ? Math.max(...weights) : 0;
}

export function formatSetLine(set: SetEntry): string {
  const load = set.weight ? `${set.weight} kg` : "—";
  const reps = set.reps ? `× ${set.reps}` : "";
  const rir = set.rir !== "" ? ` RIR ${set.rir}` : "";
  return `${load} ${reps}${rir}`.replace(/\s+/g, " ").trim();
}

export function formatReadableSetGroup(count: number, set: Pick<LastSet, "weight" | "reps" | "rir">): string {
  const n = count === 1 ? "1 serie" : `${count} series`;
  const weight = set.weight ? `${set.weight} kg` : "sin peso";
  const reps = set.reps ?? "—";
  const rir = set.rir !== "" ? `, RIR ${set.rir}` : "";
  return `${n} de ${weight} × ${reps}${rir}`;
}

export function formatReadableSets(sets: Pick<LastSet, "weight" | "reps" | "rir">[]): string {
  const filled = sets.filter((s) => s.weight || s.reps);
  const groups: { count: number; set: (typeof filled)[number] }[] = [];
  for (const set of filled) {
    const last = groups[groups.length - 1];
    const same =
      last &&
      last.set.weight === set.weight &&
      last.set.reps === set.reps &&
      last.set.rir === set.rir;
    if (same) last.count += 1;
    else groups.push({ count: 1, set });
  }
  return groups.map((g) => formatReadableSetGroup(g.count, g.set)).join(" · ");
}

export function formatSetsCompact(exercise: SessionExercise): string {
  return formatReadableSets(loggedSets(exercise));
}

export function bestSetLabel(exercise: SessionExercise): string {
  const sets = loggedSets(exercise);
  if (!sets.length) return "—";
  let best = sets[0];
  for (const s of sets.slice(1)) {
    const bw = parseNum(best.weight);
    const sw = parseNum(s.weight);
    const br = parseNum(best.reps);
    const sr = parseNum(s.reps);
    if (sw > bw || (sw === bw && sr > br)) best = s;
  }
  if (!best.weight && !best.reps) return "—";
  return `${best.weight || "—"} × ${best.reps || "—"}`;
}

export function sameExercise(a: SessionExercise, exerciseId: string, exerciseName: string): boolean {
  if (a.exerciseId && a.exerciseId === exerciseId) return true;
  return a.exerciseName.trim().toLowerCase() === exerciseName.trim().toLowerCase();
}

export function findPreviousExercise(
  sessions: WorkoutSession[],
  currentSessionId: string,
  exerciseId: string,
  exerciseName: string,
  beforeDate?: string
): { session: WorkoutSession; exercise: SessionExercise } | null {
  const ordered = [...sessions]
    .filter((s) => s.id !== currentSessionId)
    .filter((s) => (beforeDate ? s.date < beforeDate : true))
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  for (const session of ordered) {
    const exercise = session.exercises.find((e) => sameExercise(e, exerciseId, exerciseName));
    if (exercise && loggedSets(exercise).length) {
      return { session, exercise };
    }
  }
  return null;
}

export function lastSetsFrom(exercise: SessionExercise | null | undefined): LastSet[] {
  if (!exercise) return [];
  return loggedSets(exercise).map((s) => ({ weight: s.weight, reps: s.reps, rir: s.rir }));
}

export type SetDelta = {
  kind: "up" | "down" | "same";
  label: string;
};

export function setDelta(current: SetEntry, prev?: LastSet): SetDelta | null {
  if (!isSetDone(current) || !prev) return null;
  const hasPrev = Boolean(prev.weight || prev.reps);
  if (!hasPrev) return null;

  const cw = parseNum(current.weight);
  const pw = parseNum(prev.weight);
  const cr = parseNum(current.reps);
  const pr = parseNum(prev.reps);
  const hasWeights = Boolean(current.weight && prev.weight);
  const hasReps = Boolean(current.reps && prev.reps);

  if (hasWeights && cw !== pw) {
    const d = cw - pw;
    return d > 0
      ? { kind: "up", label: `↑ +${formatDeltaNum(d)} kg` }
      : { kind: "down", label: `↓ ${formatDeltaNum(d)} kg` };
  }

  if (hasReps && cr !== pr) {
    const d = cr - pr;
    const unit = Math.abs(d) === 1 ? "rep" : "reps";
    return d > 0
      ? { kind: "up", label: `↑ +${d} ${unit}` }
      : { kind: "down", label: `↓ ${d} ${unit}` };
  }

  if (hasWeights || hasReps) return { kind: "same", label: "= mismo peso" };
  return null;
}

export type ProgressPoint = {
  date: string;
  volume: number;
  bestWeight: number;
};

export function progressPoints(sessions: WorkoutSession[], exerciseId: string): ProgressPoint[] {
  return [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
    .flatMap((session) => {
      const exercise = session.exercises.find((e) => e.exerciseId === exerciseId);
      if (!exercise || !loggedSets(exercise).length) return [];
      return [
        {
          date: session.date,
          volume: exerciseVolume(exercise),
          bestWeight: exerciseBestWeight(exercise),
        },
      ];
    });
}

export function trainedExercises(
  sessions: WorkoutSession[],
  catalog: { id: string; name: string }[]
): { id: string; name: string }[] {
  const names = new Map(catalog.map((e) => [e.id, e.name]));
  const seen = new Map<string, string>();
  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (!loggedSets(ex).length) continue;
      if (!seen.has(ex.exerciseId)) {
        seen.set(ex.exerciseId, names.get(ex.exerciseId) ?? ex.exerciseName);
      }
    }
  }
  return Array.from(seen.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
