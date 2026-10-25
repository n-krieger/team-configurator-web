import { analyse, type EngineInput, type PlanStats } from './algorithm/engine';
import type { ExportOptions } from './fileformat';
import { locale, t } from './i18n.svelte';
import type { Plan, Player, Position, Roster, Round } from './types';
import { clone, duplicates, newId, now } from './util';

export type PresetKind = 'three' | 'two' | 'none';

export function presetPositions(kind: PresetKind): Position[] {
  const labels =
    kind === 'three'
      ? [t('goalkeeper'), t('defender'), t('forward')]
      : kind === 'two'
        ? [t('goalkeeper'), t('fieldPlayer')]
        : [t('player')];
  return labels.map((label) => ({ id: newId(), label }));
}

export function newRoster(): Roster {
  return { id: newId(), name: '', positions: presetPositions('three'), players: [], updatedAt: now() };
}

export function rosterProblems(roster: Roster) {
  const dupNames = duplicates(roster.players.map((p) => p.name));
  const dupPositions = duplicates(roster.positions.map((p) => p.label));
  const isDuplicate = (p: Player) => dupNames.has(p.name.trim().toLowerCase());
  const isEmpty = (p: Player) => p.name.trim() === '';
  return {
    isDuplicate,
    isEmpty,
    isDuplicatePosition: (p: Position) => dupPositions.has(p.label.trim().toLowerCase()),
    ok: dupNames.size === 0 && dupPositions.size === 0 && !roster.players.some(isEmpty),
  };
}

export function newRound(nTeams: number): Round {
  return { nTeams, absent: [], teams: [], locked: false };
}

export function createPlan(roster: Roster, name: string, nRounds: number, nTeams: number, settings: Plan['settings']): Plan {
  return {
    id: newId(),
    name,
    roster: clone(roster),
    rounds: Array.from({ length: nRounds }, () => newRound(nTeams)),
    settings: clone(settings),
    createdAt: now(),
    updatedAt: now(),
  };
}

export function attendees(plan: Plan, round: Round): Player[] {
  const absent = new Set(round.absent);
  return plan.roster.players.filter((p) => !absent.has(p.id));
}

export function isGenerated(round: Round): boolean {
  return round.teams.length > 0;
}

/**
 * Engine input for regenerating the rounds in `targets`. Other generated
 * rounds count as fixed; rounds without teams are left out. With
 * `fromCurrent`, targets that have teams are improved instead of rebuilt.
 */
export function engineInput(
  plan: Plan,
  targets: number[],
  { fromCurrent = false } = {},
): { input: EngineInput; roundIndex: number[] } {
  const roundIndex: number[] = [];
  const rounds: EngineInput['rounds'] = [];
  plan.rounds.forEach((round, i) => {
    if (targets.includes(i)) {
      roundIndex.push(i);
      rounds.push({
        locked: false,
        nTeams: round.nTeams,
        attendees: attendees(plan, round).map((p) => p.id),
        start: fromCurrent && isGenerated(round) ? round.teams : undefined,
      });
    } else if (isGenerated(round)) {
      roundIndex.push(i);
      rounds.push({ locked: true, teams: round.teams });
    }
  });
  return {
    input: {
      players: plan.roster.players.map(({ id, position, strength }) => ({ id, position, strength })),
      positionOrder: plan.roster.positions.map((p) => p.id),
      rounds,
      ...clone(plan.settings),
      // improving keeps the current teams; restarts would throw them away
      ...(fromCurrent ? { restarts: 0 } : {}),
    },
    roundIndex,
  };
}

export function playerMap(plan: Plan): Map<string, Player> {
  return new Map(plan.roster.players.map((p) => [p.id, p]));
}

export function teamStrength(plan: Plan, team: string[]): number {
  const players = playerMap(plan);
  if (team.length === 0) return 0;
  return team.reduce((sum, id) => sum + (players.get(id)?.strength ?? 1), 0) / team.length;
}

export function planStats(plan: Plan): PlanStats | undefined {
  const rounds = plan.rounds.filter(isGenerated).map((r) => r.teams);
  if (rounds.length === 0) return undefined;
  return analyse(
    plan.roster.players.map(({ id, position, strength }) => ({ id, position, strength })),
    rounds,
    plan.settings.weights,
  );
}

/**
 * Adds players and positions that were added to the saved list since the plan
 * was created. Generated rounds mark the new players as absent so they stay
 * consistent until regenerated. Returns the number of added players.
 */
export function syncFromRoster(plan: Plan, roster: Roster): number {
  const knownPlayers = new Set(plan.roster.players.map((p) => p.id));
  const knownPositions = new Set(plan.roster.positions.map((p) => p.id));
  const added = roster.players.filter((p) => !knownPlayers.has(p.id));
  for (const position of roster.positions) {
    if (!knownPositions.has(position.id)) plan.roster.positions.push(clone(position));
  }
  for (const player of added) plan.roster.players.push(clone(player));
  for (const round of plan.rounds) {
    if (isGenerated(round)) round.absent.push(...added.map((p) => p.id));
  }
  if (added.length > 0) plan.updatedAt = now();
  return added.length;
}

/** A WhatsApp-friendly text version of the plan. */
export function planText(plan: Plan): string {
  const players = playerMap(plan);
  const lines = [`*${plan.name}*`];
  plan.rounds.forEach((round, r) => {
    if (!isGenerated(round)) return;
    lines.push('', `*${t('round', { n: r + 1 })}*`);
    round.teams.forEach((team, i) => {
      const names = team.map((id) => players.get(id)?.name ?? '?').join(', ');
      lines.push(`${t('team')} ${i + 1}: ${names}`);
    });
  });
  return lines.join('\n');
}

/** German Excel expects ";" and decimal commas; English uses ",". */
export function exportOptions(): ExportOptions {
  return { delimiter: locale.lang === 'de' ? ';' : ',', teamLabel: t('team') };
}

/**
 * Applies a new attendance to a generated round without rebuilding it:
 * absent players leave their team, new players join the smallest team with
 * the fewest players of their position, then team sizes are evened out.
 */
export function fitAttendance(plan: Plan, round: Round, absent: string[]): void {
  const positionOf = new Map(plan.roster.players.map((p) => [p.id, p.position]));
  const absentSet = new Set(absent);
  const teams = round.teams.map((team) => team.filter((id) => !absentSet.has(id)));
  const placed = new Set(teams.flat());
  const samePosition = (team: string[], position: string | undefined) =>
    team.filter((id) => positionOf.get(id) === position).length;

  for (const player of plan.roster.players) {
    if (absentSet.has(player.id) || placed.has(player.id)) continue;
    const target = teams.reduce((best, team) =>
      team.length < best.length ||
      (team.length === best.length && samePosition(team, player.position) < samePosition(best, player.position))
        ? team
        : best,
    );
    target.push(player.id);
  }

  for (;;) {
    const largest = teams.reduce((a, b) => (b.length > a.length ? b : a));
    const smallest = teams.reduce((a, b) => (b.length < a.length ? b : a));
    if (largest.length - smallest.length <= 1) break;
    // move the player whose position is most over-represented compared to the smallest team
    const surplus = (id: string) => samePosition(largest, positionOf.get(id)) - samePosition(smallest, positionOf.get(id));
    const mover = largest.reduce((a, b) => (surplus(b) > surplus(a) ? b : a));
    largest.splice(largest.indexOf(mover), 1);
    smallest.push(mover);
  }

  round.teams = teams;
  round.absent = absent;
  round.adjusted = true;
}

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** How often each pair of players was in the same team, over all generated rounds. */
export function pairCounts(plan: Plan) {
  const counts = new Map<string, number>();
  const seen = new Set<string>();
  for (const round of plan.rounds) {
    for (const team of round.teams) {
      for (let i = 0; i < team.length; i++) {
        seen.add(team[i]);
        for (let j = i + 1; j < team.length; j++) {
          const key = pairKey(team[i], team[j]);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
    }
  }
  return {
    /** Players who are in at least one generated round, in roster order. */
    participants: plan.roster.players.filter((p) => seen.has(p.id)),
    count: (a: string, b: string) => counts.get(pairKey(a, b)) ?? 0,
  };
}

/** All pairs of participants grouped by how often they played together (0 = never). */
export function pairsByCount(plan: Plan): Map<number, [Player, Player][]> {
  const { participants, count } = pairCounts(plan);
  const groups = new Map<number, [Player, Player][]>();
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const k = count(participants[i].id, participants[j].id);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push([participants[i], participants[j]]);
    }
  }
  return groups;
}
