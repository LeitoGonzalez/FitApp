"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppData, LastSet, SetEntry, WorkoutSession } from "./types";
import {
  defaultData,
  emptySet,
  ensureTodaySession,
  isSessionMeaningful,
  loadData,
  saveData,
  todayISO,
  uid,
} from "./storage";

type StoreValue = {
  data: AppData;
  hydrated: boolean;
  todaySession: WorkoutSession | null;
  lastSetsFor: (exerciseName: string) => LastSet[];
  setActiveRoutine: (id: string) => void;
  updateSet: (exerciseId: string, setId: string, patch: Partial<SetEntry>) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  addRoutine: (name: string) => void;
  updateRoutineName: (id: string, name: string) => void;
  deleteRoutine: (id: string) => void;
  addExercise: (routineId: string, name: string) => void;
  updateExerciseName: (routineId: string, exerciseId: string, name: string) => void;
  deleteExercise: (routineId: string, exerciseId: string) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

function patchTodaySession(
  data: AppData,
  updater: (session: WorkoutSession) => WorkoutSession
): AppData {
  const date = todayISO();
  const routineId = data.activeRoutineId;
  return {
    ...data,
    sessions: data.sessions.map((s) =>
      s.date === date && s.routineId === routineId ? updater(s) : s
    ),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(ensureTodaySession(loadData()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveData(data);
  }, [data, hydrated]);

  const todaySession = useMemo(() => {
    if (!data.activeRoutineId) return null;
    const date = todayISO();
    return data.sessions.find((s) => s.date === date && s.routineId === data.activeRoutineId) ?? null;
  }, [data]);

  const lastSetsFor = useCallback(
    (exerciseName: string): LastSet[] => {
      const currentId = todaySession?.id;
      const sessions = [...data.sessions]
        .filter((s) => s.id !== currentId && isSessionMeaningful(s))
        .sort((a, b) => b.date.localeCompare(a.date));

      for (const session of sessions) {
        const match = session.exercises.find(
          (e) => e.exerciseName.toLowerCase() === exerciseName.toLowerCase()
        );
        if (match?.sets.some((s) => s.weight || s.reps)) {
          return match.sets.map((s) => ({ weight: s.weight, reps: s.reps, rir: s.rir }));
        }
      }
      return [];
    },
    [data.sessions, todaySession?.id]
  );

  const setActiveRoutine = useCallback((id: string) => {
    setData((prev) => ensureTodaySession({ ...prev, activeRoutineId: id }));
  }, []);

  const updateSet = useCallback((exerciseId: string, setId: string, patch: Partial<SetEntry>) => {
    setData((prev) =>
      patchTodaySession(prev, (session) => ({
        ...session,
        exercises: session.exercises.map((ex) =>
          ex.exerciseId !== exerciseId
            ? ex
            : {
                ...ex,
                sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
              }
        ),
      }))
    );
  }, []);

  const addSet = useCallback((exerciseId: string) => {
    setData((prev) =>
      patchTodaySession(prev, (session) => ({
        ...session,
        exercises: session.exercises.map((ex) => {
          if (ex.exerciseId !== exerciseId) return ex;
          const last = ex.sets[ex.sets.length - 1];
          const next: SetEntry = last
            ? { ...last, id: uid(), completed: false }
            : emptySet();
          return { ...ex, sets: [...ex.sets, next] };
        }),
      }))
    );
  }, []);

  const removeSet = useCallback((exerciseId: string, setId: string) => {
    setData((prev) =>
      patchTodaySession(prev, (session) => ({
        ...session,
        exercises: session.exercises.map((ex) => {
          if (ex.exerciseId !== exerciseId || ex.sets.length <= 1) return ex;
          return { ...ex, sets: ex.sets.filter((s) => s.id !== setId) };
        }),
      }))
    );
  }, []);

  const addRoutine = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = uid();
    setData((prev) => {
      const routines = [...prev.routines, { id, name: trimmed, exercises: [] }];
      return ensureTodaySession({
        ...prev,
        routines,
        activeRoutineId: prev.activeRoutineId ?? id,
      });
    });
  }, []);

  const updateRoutineName = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setData((prev) =>
      ensureTodaySession({
        ...prev,
        routines: prev.routines.map((r) => (r.id === id ? { ...r, name: trimmed } : r)),
      })
    );
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    setData((prev) => {
      const routines = prev.routines.filter((r) => r.id !== id);
      const activeRoutineId =
        prev.activeRoutineId === id ? (routines[0]?.id ?? null) : prev.activeRoutineId;
      return ensureTodaySession({ ...prev, routines, activeRoutineId });
    });
  }, []);

  const addExercise = useCallback((routineId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setData((prev) =>
      ensureTodaySession({
        ...prev,
        routines: prev.routines.map((r) =>
          r.id !== routineId
            ? r
            : { ...r, exercises: [...r.exercises, { id: uid(), name: trimmed }] }
        ),
      })
    );
  }, []);

  const updateExerciseName = useCallback((routineId: string, exerciseId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setData((prev) =>
      ensureTodaySession({
        ...prev,
        routines: prev.routines.map((r) =>
          r.id !== routineId
            ? r
            : {
                ...r,
                exercises: r.exercises.map((e) =>
                  e.id === exerciseId ? { ...e, name: trimmed } : e
                ),
              }
        ),
      })
    );
  }, []);

  const deleteExercise = useCallback((routineId: string, exerciseId: string) => {
    setData((prev) =>
      ensureTodaySession({
        ...prev,
        routines: prev.routines.map((r) =>
          r.id !== routineId
            ? r
            : { ...r, exercises: r.exercises.filter((e) => e.id !== exerciseId) }
        ),
      })
    );
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      data,
      hydrated,
      todaySession,
      lastSetsFor,
      setActiveRoutine,
      updateSet,
      addSet,
      removeSet,
      addRoutine,
      updateRoutineName,
      deleteRoutine,
      addExercise,
      updateExerciseName,
      deleteExercise,
    }),
    [
      data,
      hydrated,
      todaySession,
      lastSetsFor,
      setActiveRoutine,
      updateSet,
      addSet,
      removeSet,
      addRoutine,
      updateRoutineName,
      deleteRoutine,
      addExercise,
      updateExerciseName,
      deleteExercise,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
