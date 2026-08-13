export type Exercise = {
  id: string;
  name: string;
};

export type Routine = {
  id: string;
  name: string;
  exercises: Exercise[];
};

export type SetEntry = {
  id: string;
  weight: string;
  reps: string;
  rir: string;
  completed: boolean;
};

export type SessionExercise = {
  exerciseId: string;
  exerciseName: string;
  sets: SetEntry[];
};

export type WorkoutSession = {
  id: string;
  date: string;
  routineId: string;
  routineName: string;
  exercises: SessionExercise[];
};

export type AppData = {
  routines: Routine[];
  sessions: WorkoutSession[];
  activeRoutineId: string | null;
};

export type LastSet = {
  weight: string;
  reps: string;
  rir: string;
};
