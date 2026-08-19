"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import type { Exercise } from "@/lib/types";

function moveItem(ids: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0) return ids;
  const next = [...ids];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export default function ReorderableExerciseList({
  items,
  onReorder,
  onRemove,
}: {
  items: Exercise[];
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
}) {
  const [ids, setIds] = useState(items.map((e) => e.id));
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState(0);
  const [settle, setSettle] = useState(false);

  const dragIdRef = useRef<string | null>(null);
  const originIndexRef = useRef(0);
  const overIndexRef = useRef(0);
  const startYRef = useRef(0);
  const lastDyRef = useRef(0);
  const slotHeightRef = useRef(52);
  const onReorderRef = useRef(onReorder);
  const listRef = useRef<HTMLUListElement>(null);
  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const droppingRef = useRef(false);

  const byId = new Map(items.map((e) => [e.id, e]));

  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  useEffect(() => {
    if (!dragId) setIds(items.map((e) => e.id));
  }, [items, dragId]);

  useLayoutEffect(() => {
    if (!dragId) return;
    const el = rowRefs.current.get(dragId);
    if (!el || droppingRef.current) return;
    el.style.transition = "none";
    el.style.transform = `translateY(${lastDyRef.current}px) scale(1.03)`;
  }, [dragId, overIndex]);

  useEffect(() => {
    if (!dragId) return;

    function setDragTransform(dy: number, scaling = true) {
      const el = rowRefs.current.get(dragIdRef.current ?? "");
      if (!el) return;
      const scale = scaling ? 1.03 : 1;
      el.style.transform = `translateY(${dy}px) scale(${scale})`;
    }

    function onMove(event: PointerEvent) {
      if (droppingRef.current || !dragIdRef.current) return;
      event.preventDefault();
      const dy = event.clientY - startYRef.current;
      lastDyRef.current = dy;
      setDragTransform(dy);
      const shift = Math.round(dy / slotHeightRef.current);
      const nextOver = clamp(originIndexRef.current + shift, 0, ids.length - 1);
      if (nextOver !== overIndexRef.current) {
        overIndexRef.current = nextOver;
        setOverIndex(nextOver);
      }
    }

    function onUp() {
      if (droppingRef.current || !dragIdRef.current) return;
      droppingRef.current = true;
      const from = originIndexRef.current;
      const to = overIndexRef.current;
      const el = rowRefs.current.get(dragIdRef.current);
      const target = (to - from) * slotHeightRef.current;

      if (el) {
        el.style.transition = "transform 200ms ease";
        el.style.transform = `translateY(${target}px) scale(1)`;
      }

      window.setTimeout(() => {
        const next = moveItem(ids, from, to);
        if (from !== to) {
          setSettle(true);
          setIds(next);
          onReorderRef.current(next);
        }
        if (el) {
          el.style.transition = "";
          el.style.transform = "";
        }
        dragIdRef.current = null;
        droppingRef.current = false;
        setDragId(null);
        window.requestAnimationFrame(() => setSettle(false));
      }, 200);
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragId, ids]);

  function shiftFor(index: number): number {
    if (!dragId) return 0;
    const from = originIndexRef.current;
    const to = overIndex;
    if (index === from) return 0;
    if (from < to && index > from && index <= to) return -slotHeightRef.current;
    if (from > to && index >= to && index < from) return slotHeightRef.current;
    return 0;
  }

  if (items.length === 0) return null;

  return (
    <ul ref={listRef} className="space-y-2">
      {ids.map((id, index) => {
        const exercise = byId.get(id);
        if (!exercise) return null;
        const dragging = dragId === id;
        const shift = shiftFor(index);
        return (
          <li
            key={id}
            data-exercise-id={id}
            ref={(node) => {
              if (node) rowRefs.current.set(id, node);
              else rowRefs.current.delete(id);
            }}
            style={{
              transform: dragging ? undefined : shift ? `translateY(${shift}px)` : undefined,
              transition:
                dragging || settle ? "box-shadow 150ms ease" : "transform 200ms ease",
              zIndex: dragging ? 20 : 1,
            }}
            className={`flex items-center gap-1 rounded-xl bg-zinc-950 py-1 pl-1 pr-2 will-change-transform ${
              dragging ? "relative shadow-lg shadow-black/40 ring-2 ring-emerald-500/70" : ""
            }`}
          >
            <button
              type="button"
              aria-label={`Reordenar ${exercise.name}`}
              onPointerDown={(event) => {
                if (items.length < 2) return;
                event.preventDefault();
                const row = rowRefs.current.get(id);
                const height = row?.getBoundingClientRect().height ?? 44;
                slotHeightRef.current = height + 8;
                originIndexRef.current = index;
                overIndexRef.current = index;
                startYRef.current = event.clientY;
                dragIdRef.current = id;
                droppingRef.current = false;
                lastDyRef.current = 0;
                setOverIndex(index);
                setDragId(id);
              }}
              className="flex h-11 w-11 shrink-0 touch-none items-center justify-center rounded-xl text-zinc-500"
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{exercise.name}</span>
            <button
              type="button"
              aria-label="Quitar de la rutina"
              onClick={() => onRemove(id)}
              className="flex h-10 w-10 shrink-0 items-center justify-center text-zinc-500 touch-manipulation"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
