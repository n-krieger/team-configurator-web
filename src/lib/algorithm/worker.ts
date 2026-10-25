/// <reference lib="webworker" />
import { solve, type EngineInput } from './engine';

export type WorkerRequest = { input: EngineInput };
export type WorkerResponse =
  | { type: 'progress'; run: number; runs: number; bestFitness: number }
  | { type: 'done'; rounds: string[][][] }
  | { type: 'error'; message: string };

const post = (message: WorkerResponse) => self.postMessage(message);

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  try {
    const rounds = solve(event.data.input, {
      onProgress: (p) => post({ type: 'progress', ...p }),
    });
    post({ type: 'done', rounds });
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
};
