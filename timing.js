// Playback order as passes over source ticks: {dir, a: first source tick, n: tick count}.
// Source tick at pass position i is a + dir * i.
export function* passes(t, mode, from = 0) {
  if (!t) return;
  yield { dir: 1, a: from, n: t - from };
  if (mode === 'normal') return;
  for (;;) {
    if (mode === 'boomerang' && t > 2) yield { dir: -1, a: t - 2, n: t - 2 };
    yield { dir: 1, a: 0, n: t };
  }
}

// Output length in ticks for an export.
export function exportTicks(t, mode, by, reps, secs, fps) {
  if (!t) return 0;
  if (mode === 'normal') return t;
  if (by === 'secs') return Math.max(1, Math.round(secs * fps));
  const bounce = mode === 'boomerang' && t > 2;
  // A boomerang ends back on the first frame.
  return Math.max(1, reps) * (bounce ? 2 * t - 2 : t) + (bounce ? 1 : 0);
}

// Index of the frame shown at a tick, given each frame's hold.
export function frameAt(holds, tick) {
  let s = 0;
  for (let i = 0; i < holds.length; i++) if (tick < (s += holds[i])) return i;
  return holds.length - 1;
}
