import type { Weights } from './algorithm/engine';

export interface Position {
  id: string;
  label: string;
}

export interface Player {
  id: string;
  name: string;
  /** Id of one of the roster's positions. */
  position: string;
  strength: number;
}

export interface Roster {
  id: string;
  name: string;
  /** Order matters: positions are dealt to teams in this order (e.g. goalkeepers first). */
  positions: Position[];
  players: Player[];
  updatedAt: string;
}

export interface Round {
  nTeams: number;
  /** Ids of players who do not attend this round. */
  absent: string[];
  /** Generated teams as player ids; empty while the round is not generated yet. */
  teams: string[][];
  /** Locked rounds are kept when generating; they still count for the pairings. */
  locked: boolean;
  /** Attendance changed after generating; the teams were patched and should be optimised. */
  adjusted?: boolean;
}

export interface PlanSettings {
  weights: Weights;
  restarts: number;
  sameFitnessLimit: number;
}

export interface Plan {
  id: string;
  name: string;
  /** Snapshot of the player list at creation, so a plan is complete on its own when shared. */
  roster: Roster;
  rounds: Round[];
  settings: PlanSettings;
  createdAt: string;
  updatedAt: string;
}
