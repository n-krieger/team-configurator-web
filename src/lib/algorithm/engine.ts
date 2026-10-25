/**
 * Team generation engine — a port of the original Python implementation
 * (initialization.py, optimization.py, constellations.py).
 *
 * A plan consists of several rounds. Each round splits the attending players
 * into teams. The optimiser swaps players of the same position between teams
 * and keeps a swap when the fitness does not get worse. The fitness is a
 * weighted sum of
 *   a: share of distinct player pairs that played together
 *   b: penalty for pairs that played together more than once (quadratic)
 *   c: penalty for unequal team strength (variance of mean strengths)
 */

export type Rng = () => number;

export interface Weights {
  a: number;
  b: number;
  c: number;
}

export const DEFAULT_WEIGHTS: Weights = { a: 120, b: 0.1, c: 3 };

export interface EnginePlayer {
  id: string;
  position: string;
  strength: number;
}

/**
 * Locked rounds keep their teams; open rounds are (re)generated. An open round
 * with `start` teams begins the first run from them instead of random teams
 * (ignored if they don't match nTeams/attendees).
 */
export type EngineRound =
  | { locked: true; teams: string[][] }
  | { locked: false; nTeams: number; attendees: string[]; start?: string[][] };

export interface EngineInput {
  players: EnginePlayer[];
  /** Order in which positions are distributed when teams are initialised. */
  positionOrder: string[];
  rounds: EngineRound[];
  weights: Weights;
  restarts: number;
  sameFitnessLimit: number;
}

export interface Progress {
  run: number;
  runs: number;
  bestFitness: number;
}

export interface SolveOptions {
  rng?: Rng;
  onProgress?: (progress: Progress) => void;
}

/** Safety net so a pathological input can never hang the worker. */
const MAX_ITERATIONS = 20_000;

type State = number[][][]; // round -> team -> player index

export function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** Same tolerance as numpy.isclose. */
function isClose(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-8 + 1e-5 * Math.abs(b);
}

class Evaluator {
  private readonly counts: Int32Array;

  constructor(
    private readonly n: number,
    private readonly strengths: Float64Array,
    private readonly weights: Weights,
    private readonly totalPairs: number,
  ) {
    this.counts = new Int32Array(n * n);
  }

  /** Fills the pair counter for `state` and returns the raw fitness parts. */
  private measure(state: State) {
    const { n, counts, strengths } = this;
    counts.fill(0);
    let possible = 0;
    let unique = 0;
    let repeatPenalty = 0; // sum over pairs of (count - 1)^2
    let varianceSum = 0;
    for (const teams of state) {
      let meanSum = 0;
      const means: number[] = [];
      for (const team of teams) {
        const len = team.length;
        possible += (len * (len - 1)) / 2;
        let strength = 0;
        for (let i = 0; i < len; i++) {
          const p = team[i];
          strength += strengths[p];
          for (let j = i + 1; j < len; j++) {
            const q = team[j];
            const c = ++counts[p < q ? p * n + q : q * n + p];
            if (c === 1) unique++;
            else repeatPenalty += 2 * c - 3; // (c-1)^2 - (c-2)^2
          }
        }
        const mean = len > 0 ? strength / len : 0;
        meanSum += mean;
        means.push(mean);
      }
      if (teams.length > 0) {
        const m = meanSum / teams.length;
        let sq = 0;
        for (const mean of means) sq += (mean - m) ** 2;
        varianceSum += sq / teams.length;
      }
    }
    return { possible, unique, repeatPenalty, varianceSum };
  }

  fitness(state: State): number {
    const { possible, unique, repeatPenalty, varianceSum } = this.measure(state);
    const { a, b, c } = this.weights;
    const denominator = Math.min(possible, this.totalPairs);
    const fraction = denominator > 0 ? unique / denominator : 1;
    return a * fraction - b * repeatPenalty - c * varianceSum;
  }

  /** Statistics as printed by `Constellations.summary()` in the Python version. */
  stats(state: State) {
    const fitness = this.fitness(state);
    const { possible, unique } = this.measure(state);
    const appearances: Record<number, number> = {};
    for (let k = 0; k < this.counts.length; k++) {
      const c = this.counts[k];
      if (c > 0) appearances[c] = (appearances[c] ?? 0) + 1;
    }
    return {
      fitness,
      totalPairs: this.totalPairs,
      possiblePairs: possible,
      uniquePairs: unique,
      missingPairs: this.totalPairs - unique,
      appearances,
    };
  }
}

export type PlanStats = ReturnType<Evaluator['stats']>;

function indexPlayers(players: EnginePlayer[], positionOrder: string[]) {
  const index = new Map<string, number>();
  players.forEach((p, i) => index.set(p.id, i));
  const order = [...positionOrder];
  for (const p of players) if (!order.includes(p.position)) order.push(p.position);
  const positionOf = players.map((p) => order.indexOf(p.position));
  const strengths = Float64Array.from(players, (p) => p.strength);
  const lookup = (id: string) => {
    const i = index.get(id);
    if (i === undefined) throw new Error(`Unknown player id: ${id}`);
    return i;
  };
  return { lookup, positionOf, strengths, nPositions: order.length };
}

function countTotalPairs(state: State): number {
  const seen = new Set<number>();
  for (const teams of state) for (const team of teams) for (const p of team) seen.add(p);
  return (seen.size * (seen.size - 1)) / 2;
}

/** Fitness and pair statistics for already generated rounds. */
export function analyse(
  players: EnginePlayer[],
  rounds: string[][][],
  weights: Weights,
): PlanStats {
  const { lookup, strengths } = indexPlayers(players, []);
  const state = rounds.map((teams) => teams.map((team) => team.map(lookup)));
  return new Evaluator(players.length, strengths, weights, countTotalPairs(state)).stats(state);
}

/**
 * Even team sizes (the first teams get one extra player if it does not add
 * up); players are dealt round-robin, position by position, in random order.
 */
function initRound(
  attendees: number[],
  nTeams: number,
  positionOf: number[],
  nPositions: number,
  rng: Rng,
): number[][] {
  const shuffled = shuffle([...attendees], rng);
  const teams: number[][] = Array.from({ length: nTeams }, () => []);
  let k = 0;
  for (let pos = 0; pos < nPositions; pos++) {
    for (const p of shuffled) {
      if (positionOf[p] === pos) teams[k++ % nTeams].push(p);
    }
  }
  return teams;
}

export function validateInput(input: EngineInput): void {
  for (const [i, round] of input.rounds.entries()) {
    if (round.locked) continue;
    if (!Number.isInteger(round.nTeams) || round.nTeams < 1) {
      throw new Error(`Round ${i + 1}: number of teams must be at least 1`);
    }
    if (round.nTeams > round.attendees.length) {
      throw new Error(`Round ${i + 1}: more teams than players`);
    }
  }
}

/**
 * Generates teams for all open rounds and returns all rounds as player ids.
 * Locked rounds are returned unchanged but still count for the fitness.
 */
export function solve(input: EngineInput, options: SolveOptions = {}): string[][][] {
  validateInput(input);
  const rng = options.rng ?? Math.random;
  const { players, rounds, weights } = input;
  const { lookup, positionOf, strengths, nPositions } = indexPlayers(players, input.positionOrder);
  const posIndices = Array.from({ length: nPositions }, (_, i) => i);

  const open = rounds.flatMap((r, i) => (r.locked ? [] : [i]));
  const attendeesOf = rounds.map((r) => (r.locked ? [] : r.attendees.map(lookup)));
  const usableStart = (r: EngineRound): r is Extract<EngineRound, { locked: false }> & { start: string[][] } => {
    if (r.locked || !r.start || r.start.length !== r.nTeams) return false;
    const ids = r.start.flat();
    return ids.length === r.attendees.length && new Set(ids).size === ids.length && ids.every((id) => r.attendees.includes(id));
  };
  const initState = (fromStart: boolean): State =>
    rounds.map((r, i) =>
      r.locked
        ? r.teams.map((team) => team.map(lookup))
        : fromStart && usableStart(r)
          ? r.start.map((team) => team.map(lookup))
          : initRound(attendeesOf[i], r.nTeams, positionOf, nPositions, rng),
    );

  let state = initState(true);
  const evaluator = new Evaluator(players.length, strengths, weights, countTotalPairs(state));
  const toIds = (s: State) => s.map((teams) => teams.map((team) => team.map((p) => players[p].id)));

  if (open.length === 0) return toIds(state);

  /** One pass of the Python `optimisation_iteration`: stop at the first non-worsening swap. */
  const iterate = (current: number): number => {
    for (const r of shuffle([...open], rng)) {
      const teams = state[r];
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const t1 = teams[i];
          const t2 = teams[j];
          for (const pos of shuffle([...posIndices], rng)) {
            const slots1 = shuffle(t1.flatMap((p, s) => (positionOf[p] === pos ? [s] : [])), rng);
            if (slots1.length === 0) continue;
            const slots2 = shuffle(t2.flatMap((p, s) => (positionOf[p] === pos ? [s] : [])), rng);
            for (const s1 of slots1) {
              for (const s2 of slots2) {
                [t1[s1], t2[s2]] = [t2[s2], t1[s1]];
                const fitness = evaluator.fitness(state);
                if (fitness >= current) return fitness;
                [t1[s1], t2[s2]] = [t2[s2], t1[s1]];
              }
            }
          }
        }
      }
    }
    return current;
  };

  const optimiseRun = (): number => {
    let previous = -1e6;
    let current = evaluator.fitness(state);
    let same = 0;
    for (let it = 0; same < input.sameFitnessLimit && it < MAX_ITERATIONS; it++) {
      current = iterate(current);
      same = isClose(current, previous) ? same + 1 : 0;
      previous = current;
    }
    return current;
  };

  const runs = 1 + Math.max(0, input.restarts);
  let bestFitness = optimiseRun();
  let best = structuredClone(state);
  options.onProgress?.({ run: 1, runs, bestFitness });
  for (let run = 2; run <= runs; run++) {
    state = initState(false);
    const fitness = optimiseRun();
    if (fitness > bestFitness) {
      bestFitness = fitness;
      best = structuredClone(state);
    }
    options.onProgress?.({ run, runs, bestFitness });
  }
  return toIds(best);
}
