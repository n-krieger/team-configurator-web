import { describe, expect, it } from 'vitest';
import reference from './fixtures/reference.json';
import {
  DEFAULT_WEIGHTS,
  analyse,
  mulberry32,
  solve,
  type EngineInput,
  type EnginePlayer,
} from '../src/lib/algorithm/engine';

describe('fitness matches the Python implementation', () => {
  for (const ref of reference) {
    it(ref.name, () => {
      const weights = { ...DEFAULT_WEIGHTS, ...ref.weights };
      const stats = analyse(ref.players, ref.rounds, weights);
      expect(stats.fitness).toBeCloseTo(ref.expected.fitness, 9);
      expect(stats.totalPairs).toBe(ref.expected.totalPairs);
      expect(stats.possiblePairs).toBe(ref.expected.possiblePairs);
      expect(stats.missingPairs).toBe(ref.expected.missingPairs);
      const appearances = Object.fromEntries(
        Object.entries(stats.appearances).map(([k, v]) => [String(k), v]),
      );
      expect(appearances).toEqual(ref.expected.appearances);
    });
  }
});

function squad(n: number): EnginePlayer[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    position: i < 3 ? 'G' : i % 2 ? 'D' : 'F',
    strength: 0.5 + (i % 5) * 0.2,
  }));
}

function baseInput(players: EnginePlayer[], nRounds: number, nTeams: number): EngineInput {
  return {
    players,
    positionOrder: ['G', 'D', 'F'],
    rounds: Array.from({ length: nRounds }, () => ({
      locked: false as const,
      nTeams,
      attendees: players.map((p) => p.id),
    })),
    weights: DEFAULT_WEIGHTS,
    restarts: 2,
    sameFitnessLimit: 10,
  };
}

describe('solve', () => {
  it('places every attending player exactly once per round with even team sizes', () => {
    const players = squad(19);
    const input = baseInput(players, 4, 4);
    input.rounds[1] = { locked: false, nTeams: 3, attendees: players.slice(2).map((p) => p.id) };
    const rounds = solve(input, { rng: mulberry32(1) });
    rounds.forEach((teams, r) => {
      const expected = input.rounds[r].locked ? [] : input.rounds[r].attendees;
      expect(teams.flat().sort()).toEqual([...expected].sort());
      const sizes = teams.map((t) => t.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    });
  });

  it('spreads each position as evenly as possible across teams', () => {
    const players = squad(16);
    const rounds = solve(baseInput(players, 3, 3), { rng: mulberry32(2) });
    const positionOf = new Map(players.map((p) => [p.id, p.position]));
    for (const teams of rounds) {
      for (const position of ['G', 'D', 'F']) {
        const counts = teams.map((t) => t.filter((id) => positionOf.get(id) === position).length);
        expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('keeps locked rounds unchanged', () => {
    const players = squad(12);
    const locked = [players.slice(0, 6).map((p) => p.id), players.slice(6).map((p) => p.id)];
    const input = baseInput(players, 3, 2);
    input.rounds[0] = { locked: true, teams: locked };
    const rounds = solve(input, { rng: mulberry32(3) });
    expect(rounds[0]).toEqual(locked);
  });

  it('beats random initial teams on fitness', () => {
    const players = squad(20);
    const input = baseInput(players, 5, 4);
    const optimised = analyse(players, solve(input, { rng: mulberry32(4) }), DEFAULT_WEIGHTS);
    const random = analyse(
      players,
      solve({ ...input, sameFitnessLimit: 0, restarts: 0 }, { rng: mulberry32(4) }),
      DEFAULT_WEIGHTS,
    );
    expect(optimised.fitness).toBeGreaterThan(random.fitness);
  });

  it('reports progress for every run', () => {
    const runs: number[] = [];
    solve(baseInput(squad(10), 2, 2), {
      rng: mulberry32(5),
      onProgress: (p) => runs.push(p.run),
    });
    expect(runs).toEqual([1, 2, 3]);
  });

  it('works with a single position', () => {
    const players = squad(9).map((p) => ({ ...p, position: 'X' }));
    const input = { ...baseInput(players, 3, 3), positionOrder: ['X'] };
    const rounds = solve(input, { rng: mulberry32(6) });
    expect(rounds.every((teams) => teams.every((t) => t.length === 3))).toBe(true);
  });

  it('rejects more teams than players', () => {
    expect(() => solve(baseInput(squad(3), 1, 4))).toThrow();
  });
});
