"use client";

type Point = { label: string; value: number };

export default function LineChart({ points }: { points: Point[] }) {
  const w = 320;
  const h = 180;
  const padL = 40;
  const padR = 12;
  const padT = 16;
  const padB = 28;
  const values = points.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min = Math.max(0, min * 0.9);
    max = max === 0 ? 1 : max * 1.1;
  }
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const coords = points.map((p, i) => {
    const x = padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = padT + innerH - ((p.value - min) / (max - min)) * innerH;
    return { x, y, ...p };
  });

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  const first = coords[0];
  const last = coords[coords.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img">
      <line x1={padL} y1={padT} x2={padL} y2={h - padB} stroke="#3f3f46" strokeWidth="1" />
      <line x1={padL} y1={h - padB} x2={w - padR} y2={h - padB} stroke="#3f3f46" strokeWidth="1" />
      <text x={4} y={padT + 4} fill="#71717a" fontSize="10">
        {Math.round(max)}
      </text>
      <text x={4} y={h - padB} fill="#71717a" fontSize="10">
        {Math.round(min)}
      </text>
      <path d={path} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinejoin="round" />
      {coords.map((c) => (
        <circle key={`${c.label}-${c.x}`} cx={c.x} cy={c.y} r="3.5" fill="#34d399" />
      ))}
      {first ? (
        <text x={first.x} y={h - 8} fill="#71717a" fontSize="10" textAnchor="start">
          {first.label}
        </text>
      ) : null}
      {last && last !== first ? (
        <text x={last.x} y={h - 8} fill="#71717a" fontSize="10" textAnchor="end">
          {last.label}
        </text>
      ) : null}
    </svg>
  );
}
