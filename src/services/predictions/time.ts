export function isPredictionOpen(startsAt: Date | null, now = new Date()) {
  return startsAt ? now.getTime() < startsAt.getTime() : false;
}
