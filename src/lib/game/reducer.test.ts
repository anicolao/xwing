import { describe, expect, it } from 'vitest';
import { executeManeuver, isInFrontArc, rangeBetween } from '$lib/geometry';
import { shipById } from '$lib/manifests/teaching-duel';
import { applyEvent, createInitialState, replay } from './reducer';
import type { GameEvent } from './model';

describe('fixed-point geometry', () => {
  it('moves and rotates a Koiogran maneuver deterministically', () => {
    const maneuver = shipById('red-five')!.dial.find((item) => item.id === '4-koiogran')!;
    expect(executeManeuver({ x: 40_000, y: 80_000, angle: 0 }, maneuver)).toEqual({ x: 40_000, y: 60_000, angle: 180_000 });
  });
  it('uses base edges for range and canonical facing for arc', () => {
    const attacker = { x: 20_000, y: 50_000, angle: 0 };
    expect(rangeBetween(attacker, { x: 20_000, y: 64_000, angle: 0 })).toBe(1);
    expect(isInFrontArc(attacker, { x: 20_000, y: 30_000, angle: 0 })).toBe(true);
    expect(isInFrontArc(attacker, { x: 40_000, y: 50_000, angle: 0 })).toBe(false);
  });
});

describe('event reducer', () => {
  const event = <T extends GameEvent>(value: T) => value;
  it('accepts an own-seat private maneuver assignment', () => {
    const state = createInitialState('duel'); state.phase = 'planning'; state.revision = 4; state.seats.rebel.joined = true;
    const result = applyEvent(state, event({ id: 'e5', type: 'planning/assigned', actor: 'rebel', sequence: 5, payload: { shipId: 'red-five', maneuverId: '2-straight' } }));
    expect(result.diagnostic).toBeUndefined(); expect(result.state.ships['red-five']?.maneuver?.id).toBe('2-straight'); expect(result.state.ships['red-five']?.revealed).toBe(false);
  });
  it('rejects stale events without partially mutating state', () => {
    const state = createInitialState('duel'); const result = applyEvent(state, event({ id: 'stale', type: 'game/created', actor: 'table', sequence: 2, payload: { gameId: 'bad', seed: 1 } }));
    expect(result.state).toBe(state); expect(result.diagnostic?.message).toContain('sequence');
  });
  it('replays the same immutable prefix to the same state', () => {
    const events: GameEvent[] = [
      event({ id: 'e1', type: 'game/created', actor: 'table', sequence: 1, payload: { gameId: 'alpha', seed: 42 } }),
      event({ id: 'e2', type: 'player/joined', actor: 'rebel', sequence: 2, payload: { seat: 'rebel' } }),
      event({ id: 'e3', type: 'player/joined', actor: 'imperial', sequence: 3, payload: { seat: 'imperial' } })
    ];
    expect(replay(events)).toEqual(replay(structuredClone(events)));
  });
});
