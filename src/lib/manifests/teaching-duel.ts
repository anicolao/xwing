export const RULESET_ID = 'ffg-second-edition-1.3.2' as const;
export const MANIFEST_VERSION = 'teaching-duel-1.0.1' as const;

export type Seat = 'rebel' | 'imperial';
export type Bearing = 'straight' | 'bank-left' | 'bank-right' | 'turn-left' | 'turn-right' | 'koiogran' | 'tallon-left' | 'tallon-right';
export type Difficulty = 'blue' | 'white' | 'red';
export type Action = 'focus' | 'evade' | 'lock' | 'barrel-roll';

export interface Maneuver { id: string; speed: 1 | 2 | 3 | 4 | 5; bearing: Bearing; difficulty: Difficulty }
export interface ShipManifest {
  id: string; seat: Seat; name: string; chassis: 't65-x-wing' | 'tie-ln-fighter'; initiative: number;
  attack: number; agility: number; hull: number; shields: number; force?: number; actions: Action[]; dial: Maneuver[]; asset: string;
}

const maneuver = (speed: Maneuver['speed'], bearing: Bearing, difficulty: Difficulty): Maneuver => ({ id: `${speed}-${bearing}`, speed, bearing, difficulty });
const xWingDial: Maneuver[] = [
  maneuver(1, 'straight', 'blue'), maneuver(1, 'bank-left', 'blue'), maneuver(1, 'bank-right', 'blue'),
  maneuver(2, 'straight', 'blue'), maneuver(2, 'bank-left', 'blue'), maneuver(2, 'bank-right', 'blue'),
  maneuver(2, 'turn-left', 'white'), maneuver(2, 'turn-right', 'white'), maneuver(3, 'straight', 'white'),
  maneuver(3, 'bank-left', 'white'), maneuver(3, 'bank-right', 'white'), maneuver(3, 'turn-left', 'white'),
  maneuver(3, 'turn-right', 'white'), maneuver(3, 'tallon-left', 'red'), maneuver(3, 'tallon-right', 'red'),
  maneuver(4, 'straight', 'white'), maneuver(4, 'koiogran', 'red')
];
const tieDial: Maneuver[] = [
  maneuver(1, 'turn-left', 'white'), maneuver(1, 'turn-right', 'white'), maneuver(2, 'straight', 'blue'),
  maneuver(2, 'bank-left', 'blue'), maneuver(2, 'bank-right', 'blue'), maneuver(2, 'turn-left', 'white'),
  maneuver(2, 'turn-right', 'white'), maneuver(3, 'straight', 'blue'), maneuver(3, 'bank-left', 'white'),
  maneuver(3, 'bank-right', 'white'), maneuver(3, 'turn-left', 'white'), maneuver(3, 'turn-right', 'white'),
  maneuver(3, 'koiogran', 'red'), maneuver(4, 'straight', 'white'), maneuver(4, 'koiogran', 'red'), maneuver(5, 'straight', 'white')
];

export const ships: ShipManifest[] = [
  { id: 'red-five', seat: 'rebel', name: 'Red Five', chassis: 't65-x-wing', initiative: 5, attack: 3, agility: 2, hull: 4, shields: 2, force: 2, actions: ['focus', 'lock', 'barrel-roll'], dial: xWingDial, asset: 'ships/t65-x-wing.webp' },
  { id: 'onyx-one', seat: 'imperial', name: 'Onyx One', chassis: 'tie-ln-fighter', initiative: 1, attack: 2, agility: 3, hull: 3, shields: 0, actions: ['focus', 'evade', 'barrel-roll'], dial: tieDial, asset: 'ships/tie-ln-fighter.webp' },
  { id: 'onyx-two', seat: 'imperial', name: 'Onyx Two', chassis: 'tie-ln-fighter', initiative: 1, attack: 2, agility: 3, hull: 3, shields: 0, actions: ['focus', 'evade', 'barrel-roll'], dial: tieDial, asset: 'ships/tie-ln-fighter.webp' }
];

export const teachingDuel = {
  id: 'core-teaching-duel', sourceRuleset: RULESET_ID, manifestVersion: MANIFEST_VERSION,
  provenance: [
    'FFG Rules Reference 1.3.2',
    'FFG Second Edition Core Rulebook',
    'xwingtmg/xwing-data2 dial and chassis audit 2026-08-20'
  ],
  reviewStatus: 'reviewed-for-fixed-slice',
  playArea: { width: 91_440, height: 91_440 }, baseSize: 4_000, rangeUnit: 10_000,
  obstacleAssets: ['obstacles/asteroid-01.png', 'obstacles/asteroid-02.png', 'obstacles/asteroid-03.png', 'obstacles/debris-cloud-01.png', 'obstacles/debris-cloud-02.png', 'obstacles/debris-cloud-03.png'], ships
} as const;
export const shipById = (id: string) => ships.find((ship) => ship.id === id);
