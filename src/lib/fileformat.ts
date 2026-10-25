/**
 * CSV files for sharing player lists and plans between coaches.
 *
 * The files are meant to stay readable and editable in Excel/Numbers:
 *
 *   TeamConfigurator;plan;1
 *   [plan]
 *   id;…
 *   name;U15 Tuesday
 *   …
 *   [positions]
 *   id;label
 *   g;Goalkeeper
 *   [players]
 *   id;name;position;strength
 *   p1;Anna;Goalkeeper;1,2
 *   [round]
 *   teams;2
 *   locked;yes
 *   absent;Ben
 *   Team 1;Team 2
 *   Anna;Carla
 *
 * Plain player tables (name, position, strength) from a spreadsheet are imported too.
 */

import { DEFAULT_WEIGHTS } from './algorithm/engine';
import { detectDelimiter, parseCsv, toCsv, type Delimiter } from './csv';
import type { Plan, Player, Position, Roster, Round } from './types';
import { newId, now } from './util';

export const MAGIC = 'TeamConfigurator';
export const FORMAT_VERSION = 1;

export type ImportErrorCode =
  | 'empty'
  | 'unknownFormat'
  | 'newerVersion'
  | 'noPlayers'
  | 'unknownPlayer'
  | 'invalidRound';

export class ImportError extends Error {
  constructor(
    public readonly code: ImportErrorCode,
    public readonly detail = '',
  ) {
    super(`${code}${detail ? `: ${detail}` : ''}`);
  }
}

export type Imported = { kind: 'roster'; roster: Roster } | { kind: 'plan'; plan: Plan };

export interface ExportOptions {
  delimiter: Delimiter;
  /** Translated "Team" label for the column headers. */
  teamLabel: string;
}

// ---------------------------------------------------------------- export

function num(value: number, delimiter: Delimiter): string {
  const s = String(value);
  return delimiter === ';' ? s.replace('.', ',') : s;
}

function rosterRows(roster: Roster, delimiter: Delimiter): string[][] {
  const label = new Map(roster.positions.map((p) => [p.id, p.label]));
  return [
    ['[roster]'],
    ['id', roster.id],
    ['name', roster.name],
    ['updated', roster.updatedAt],
    ['[positions]'],
    ['id', 'label'],
    ...roster.positions.map((p) => [p.id, p.label]),
    ['[players]'],
    ['id', 'name', 'position', 'strength'],
    ...roster.players.map((p) => [
      p.id,
      p.name,
      label.get(p.position) ?? '',
      num(p.strength, delimiter),
    ]),
  ];
}

export function rosterToCsv(roster: Roster, { delimiter }: ExportOptions): string {
  return toCsv([[MAGIC, 'roster', String(FORMAT_VERSION)], ...rosterRows(roster, delimiter)], delimiter);
}

export function planToCsv(plan: Plan, { delimiter, teamLabel }: ExportOptions): string {
  const name = new Map(plan.roster.players.map((p) => [p.id, p.name]));
  const { weights, restarts, sameFitnessLimit } = plan.settings;
  const rows: string[][] = [
    [MAGIC, 'plan', String(FORMAT_VERSION)],
    ['[plan]'],
    ['id', plan.id],
    ['name', plan.name],
    ['created', plan.createdAt],
    ['updated', plan.updatedAt],
    ['weight a', num(weights.a, delimiter)],
    ['weight b', num(weights.b, delimiter)],
    ['weight c', num(weights.c, delimiter)],
    ['restarts', String(restarts)],
    ['same fitness limit', String(sameFitnessLimit)],
    ...rosterRows(plan.roster, delimiter),
  ];
  for (const round of plan.rounds) {
    rows.push(
      ['[round]'],
      ['teams', String(round.nTeams)],
      ['locked', round.locked ? 'yes' : 'no'],
      ['absent', ...round.absent.map((id) => name.get(id) ?? id)],
    );
    if (round.adjusted) rows.push(['adjusted', 'yes']);
    if (round.teams.length > 0) {
      rows.push(round.teams.map((_, i) => `${teamLabel} ${i + 1}`));
      const height = Math.max(...round.teams.map((t) => t.length));
      for (let r = 0; r < height; r++) {
        rows.push(round.teams.map((t) => (t[r] ? (name.get(t[r]) ?? t[r]) : '')));
      }
    }
  }
  return toCsv(rows, delimiter);
}

// ---------------------------------------------------------------- import

function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback;
  const n = Number(value.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}

function sections(rows: string[][]): { name: string; rows: string[][] }[] {
  const out: { name: string; rows: string[][] }[] = [];
  for (const row of rows) {
    const m = row.length === 1 ? /^\[(.+)\]$/.exec(row[0]) : null;
    if (m) out.push({ name: m[1].toLowerCase(), rows: [] });
    else if (out.length > 0 && row.length > 0) out[out.length - 1].rows.push(row);
  }
  return out;
}

function keyValues(rows: string[][]): Map<string, string[]> {
  return new Map(rows.map((r) => [r[0].toLowerCase(), r.slice(1)]));
}

function readRoster(secs: ReturnType<typeof sections>): Roster {
  const meta = keyValues(secs.find((s) => s.name === 'roster')?.rows ?? []);
  const positionRows = (secs.find((s) => s.name === 'positions')?.rows ?? []).slice(1);
  const playerRows = (secs.find((s) => s.name === 'players')?.rows ?? []).slice(1);

  const positions: Position[] = positionRows
    .filter((r) => r[0] || r[1])
    .map((r) => ({ id: r[0] || newId(), label: r[1] ?? r[0] }));
  const resolvePosition = positionResolver(positions);
  const players: Player[] = playerRows
    .filter((r) => r[1])
    .map((r) => ({
      id: r[0] || newId(),
      name: r[1],
      position: resolvePosition(r[2] ?? ''),
      strength: parseNumber(r[3], 1),
    }));
  if (players.length === 0) throw new ImportError('noPlayers');
  return {
    id: meta.get('id')?.[0] || newId(),
    name: meta.get('name')?.[0] ?? '',
    positions,
    players,
    updatedAt: meta.get('updated')?.[0] || now(),
  };
}

/** Matches a position by label or id; unknown values become a new position. */
function positionResolver(positions: Position[]): (value: string) => string {
  return (value: string) => {
    const v = value.trim().toLowerCase();
    const found =
      positions.find((p) => p.label.toLowerCase() === v) ?? positions.find((p) => p.id.toLowerCase() === v);
    if (found) return found.id;
    if (positions.length > 0 && v === '') return positions[0].id;
    const created = { id: newId(), label: value.trim() || '–' };
    positions.push(created);
    return created.id;
  };
}

const yes = (cells: string[] | undefined) => /^(yes|ja|true|1)$/i.test(cells?.[0] ?? '');

function readPlan(secs: ReturnType<typeof sections>): Plan {
  const meta = keyValues(secs.find((s) => s.name === 'plan')?.rows ?? []);
  const roster = readRoster(secs);
  const idByName = new Map(roster.players.map((p) => [p.name.toLowerCase(), p.id]));
  const ids = new Set(roster.players.map((p) => p.id));
  const resolve = (name: string) => {
    const id = idByName.get(name.toLowerCase()) ?? (ids.has(name) ? name : undefined);
    if (!id) throw new ImportError('unknownPlayer', name);
    return id;
  };

  const rounds: Round[] = secs
    .filter((s) => s.name === 'round')
    .map((s) => {
      const headerIndex = s.rows.findIndex((r) => !['teams', 'locked', 'absent', 'adjusted'].includes(r[0].toLowerCase()));
      const info = keyValues(headerIndex === -1 ? s.rows : s.rows.slice(0, headerIndex));
      const table = headerIndex === -1 ? [] : s.rows.slice(headerIndex + 1);
      const width = headerIndex === -1 ? 0 : s.rows[headerIndex].length;
      const teams: string[][] = Array.from({ length: width }, (_, c) =>
        table.map((r) => r[c] ?? '').filter(Boolean).map(resolve),
      );
      const nTeams = Math.round(parseNumber(info.get('teams')?.[0], width || 2));
      if (nTeams < 1) throw new ImportError('invalidRound');
      return {
        nTeams,
        absent: (info.get('absent') ?? []).filter(Boolean).map(resolve),
        teams,
        locked: yes(info.get('locked')) && teams.length > 0,
        ...(yes(info.get('adjusted')) && teams.length > 0 ? { adjusted: true } : {}),
      };
    });

  return {
    id: meta.get('id')?.[0] || newId(),
    name: meta.get('name')?.[0] ?? roster.name,
    roster,
    rounds,
    settings: {
      weights: {
        a: parseNumber(meta.get('weight a')?.[0], DEFAULT_WEIGHTS.a),
        b: parseNumber(meta.get('weight b')?.[0], DEFAULT_WEIGHTS.b),
        c: parseNumber(meta.get('weight c')?.[0], DEFAULT_WEIGHTS.c),
      },
      restarts: Math.round(parseNumber(meta.get('restarts')?.[0], 10)),
      sameFitnessLimit: Math.round(parseNumber(meta.get('same fitness limit')?.[0], 10)),
    },
    createdAt: meta.get('created')?.[0] || now(),
    updatedAt: meta.get('updated')?.[0] || now(),
  };
}

const NAME_HEADERS = ['name', 'player', 'spieler', 'spielerin', 'vorname'];
const POSITION_HEADERS = ['position', 'pos', 'role', 'rolle'];
const STRENGTH_HEADERS = ['strength', 'stärke', 'staerke', 'level', 'niveau'];

/** A plain table from a spreadsheet: name, position, strength (header row optional). */
function readPlainTable(rows: string[][]): Roster {
  const header = rows[0].map((h) => h.toLowerCase());
  const col = (names: string[]) => header.findIndex((h) => names.includes(h));
  const hasHeader = col(NAME_HEADERS) !== -1;
  const nameCol = hasHeader ? col(NAME_HEADERS) : 0;
  const positionCol = hasHeader ? col(POSITION_HEADERS) : 1;
  const strengthCol = hasHeader ? col(STRENGTH_HEADERS) : 2;
  const positions: Position[] = [];
  const resolvePosition = positionResolver(positions);
  const players: Player[] = (hasHeader ? rows.slice(1) : rows)
    .filter((r) => r[nameCol])
    .map((r) => ({
      id: newId(),
      name: r[nameCol],
      position: resolvePosition(positionCol === -1 ? '' : (r[positionCol] ?? '')),
      strength: parseNumber(strengthCol === -1 ? undefined : r[strengthCol], 1),
    }));
  if (players.length === 0) throw new ImportError('noPlayers');
  return { id: newId(), name: '', positions, players, updatedAt: now() };
}

export function parseImport(text: string): Imported {
  if (text.trim() === '') throw new ImportError('empty');
  const rows = parseCsv(text, detectDelimiter(text)).filter((r) => r.length > 0);
  if (rows.length === 0) throw new ImportError('empty');
  const [magic, kind, version] = rows[0];
  if (magic !== MAGIC) return { kind: 'roster', roster: readPlainTable(rows) };
  if (Number(version) > FORMAT_VERSION) throw new ImportError('newerVersion');
  const secs = sections(rows.slice(1));
  if (kind === 'roster') return { kind: 'roster', roster: readRoster(secs) };
  if (kind === 'plan') return { kind: 'plan', plan: readPlan(secs) };
  throw new ImportError('unknownFormat');
}

export function fileName(name: string, kind: 'roster' | 'plan'): string {
  const base = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return `${base || kind}.${kind === 'roster' ? 'players' : 'teams'}.csv`;
}
