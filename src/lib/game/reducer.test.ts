import { describe, expect, it } from 'vitest';
import { executeManeuver, isInFrontArc, rangeBetween } from '$lib/geometry';
import { shipById } from '$lib/manifests/teaching-duel';
import { applyEvent, createInitialState, replay } from './reducer';
import type { GameEvent } from './model';

describe('fixed-point geometry', () => {
  it('locks the reviewed T-65 and TIE/ln dial entries', () => {
    expect(shipById('red-five')!.dial.map(({ id, difficulty }) => `${id}:${difficulty}`)).toEqual([
      '1-straight:blue', '1-bank-left:blue', '1-bank-right:blue',
      '2-straight:blue', '2-bank-left:blue', '2-bank-right:blue', '2-turn-left:white', '2-turn-right:white',
      '3-straight:white', '3-bank-left:white', '3-bank-right:white', '3-turn-left:white', '3-turn-right:white',
      '3-tallon-left:red', '3-tallon-right:red', '4-straight:white', '4-koiogran:red'
    ]);
    expect(shipById('onyx-one')!.dial.map(({ id, difficulty }) => `${id}:${difficulty}`)).toEqual([
      '1-turn-left:white', '1-turn-right:white', '2-straight:blue', '2-bank-left:blue', '2-bank-right:blue',
      '2-turn-left:white', '2-turn-right:white', '3-straight:blue', '3-bank-left:white', '3-bank-right:white',
      '3-turn-left:white', '3-turn-right:white', '3-koiogran:red', '4-straight:white', '4-koiogran:red', '5-straight:white'
    ]);
  });

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
