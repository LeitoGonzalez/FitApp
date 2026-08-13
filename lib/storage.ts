import type { AppData, Exercise, Routine, SetEntry, WorkoutSession } from "./types";
import { isSetValid } from "./metrics";

export const STORAGE_KEY = "fitapp-data-v1";

export function uid(): string {
  return crypto.randomUUID();
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatLongDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export function emptySet(): SetEntry {
  return { id: uid(), weight: "", reps: "", rir: "", completed: false };
}

export const defaultExercises: Exercise[] = [
  { id: "e-press-banca", name: "Press banca" },
  { id: "e-press-inclinado", name: "Press inclinado" },
  { id: "e-press-militar", name: "Press militar" },
  { id: "e-aperturas", name: "Aperturas" },
  { id: "e-triceps", name: "Tríceps en polea" },
  { id: "e-fondos", name: "Fondos" },
  { id: "e-dominadas", name: "Dominadas" },
  { id: "e-remo-barra", name: "Remo con barra" },
  { id: "e-remo-unilateral", name: "Remo unilateral" },
  { id: "e-face-pull", name: "Face pull" },
  { id: "e-curl-biceps", name: "Curl bíceps" },
  { id: "e-hiperextensiones", name: "Hiperextensiones" },
  { id: "e-sentadilla", name: "Sentadilla" },
  { id: "e-prensa", name: "Prensa" },
  { id: "e-peso-muerto-r", name: "Peso muerto rumano" },
  { id: "e-extensiones", name: "Extensiones de cuádriceps" },
  { id: "e-curl-femoral", name: "Curl femoral" },
  { id: "e-gemelos", name: "Gemelos" },
];

export const defaultRoutines: Routine[] = [
  {
    id: "r-push",
    name: "Push",
    exerciseIds: [
      "e-press-banca",
      "e-press-inclinado",
      "e-press-militar",
      "e-aperturas",
      "e-triceps",
      "e-fondos",
    ],
  },
  {
    id: "r-pull",
    name: "Pull",
    exerciseIds: [
      "e-dominadas",
      "e-remo-barra",
      "e-remo-unilateral",
      "e-face-pull",
      "e-curl-biceps",
      "e-hiperextensiones",
    ],
  },
  {
    id: "r-legs",
    name: "Legs",
    exerciseIds: [
      "e-sentadilla",
      "e-prensa",
      "e-peso-muerto-r",
      "e-extensiones",
      "e-curl-femoral",
      "e-gemelos",
    ],
  },
];

export const defaultData: AppData = {
  version: 2,
  exercises: defaultExercises,
  routines: defaultRoutines,
  sessions: [],
  activeRoutineId: "r-push",
};

export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export function resolveExercises(exercises: Exercise[], ids: string[]): Exercise[] {
  const map = new Map(exercises.map((e) => [e.id, e]));
  return ids.map((id) => map.get(id)).filter((e): e is Exercise => Boolean(e));
}

export function findExerciseByName(exercises: Exercise[], name: string): Exercise | undefined {
  const key = normalizeName(name);
  return exercises.find((e) => normalizeName(e.name) === key);
}

type RawRoutine = {
  id: string;
  name: string;
  exerciseIds?: string[];
  exercises?: { id: string; name: string }[];
};

type RawSession = {
  id: string;
  date: string;
  routineId: string;
  routineName: string;
  notes?: string;
  exercises?: {
    exerciseId: string;
    exerciseName: string;
    sets: SetEntry[];
  }[];
};

export function migrateToV2(raw: unknown): AppData | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as {
    version?: number;
    exercises?: Exercise[];
    routines?: RawRoutine[];
    sessions?: RawSession[];
    activeRoutineId?: string | null;
  };

  if (!Array.isArray(data.routines) || !Array.isArray(data.sessions)) return null;

  if (data.version === 2 && Array.isArray(data.exercises)) {
    return {
      version: 2,
      exercises: data.exercises.map((e) => ({ id: e.id, name: e.name })),
      routines: data.routines.map((r) => ({
        id: r.id,
        name: r.name,
        exerciseIds: Array.isArray(r.exerciseIds)
          ? r.exerciseIds
          : (r.exercises ?? []).map((e) => e.id),
      })),
      sessions: data.sessions.map((s) => ({
        id: s.id,
        date: s.date,
        routineId: s.routineId,
        routineName: s.routineName,
        notes: s.notes ?? "",
        exercises: s.exercises ?? [],
      })),
      activeRoutineId: data.activeRoutineId ?? data.routines[0]?.id ?? null,
    };
  }

  const nameToId = new Map<string, string>();
  const oldIdToNew = new Map<string, string>();
  const exercises: Exercise[] = [];

  for (const routine of data.routines) {
    for (const ex of routine.exercises ?? []) {
      const key = normalizeName(ex.name);
      if (!key) continue;
      const existing = nameToId.get(key);
      if (existing) {
        oldIdToNew.set(ex.id, existing);
      } else {
        nameToId.set(key, ex.id);
        oldIdToNew.set(ex.id, ex.id);
        exercises.push({ id: ex.id, name: ex.name.trim() });
      }
    }
  }

  const routines: Routine[] = data.routines.map((r) => ({
    id: r.id,
    name: r.name,
    exerciseIds: Array.from(
      new Set(
        (r.exerciseIds ?? (r.exercises ?? []).map((ex) => oldIdToNew.get(ex.id) ?? ex.id)).filter(
          Boolean
        )
      )
    ),
  }));

  const sessions: WorkoutSession[] = data.sessions.map((s) => ({
    id: s.id,
    date: s.date,
    routineId: s.routineId,
    routineName: s.routineName,
    notes: s.notes ?? "",
    exercises: (s.exercises ?? []).map((ex) => {
      const remapped = oldIdToNew.get(ex.exerciseId);
      const byName = findExerciseByName(exercises, ex.exerciseName)?.id;
      return {
        ...ex,
        exerciseId: remapped ?? byName ?? ex.exerciseId,
      };
    }),
  }));

  return {
    version: 2,
    exercises,
    routines,
    sessions,
    activeRoutineId: data.activeRoutineId ?? routines[0]?.id ?? null,
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    return migrateToV2(JSON.parse(raw)) ?? defaultData;
  } catch {
    return defaultData;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createSession(data: AppData, routine: Routine, date = todayISO()): WorkoutSession {
  const list = resolveExercises(data.exercises, routine.exerciseIds);
  return {
    id: uid(),
    date,
    routineId: routine.id,
    routineName: routine.name,
    notes: "",
    exercises: list.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: [emptySet(), emptySet(), emptySet()],
    })),
  };
}

export function syncSessionWithRoutine(
  data: AppData,
  session: WorkoutSession,
  routine: Routine
): WorkoutSession {
  const list = resolveExercises(data.exercises, routine.exerciseIds);
  const byId = new Map(session.exercises.map((e) => [e.exerciseId, e]));
  const exercises = list.map((ex) => {
    const existing = byId.get(ex.id);
    if (existing) return { ...existing, exerciseName: ex.name };
    return {
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: [emptySet(), emptySet(), emptySet()],
    };
  });
  return { ...session, routineName: routine.name, notes: session.notes ?? "", exercises };
}

export function ensureTodaySession(data: AppData): AppData {
  const routine = data.routines.find((r) => r.id === data.activeRoutineId);
  if (!routine) return data;
  const date = todayISO();
  const idx = data.sessions.findIndex((s) => s.date === date && s.routineId === routine.id);
  if (idx === -1) {
    return { ...data, sessions: [...data.sessions, createSession(data, routine, date)] };
  }
  const synced = syncSessionWithRoutine(data, data.sessions[idx], routine);
  const sessions = data.sessions.map((s, i) => (i === idx ? synced : s));
  return { ...data, sessions };
}

export function isSessionMeaningful(session: WorkoutSession): boolean {
  return session.exercises.some((ex) => ex.sets.some(isSetValid));
}

export function sanitizeDecimal(value: string): string {
  const cleaned = value.replace(/[^0-9.,]/g, "");
  const parts = cleaned.replace(",", ".").split(".");
  if (parts.length === 1) return parts[0];
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

export function sanitizeInt(value: string): string {
  return value.replace(/[^0-9]/g, "");
}
