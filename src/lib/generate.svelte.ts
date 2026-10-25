import { engineInput } from './plan';
import type { Plan } from './types';
import { now } from './util';
import type { WorkerRequest, WorkerResponse } from './algorithm/worker';

/** State of the running generation, shown as an overlay. */
export const generation = $state({ running: false, run: 0, runs: 0 });

let current: { worker: Worker; reject: (reason: Error) => void } | undefined;

export class Cancelled extends Error {}

/** Generates the rounds `targets` of `plan` in a worker and writes the teams into the plan. */
export function generate(plan: Plan, targets: number[]): Promise<void> {
  cancelGeneration();
  // plain data: reactive proxies can't be posted to a worker
  const { input, roundIndex } = engineInput($state.snapshot(plan), targets);
  const worker = new Worker(new URL('./algorithm/worker.ts', import.meta.url), { type: 'module' });
  Object.assign(generation, { running: true, run: 0, runs: input.restarts + 1 });

  return new Promise<void>((resolve, reject) => {
    current = { worker, reject };
    const finish = () => {
      worker.terminate();
      current = undefined;
      generation.running = false;
    };
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        generation.run = msg.run;
        generation.runs = msg.runs;
      } else if (msg.type === 'done') {
        msg.rounds.forEach((teams, k) => {
          const i = roundIndex[k];
          if (targets.includes(i)) plan.rounds[i].teams = teams;
        });
        plan.updatedAt = now();
        finish();
        resolve();
      } else {
        finish();
        reject(new Error(msg.message));
      }
    };
    worker.onerror = (event) => {
      finish();
      reject(new Error(event.message || 'Worker error'));
    };
    try {
      worker.postMessage({ input } satisfies WorkerRequest);
    } catch (error) {
      finish();
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

export function cancelGeneration(): void {
  if (!current) return;
  current.worker.terminate();
  current.reject(new Cancelled());
  current = undefined;
  generation.running = false;
}
