const pad = (value: number): string => value.toString().padStart(2, '0');

export const getNextShareWindow = (): string => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow.toISOString();
};

export const formatShareCooldownMessage = (isoString: string | null): string | null => {
  if (!isoString) return null;

  const targetTime = new Date(isoString).getTime();
  if (Number.isNaN(targetTime)) return null;

  const diffMs = targetTime - Date.now();
  if (diffMs <= 0) {
    return 'You can share again now!';
  }

  const totalMinutes = Math.ceil(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return minutes <= 1
      ? 'You can share another story in about a minute.'
      : `You can share another story in ${minutes} minutes.`;
  }

  return `You can share another story in ${hours}h ${pad(minutes)}m.`;
};

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

export const formatShareUnlockTime = (isoString: string | null): string | null => {
  if (!isoString) return null;

  const target = new Date(isoString);
  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();
  const targetDateString = target.toDateString();
  const nowDateString = now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const timeString = target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  if (targetDateString === nowDateString) {
    return `Ready later today at ${timeString}`;
  }

  if (targetDateString === tomorrow.toDateString()) {
    return `Ready tomorrow at ${timeString}`;
  }

  const dateLabel = target.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  return `Ready on ${dateLabel} at ${timeString}`;
};

export const getShareCooldownProgress = (
  startIso: string | null,
  endIso: string | null
): number | null => {
  if (!endIso) return null;

  const end = new Date(endIso).getTime();
  if (Number.isNaN(end)) return null;

  const start = startIso ? new Date(startIso).getTime() : end - TWENTY_FOUR_HOURS_IN_MS;
  if (Number.isNaN(start)) return null;

  if (end <= Date.now()) {
    return 1;
  }

  const total = end - start;
  if (total <= 0) {
    return null;
  }

  const elapsed = Date.now() - start;
  const progress = elapsed / total;

  return Math.min(Math.max(progress, 0), 1);
};
