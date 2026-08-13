import {
  bestSetLabel,
  exerciseVolume,
  formatSetLine,
  isSetDone,
  loggedSets,
} from "./metrics";
import { formatLongDate, migrateToV2, todayISO } from "./storage";
import type { AppData, WorkoutSession } from "./types";

export function formatSessionMarkdown(session: WorkoutSession): string {
  const lines: string[] = [
    `# Entrenamiento — ${formatLongDate(session.date)}`,
    `Rutina: ${session.routineName}`,
  ];
  if (session.notes.trim()) {
    lines.push(`Notas: ${session.notes.trim()}`);
  }
  lines.push("");

  for (const ex of session.exercises) {
    const sets = loggedSets(ex);
    if (!sets.length) continue;
    lines.push(`## ${ex.exerciseName}`);
    sets.forEach((s, i) => {
      lines.push(`- S${i + 1}: ${formatSetLine(s)}${isSetDone(s) ? " ✓" : ""}`);
    });
    lines.push(
      `Volumen: ${Math.round(exerciseVolume(ex)).toLocaleString("es-AR")} kg · Mejor serie: ${bestSetLabel(ex)}`
    );
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      window.prompt("Copiá el texto:", text);
      return false;
    }
  }
}

export function downloadBackup(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fitapp-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseBackup(text: string): AppData | null {
  try {
    return migrateToV2(JSON.parse(text));
  } catch {
    return null;
  }
}
