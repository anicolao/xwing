import { nextRandom } from '$lib/game/prng';
import { MANIFEST_VERSION, RULESET_ID } from './teaching-duel';

export type DamageType = 'pilot' | 'ship';
export interface DamageCardDefinition {
  id: string;
  title: string;
  type: DamageType;
  count: number;
}

export const damageCards: DamageCardDefinition[] = [
  { id: 'blinded-pilot', title: 'Blinded Pilot', type: 'pilot', count: 2 },
  { id: 'panicked-pilot', title: 'Panicked Pilot', type: 'pilot', count: 2 },
  { id: 'wounded-pilot', title: 'Wounded Pilot', type: 'pilot', count: 2 },
  { id: 'stunned-pilot', title: 'Stunned Pilot', type: 'pilot', count: 2 },
  { id: 'console-fire', title: 'Console Fire', type: 'ship', count: 2 },
  { id: 'damaged-engine', title: 'Damaged Engine', type: 'ship', count: 2 },
  { id: 'weapons-failure', title: 'Weapons Failure', type: 'ship', count: 2 },
  { id: 'hull-breach', title: 'Hull Breach', type: 'ship', count: 2 },
  { id: 'structural-damage', title: 'Structural Damage', type: 'ship', count: 2 },
  { id: 'damaged-sensor-array', title: 'Damaged Sensor Array', type: 'ship', count: 2 },
  { id: 'loose-stabilizer', title: 'Loose Stabilizer', type: 'ship', count: 2 },
  { id: 'disabled-power-regulator', title: 'Disabled Power Regulator', type: 'ship', count: 2 },
  { id: 'fuel-leak', title: 'Fuel Leak', type: 'ship', count: 4 },
  { id: 'direct-hit', title: 'Direct Hit!', type: 'ship', count: 5 }
];

export const damageDeckManifest = {
  id: 'standard-damage-deck',
  sourceRuleset: RULESET_ID,
  manifestVersion: MANIFEST_VERSION,
  provenance: ['FFG Second Edition Core Set standard damage deck'],
  reviewStatus: 'composition-reviewed',
  cards: damageCards
} as const;

export function createDamageDeck(seed: number): string[] {
  const deck = damageCards.flatMap((card) => Array.from({ length: card.count }, (_, copy) => `${card.id}-${copy + 1}`));
  let currentSeed = seed;
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const random = nextRandom(currentSeed);
    currentSeed = random.seed;
    const target = Math.floor(random.value * (index + 1));
    [deck[index], deck[target]] = [deck[target]!, deck[index]!];
  }
  return deck;
}

export const damageDefinition = (instanceId: string) =>
  damageCards.find((card) => instanceId.startsWith(`${card.id}-`));
