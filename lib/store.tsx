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
  findExerciseByName,
  loadData,
  normalizeName,
  saveData,
  todayISO,
  uid,
} from "./storage";
import { findPreviousExercise, lastSetsFrom } from "./metrics";

type CatalogResult = { id: string } | { error: "empty" | "duplicate" };

type StoreValue = {
  data: AppData;
  hydrated: boolean;
  todaySession: WorkoutSession | null;
  lastSetsFor: (exerciseId: string, exerciseName: string) => LastSet[];
  setActiveRoutine: (id: string) => void;
  updateSet: (exerciseId: string, setId: string, patch: Partial<SetEntry>) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  updateNotes: (sessionId: string, notes: string) => void;
  addRoutine: (name: string) => void;
  updateRoutineName: (id: string, name: string) => void;
  deleteRoutine: (id: string) => void;
  addExerciseToRoutine: (routineId: string, exerciseId: string) => void;
  removeExerciseFromRoutine: (routineId: string, exerciseId: string) => void;
  addCatalogExercise: (name: string) => CatalogResult;
  updateCatalogExercise: (id: string, name: string) => CatalogResult;
  deleteCatalogExercise: (id: string) => void;
  replaceData: (next: AppData) => void;
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
    (exerciseId: string, exerciseName: string): LastSet[] => {
      const prev = findPreviousExercise(
        data.sessions,
        todaySession?.id ?? "",
        exerciseId,
        exerciseName
      );
      return lastSetsFrom(prev?.exercise);
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
          const next: SetEntry = last ? { ...last, id: uid(), completed: false } : emptySet();
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

  const updateNotes = useCallback((sessionId: string, notes: string) => {
    setData((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) => (s.id === sessionId ? { ...s, notes } : s)),
    }));
  }, []);

  const addRoutine = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = uid();
    setData((prev) => {
      const routines = [...prev.routines, { id, name: trimmed, exerciseIds: [] }];
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

  const addExerciseToRoutine = useCallback((routineId: string, exerciseId: string) => {
    setData((prev) =>
      ensureTodaySession({
        ...prev,
        routines: prev.routines.map((r) => {
          if (r.id !== routineId || r.exerciseIds.includes(exerciseId)) return r;
          return { ...r, exerciseIds: [...r.exerciseIds, exerciseId] };
        }),
      })
    );
  }, []);

  const removeExerciseFromRoutine = useCallback((routineId: string, exerciseId: string) => {
    setData((prev) =>
      ensureTodaySession({
        ...prev,
        routines: prev.routines.map((r) =>
          r.id !== routineId ? r : { ...r, exerciseIds: r.exerciseIds.filter((id) => id !== exerciseId) }
        ),
      })
    );
  }, []);

  const addCatalogExercise = useCallback((name: string): CatalogResult => {
    const trimmed = name.trim();
    if (!trimmed) return { error: "empty" };
    if (findExerciseByName(data.exercises, trimmed)) return { error: "duplicate" };
    const id = uid();
    setData((prev) => {
      if (findExerciseByName(prev.exercises, trimmed)) return prev;
      return { ...prev, exercises: [...prev.exercises, { id, name: trimmed }] };
    });
    return { id };
  }, [data.exercises]);

  const updateCatalogExercise = useCallback((id: string, name: string): CatalogResult => {
    const trimmed = name.trim();
    if (!trimmed) return { error: "empty" };
    const clash = data.exercises.find(
      (e) => e.id !== id && normalizeName(e.name) === normalizeName(trimmed)
    );
    if (clash) return { error: "duplicate" };
    setData((prev) => {
      if (
        prev.exercises.find((e) => e.id !== id && normalizeName(e.name) === normalizeName(trimmed))
      ) {
        return prev;
      }
      return ensureTodaySession({
        ...prev,
        exercises: prev.exercises.map((e) => (e.id === id ? { ...e, name: trimmed } : e)),
      });
    });
    return { id };
  }, [data.exercises]);

  const deleteCatalogExercise = useCallback((id: string) => {
    setData((prev) =>
      ensureTodaySession({
        ...prev,
        exercises: prev.exercises.filter((e) => e.id !== id),
        routines: prev.routines.map((r) => ({
          ...r,
          exerciseIds: r.exerciseIds.filter((eid) => eid !== id),
        })),
      })
    );
  }, []);

  const replaceData = useCallback((next: AppData) => {
    setData(ensureTodaySession(next));
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
      updateNotes,
      addRoutine,
      updateRoutineName,
      deleteRoutine,
      addExerciseToRoutine,
      removeExerciseFromRoutine,
      addCatalogExercise,
      updateCatalogExercise,
      deleteCatalogExercise,
      replaceData,
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
      updateNotes,
      addRoutine,
      updateRoutineName,
      deleteRoutine,
      addExerciseToRoutine,
      removeExerciseFromRoutine,
      addCatalogExercise,
      updateCatalogExercise,
      deleteCatalogExercise,
      replaceData,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de StoreProvider");
  return ctx;
}
