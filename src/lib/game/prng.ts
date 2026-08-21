export function nextRandom(seed: number): { seed: number; value: number } {
  let state = seed >>> 0;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  const next = state >>> 0;
  return { seed: next, value: next / 0x1_0000_0000 };
}
export type AttackFace = 'hit' | 'critical' | 'focus' | 'blank';
export type DefenseFace = 'evade' | 'focus' | 'blank';
const attackFaces: AttackFace[] = ['hit', 'hit', 'hit', 'critical', 'focus', 'focus', 'blank', 'blank'];
const defenseFaces: DefenseFace[] = ['evade', 'evade', 'evade', 'focus', 'focus', 'blank', 'blank', 'blank'];
export function rollDice<T>(seed: number, count: number, faces: readonly T[]): { seed: number; results: T[] } {
  const results: T[] = [];
  let currentSeed = seed;
  for (let index = 0; index < count; index += 1) {
    const random = nextRandom(currentSeed);
    currentSeed = random.seed;
    results.push(faces[Math.floor(random.value * faces.length)]!);
  }
  return { seed: currentSeed, results };
}
export const rollAttack = (seed: number, count: number) => rollDice(seed, count, attackFaces);
export const rollDefense = (seed: number, count: number) => rollDice(seed, count, defenseFaces);
