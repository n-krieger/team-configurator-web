import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from '../src/lib/csv';
import { ImportError, parseImport, planToCsv, rosterToCsv } from '../src/lib/fileformat';
import { parseTextList } from '../src/lib/textlist';
import type { Plan, Roster } from '../src/lib/types';

const roster: Roster = {
  id: 'r1',
  name: 'U15 "Dienstag"; Halle 2',
  positions: [
    { id: 'g', label: 'Torhüter' },
    { id: 'd', label: 'Verteidigung' },
    { id: 'f', label: 'Sturm' },
  ],
  players: [
    { id: 'p1', name: 'Anna', position: 'g', strength: 1.2 },
    { id: 'p2', name: 'Ben, Jr.', position: 'd', strength: 0.9 },
    { id: 'p3', name: 'Chloé', position: 'f', strength: 1 },
    { id: 'p4', name: 'Dario', position: 'f', strength: 1.05 },
  ],
  updatedAt: '2026-10-25T10:00:00.000Z',
};

const plan: Plan = {
  id: 'plan1',
  name: 'Training 25.10.',
  roster,
  rounds: [
    { nTeams: 2, absent: [], teams: [['p1', 'p3'], ['p2', 'p4']], locked: true },
    { nTeams: 2, absent: ['p2'], teams: [['p1', 'p4'], ['p3']], locked: false },
    { nTeams: 3, absent: [], teams: [], locked: false },
  ],
  settings: { weights: { a: 100, b: 0.5, c: 2.5 }, restarts: 4, sameFitnessLimit: 8 },
  createdAt: '2026-10-25T09:00:00.000Z',
  updatedAt: '2026-10-25T11:00:00.000Z',
};

describe('csv', () => {
  it('round-trips quotes, delimiters and line breaks', () => {
    const rows = [['a;b', 'say "hi"', 'line\nbreak'], ['x']];
    expect(parseCsv(toCsv(rows, ';'), ';')).toEqual(rows);
  });

  it('strips a byte order mark and detects the delimiter', () => {
    expect(parseCsv('﻿name;position\nAnna;G\n')).toEqual([['name', 'position'], ['Anna', 'G']]);
  });
});

describe('roster files', () => {
  for (const delimiter of [',', ';'] as const) {
    it(`round-trip with "${delimiter}"`, () => {
      const result = parseImport(rosterToCsv(roster, { delimiter, teamLabel: 'Team' }));
      expect(result).toEqual({ kind: 'roster', roster });
    });
  }

  it('imports a plain spreadsheet table with German headers and decimal commas', () => {
    const result = parseImport('Name;Position;Stärke\nAnna;Tor;1,2\nBen;Feld;0,8\nCarla;Feld;\n');
    expect(result.kind).toBe('roster');
    if (result.kind !== 'roster') return;
    expect(result.roster.positions.map((p) => p.label)).toEqual(['Tor', 'Feld']);
    expect(result.roster.players.map((p) => [p.name, p.strength])).toEqual([
      ['Anna', 1.2],
      ['Ben', 0.8],
      ['Carla', 1],
    ]);
  });

  it('imports a plain list of names without header', () => {
    const result = parseImport('Anna\nBen\n');
    expect(result.kind === 'roster' && result.roster.players.map((p) => p.name)).toEqual(['Anna', 'Ben']);
  });

  it('rejects empty files', () => {
    expect(() => parseImport('  \n')).toThrow(ImportError);
  });
});

describe('plan files', () => {
  for (const delimiter of [',', ';'] as const) {
    it(`round-trip with "${delimiter}"`, () => {
      const result = parseImport(planToCsv(plan, { delimiter, teamLabel: 'Team' }));
      expect(result).toEqual({ kind: 'plan', plan });
    });
  }

  it('reports unknown player names', () => {
    // round 2 has the team table rows "Anna;Chloé" and "Dario;"
    const csv = planToCsv(plan, { delimiter: ';', teamLabel: 'Team' }).replace('\r\nDario;\r\n', '\r\nZoe;\r\n');
    expect(() => parseImport(csv)).toThrow(/unknownPlayer: Zoe/);
  });
});

describe('pasted player lists', () => {
  it('understands names, positions and strengths in several formats', () => {
    const lines = parseTextList(
      '- P1 S 1.1\nAnna Maria Torhüter 1,3\nBen; Verteidigung; 0,9\nCarla\n\n',
      roster.positions,
    );
    expect(lines).toEqual([
      { name: 'P1', position: 'f', strength: 1.1 },
      { name: 'Anna Maria', position: 'g', strength: 1.3 },
      { name: 'Ben', position: 'd', strength: 0.9 },
      { name: 'Carla' },
    ]);
  });
});
