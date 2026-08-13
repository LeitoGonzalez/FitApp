import type { AppData, Routine, SetEntry, WorkoutSession } from "./types";

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

export function emptySet(): SetEntry {
  return { id: uid(), weight: "", reps: "", rir: "", completed: false };
}

export const defaultRoutines: Routine[] = [
  {
    id: "r-push",
    name: "Push",
    exercises: [
      { id: "e-press-banca", name: "Press banca" },
      { id: "e-press-inclinado", name: "Press inclinado" },
      { id: "e-press-militar", name: "Press militar" },
      { id: "e-aperturas", name: "Aperturas" },
      { id: "e-triceps", name: "Tríceps en polea" },
      { id: "e-fondos", name: "Fondos" },
    ],
  },
  {
    id: "r-pull",
    name: "Pull",
    exercises: [
      { id: "e-dominadas", name: "Dominadas" },
      { id: "e-remo-barra", name: "Remo con barra" },
      { id: "e-remo-unilateral", name: "Remo unilateral" },
      { id: "e-face-pull", name: "Face pull" },
      { id: "e-curl-biceps", name: "Curl bíceps" },
      { id: "e-hiperextensiones", name: "Hiperextensiones" },
    ],
  },
  {
    id: "r-legs",
    name: "Legs",
    exercises: [
      { id: "e-sentadilla", name: "Sentadilla" },
      { id: "e-prensa", name: "Prensa" },
      { id: "e-peso-muerto-r", name: "Peso muerto rumano" },
      { id: "e-extensiones", name: "Extensiones de cuádriceps" },
      { id: "e-curl-femoral", name: "Curl femoral" },
      { id: "e-gemelos", name: "Gemelos" },
    ],
  },
];

export const defaultData: AppData = {
  routines: defaultRoutines,
  sessions: [],
  activeRoutineId: "r-push",
};

export function loadData(): AppData {
  if (typeof window === "undefined") return defaultData;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || !Array.isArray(parsed.routines) || !Array.isArray(parsed.sessions)) {
      return defaultData;
    }
    return {
      routines: parsed.routines,
      sessions: parsed.sessions,
      activeRoutineId: parsed.activeRoutineId ?? parsed.routines[0]?.id ?? null,
    };
  } catch {
    return defaultData;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createSession(routine: Routine, date = todayISO()): WorkoutSession {
  return {
    id: uid(),
    date,
    routineId: routine.id,
    routineName: routine.name,
    exercises: routine.exercises.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      sets: [emptySet(), emptySet(), emptySet()],
    })),
  };
}

export function syncSessionWithRoutine(session: WorkoutSession, routine: Routine): WorkoutSession {
  const routineIds = new Set(routine.exercises.map((e) => e.id));
  const kept = session.exercises
    .filter((e) => routineIds.has(e.exerciseId))
    .map((e) => ({
      ...e,
      exerciseName: routine.exercises.find((r) => r.id === e.exerciseId)?.name ?? e.exerciseName,
    }));
  const existing = new Set(kept.map((e) => e.exerciseId));
  const added = routine.exercises
    .filter((e) => !existing.has(e.id))
    .map((e) => ({
      exerciseId: e.id,
      exerciseName: e.name,
      sets: [emptySet(), emptySet(), emptySet()],
    }));
  const order = routine.exercises.map((e) => e.id);
  const merged = [...kept, ...added].sort(
    (a, b) => order.indexOf(a.exerciseId) - order.indexOf(b.exerciseId)
  );
  return { ...session, routineName: routine.name, exercises: merged };
}

export function ensureTodaySession(data: AppData): AppData {
  const routine = data.routines.find((r) => r.id === data.activeRoutineId);
  if (!routine) return data;
  const date = todayISO();
  const idx = data.sessions.findIndex((s) => s.date === date && s.routineId === routine.id);
  if (idx === -1) {
    return { ...data, sessions: [...data.sessions, createSession(routine, date)] };
  }
  const synced = syncSessionWithRoutine(data.sessions[idx], routine);
  const sessions = data.sessions.map((s, i) => (i === idx ? synced : s));
  return { ...data, sessions };
}

export function isSessionMeaningful(session: WorkoutSession): boolean {
  return session.exercises.some((ex) =>
    ex.sets.some((s) => s.completed || s.weight !== "" || s.reps !== "")
  );
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
