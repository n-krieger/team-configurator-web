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
 * rounds count as fixed; rounds without teams are left out.
 */
export function engineInput(plan: Plan, targets: number[]): { input: EngineInput; roundIndex: number[] } {
  const roundIndex: number[] = [];
  const rounds: EngineInput['rounds'] = [];
  plan.rounds.forEach((round, i) => {
    if (targets.includes(i)) {
      roundIndex.push(i);
      rounds.push({ locked: false, nTeams: round.nTeams, attendees: attendees(plan, round).map((p) => p.id) });
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
