/** Derive elapsed time from the server baseline, including time spent in the background. */
export function remainingTime(
  seconds: number,
  receivedAt: number,
  now: number,
) {
  if (seconds < 0) return seconds;
  return Math.max(
    0,
    seconds - Math.floor(Math.max(0, now - receivedAt) / 1000),
  );
}
