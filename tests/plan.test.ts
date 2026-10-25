import { describe, expect, it } from 'vitest';
import { DEFAULT_WEIGHTS, analyse, mulberry32, solve } from '../src/lib/algorithm/engine';
import { engineInput, fitAttendance, pairsByCount, planStats } from '../src/lib/plan';
import type { Plan } from '../src/lib/types';

function makePlan(nPlayers: number, nRounds: number, nTeams: number): Plan {
  const positions = [
    { id: 'g', label: 'Goalkeeper' },
    { id: 'f', label: 'Field' },
  ];
  const players = Array.from({ length: nPlayers }, (_, i) => ({
    id: `p${i}`,
    name: `P${i}`,
    position: i < nTeams ? 'g' : 'f',
    strength: 0.6 + (i % 4) * 0.25,
  }));
  return {
    id: 'plan',
    name: 'Test',
    roster: { id: 'r', name: 'R', positions, players, updatedAt: '' },
    rounds: Array.from({ length: nRounds }, () => ({ nTeams, absent: [], teams: [], locked: false })),
    settings: { weights: DEFAULT_WEIGHTS, restarts: 2, sameFitnessLimit: 10 },
    createdAt: '',
    updatedAt: '',
  };
}

function generateAll(plan: Plan, seed: number, fromCurrent = false) {
  const targets = plan.rounds.map((_, i) => i);
  const { input, roundIndex } = engineInput(plan, targets, { fromCurrent });
  solve(input, { rng: mulberry32(seed) }).forEach((teams, k) => (plan.rounds[roundIndex[k]].teams = teams));
}

const fitness = (plan: Plan) => planStats(plan)!.fitness;

describe('optimising from the current teams', () => {
  it('never makes the plan worse and keeps every round complete', () => {
    const plan = makePlan(15, 4, 3);
    generateAll(plan, 1);
    fitAttendance(plan, plan.rounds[1], ['p4', 'p7']);
    fitAttendance(plan, plan.rounds[2], ['p5']);
    const before = fitness(plan);
    generateAll(plan, 2, true);
    expect(fitness(plan)).toBeGreaterThanOrEqual(before);
    expect(plan.rounds[1].teams.flat().sort()).toEqual(
      plan.roster.players.map((p) => p.id).filter((id) => !['p4', 'p7'].includes(id)).sort(),
    );
  });

  it('starts from the given teams (no restarts)', () => {
    const plan = makePlan(12, 2, 2);
    generateAll(plan, 3);
    const { input } = engineInput(plan, [0, 1], { fromCurrent: true });
    expect(input.restarts).toBe(0);
    expect(input.rounds.every((r) => !r.locked && r.start)).toBe(true);
  });

  it('ignores start teams that do not match the attendance', () => {
    const plan = makePlan(10, 1, 2);
    generateAll(plan, 4);
    plan.rounds[0].absent = ['p9']; // teams still contain p9
    const { input } = engineInput(plan, [0], { fromCurrent: true });
    const [teams] = solve(input, { rng: mulberry32(5) });
    expect(teams.flat()).not.toContain('p9');
    expect(teams.flat()).toHaveLength(9);
  });
});

describe('fitAttendance', () => {
  it('removes absent players, adds returning ones and evens out team sizes', () => {
    const plan = makePlan(13, 1, 3);
    plan.rounds[0].absent = ['p12'];
    generateAll(plan, 6);
    // three players of the same team leave, the absent one returns
    const leaving = plan.rounds[0].teams[0].filter((id) => !['p0', 'p1', 'p2'].includes(id)).slice(0, 3);
    fitAttendance(plan, plan.rounds[0], leaving);
    const round = plan.rounds[0];
    expect(round.adjusted).toBe(true);
    expect(round.absent).toEqual(leaving);
    expect(round.teams.flat()).toContain('p12');
    expect(round.teams.flat()).toHaveLength(13 - leaving.length);
    const sizes = round.teams.map((t) => t.length);
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });
});

describe('pairsByCount', () => {
  it('agrees with the engine statistics', () => {
    const plan = makePlan(14, 5, 3);
    plan.rounds[2].absent = ['p13', 'p6'];
    generateAll(plan, 7);
    const groups = pairsByCount(plan);
    const stats = analyse(plan.roster.players, plan.rounds.map((r) => r.teams), DEFAULT_WEIGHTS);
    expect(groups.get(0)?.length ?? 0).toBe(stats.missingPairs);
    for (const [k, n] of Object.entries(stats.appearances)) {
      expect(groups.get(Number(k))?.length).toBe(n);
    }
  });
});
