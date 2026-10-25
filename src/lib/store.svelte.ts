/**
 * All data lives in this browser's localStorage — nothing is sent anywhere.
 * Any change to `db` is persisted automatically.
 */

import type { Plan, Roster } from './types';

const STORAGE_KEY = 'team-configurator:data:v1';

interface Data {
  rosters: Roster[];
  plans: Plan[];
}

function load(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<Data>;
      return { rosters: data.rosters ?? [], plans: data.plans ?? [] };
    }
  } catch {
    // unreadable or blocked storage: start empty
  }
  return { rosters: [], plans: [] };
}

export const db = $state<Data>(load());

export const storageStatus = $state({ persisted: false, writeFailed: false });

$effect.root(() => {
  $effect(() => {
    const json = JSON.stringify(db);
    try {
      localStorage.setItem(STORAGE_KEY, json);
      storageStatus.writeFailed = false;
    } catch {
      storageStatus.writeFailed = true;
    }
  });
});

/** Asks the browser not to evict our data (granted e.g. for installed apps). */
export async function requestPersistence(): Promise<void> {
  try {
    if (!navigator.storage?.persist) return;
    storageStatus.persisted = (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch {
    storageStatus.persisted = false;
  }
}

export function findRoster(id: string): Roster | undefined {
  return db.rosters.find((r) => r.id === id);
}

export function findPlan(id: string): Plan | undefined {
  return db.plans.find((p) => p.id === id);
}

export function upsertRoster(roster: Roster): void {
  const i = db.rosters.findIndex((r) => r.id === roster.id);
  if (i === -1) db.rosters.unshift(roster);
  else db.rosters[i] = roster;
}

export function upsertPlan(plan: Plan): void {
  const i = db.plans.findIndex((p) => p.id === plan.id);
  if (i === -1) db.plans.unshift(plan);
  else db.plans[i] = plan;
}

export function deleteRoster(id: string): void {
  db.rosters = db.rosters.filter((r) => r.id !== id);
}

export function deletePlan(id: string): void {
  db.plans = db.plans.filter((p) => p.id !== id);
}

export function deleteAll(): void {
  db.rosters = [];
  db.plans = [];
}
