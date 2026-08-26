import { setActiveCacheUser } from '@/lib/parsing/cache';
import { setStudyStateUser } from '@/lib/study-state';

let activeUserId = '';
const listeners: Array<(userId: string) => void> = [];

function notify(userId: string) {
  listeners.forEach((listener) => listener(userId));
}

/**
 * Central per-user scoping for all on-device local stores (SQLite caches,
 * review cards). Call whenever the auth session changes.
 */
export function setActiveUser(userId: string) {
  const normalized = userId || '';
  if (normalized === activeUserId) return;

  activeUserId = normalized;
  setActiveCacheUser(normalized);
  setStudyStateUser(normalized);
  notify(normalized);
}

export function getActiveUserId() {
  return activeUserId;
}

export function onActiveUserChange(listener: (userId: string) => void) {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index >= 0) listeners.splice(index, 1);
  };
}
