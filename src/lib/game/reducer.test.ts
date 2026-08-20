import { describe, expect, it } from 'vitest';
import {
  baseIntersectsCircle,
  basePolygon,
  containsPose,
  executeManeuver,
  isInFrontArc,
  overlaps,
  rangeBetween,
  rollbackOverlap,
  segmentIntersectsCircle
} from '$lib/geometry';
import { shipById } from '$lib/manifests/teaching-duel';
import { applyEvent, createInitialState, GAME_CONFIG, replay } from './reducer';
import type { GameEvent } from './model';
import { createDamageDeck, damageCards } from '$lib/manifests/damage-deck';

describe('fixed-point geometry', () => {
  it('locks the reviewed T-65 and TIE/ln dial entries', () => {
    expect(shipById('red-five')!.dial.map(({ id, difficulty }) => `${id}:${difficulty}`)).toEqual([
      '1-straight:blue',
      '1-bank-left:blue',
      '1-bank-right:blue',
      '2-straight:blue',
      '2-bank-left:blue',
      '2-bank-right:blue',
      '2-turn-left:white',
      '2-turn-right:white',
      '3-straight:white',
      '3-bank-left:white',
      '3-bank-right:white',
      '3-turn-left:white',
      '3-turn-right:white',
      '3-tallon-left:red',
      '3-tallon-right:red',
      '4-straight:white',
      '4-koiogran:red'
    ]);
    expect(shipById('onyx-one')!.dial.map(({ id, difficulty }) => `${id}:${difficulty}`)).toEqual([
      '1-turn-left:white',
      '1-turn-right:white',
      '2-straight:blue',
      '2-bank-left:blue',
      '2-bank-right:blue',
      '2-turn-left:white',
      '2-turn-right:white',
      '3-straight:blue',
      '3-bank-left:white',
      '3-bank-right:white',
      '3-turn-left:white',
      '3-turn-right:white',
      '3-koiogran:red',
      '4-straight:white',
      '4-koiogran:red',
      '5-straight:white'
    ]);
  });

  it('moves and rotates a Koiogran maneuver deterministically', () => {
    const maneuver = shipById('red-five')!.dial.find((item) => item.id === '4-koiogran')!;
    expect(executeManeuver({ x: 40_000, y: 80_000, angle: 0 }, maneuver)).toEqual({
      x: 40_000,
      y: 60_000,
      angle: 180_000
    });
  });
  it('uses base edges for range and canonical facing for arc', () => {
    const attacker = { x: 20_000, y: 50_000, angle: 0 };
    expect(rangeBetween(attacker, { x: 20_000, y: 64_000, angle: 0 })).toBe(1);
    expect(isInFrontArc(attacker, { x: 20_000, y: 30_000, angle: 0 })).toBe(true);
    expect(isInFrontArc(attacker, { x: 40_000, y: 50_000, angle: 0 })).toBe(false);
  });
  it('classifies exact range boundaries from rotated base edges', () => {
    const origin = { x: 20_000, y: 50_000, angle: 45_000 };
    expect(rangeBetween(origin, { x: 20_000, y: 50_000, angle: 0 })).toBe(0);
    expect(rangeBetween({ x: 20_000, y: 50_000, angle: 0 }, { x: 20_000, y: 64_000, angle: 0 })).toBe(1);
    expect(rangeBetween({ x: 20_000, y: 50_000, angle: 0 }, { x: 20_000, y: 74_000, angle: 0 })).toBe(2);
    expect(rangeBetween({ x: 20_000, y: 50_000, angle: 0 }, { x: 20_000, y: 84_000, angle: 0 })).toBe(3);
    expect(rangeBetween({ x: 20_000, y: 50_000, angle: 0 }, { x: 20_000, y: 84_001, angle: 0 })).toBe(4);
  });
  it('treats touching bases as range zero without treating them as overlapping', () => {
    const first = { x: 20_000, y: 20_000, angle: 0 };
    const touching = { x: 24_000, y: 20_000, angle: 0 };
    expect(rangeBetween(first, touching)).toBe(0);
    expect(overlaps(first, touching)).toBe(false);
    expect(overlaps(first, { ...touching, x: 23_999 })).toBe(true);
    expect(overlaps(first, { x: 24_800, y: 20_000, angle: 45_000 })).toBe(true);
  });
  it('checks rotated base corners against obstacles and the play-area boundary', () => {
    const rotated = { x: 2_828, y: 2_828, angle: 45_000 };
    expect(basePolygon(rotated)).toHaveLength(4);
    expect(containsPose(rotated)).toBe(true);
    expect(containsPose({ ...rotated, x: 2_827 })).toBe(false);
    expect(baseIntersectsCircle({ x: 10_000, y: 10_000, angle: 0 }, { x: 13_000, y: 10_000 }, 1_000)).toBe(true);
    expect(baseIntersectsCircle({ x: 10_000, y: 10_000, angle: 0 }, { x: 13_001, y: 10_000 }, 1_000)).toBe(false);
  });
  it('backs up to the furthest non-overlapping pose and measures obstruction semantically', () => {
    const stopped = rollbackOverlap({ x: 10_000, y: 30_000, angle: 0 }, { x: 10_000, y: 10_000, angle: 0 }, [
      { x: 10_000, y: 14_000, angle: 0 }
    ]);
    expect(stopped.y).toBeGreaterThanOrEqual(18_000);
    expect(stopped.y).toBeLessThan(18_050);
    expect(segmentIntersectsCircle({ x: 0, y: 0 }, { x: 20_000, y: 0 }, { x: 10_000, y: 2_000 }, 2_100)).toBe(true);
    expect(segmentIntersectsCircle({ x: 0, y: 0 }, { x: 20_000, y: 0 }, { x: 10_000, y: 3_000 }, 2_100)).toBe(false);
  });
});

describe('event reducer', () => {
  const event = <T extends GameEvent>(value: T) => value;
  it('accepts an own-seat private maneuver assignment', () => {
    const state = createInitialState('duel');
    state.phase = 'planning';
    state.revision = 4;
    state.seats.rebel.joined = true;
    const result = applyEvent(
      state,
      event({
        id: 'e5',
        type: 'planning/assigned',
        actor: 'rebel',
        sequence: 5,
        payload: { shipId: 'red-five', maneuverId: '2-straight' }
      })
    );
    expect(result.diagnostic).toBeUndefined();
    expect(result.state.ships['red-five']?.maneuver?.id).toBe('2-straight');
    expect(result.state.ships['red-five']?.revealed).toBe(false);
  });
  it('rejects stale events without partially mutating state', () => {
    const state = createInitialState('duel');
    const result = applyEvent(
      state,
      event({
        id: 'stale',
        type: 'game/created',
        actor: 'table',
        sequence: 2,
        payload: { gameId: 'bad', seed: 1, config: GAME_CONFIG }
      })
    );
    expect(result.state).toBe(state);
    expect(result.diagnostic?.message).toContain('sequence');
  });
  it('replays the same immutable prefix to the same state', () => {
    const events: GameEvent[] = [
      event({
        id: 'e1',
        type: 'game/created',
        actor: 'table',
        sequence: 1,
        payload: { gameId: 'alpha', seed: 42, config: GAME_CONFIG }
      }),
      event({ id: 'e2', type: 'player/joined', actor: 'rebel', sequence: 2, payload: { seat: 'rebel' } }),
      event({ id: 'e3', type: 'player/joined', actor: 'imperial', sequence: 3, payload: { seat: 'imperial' } })
    ];
    expect(replay(events)).toEqual(replay(structuredClone(events)));
  });
  it('stops replay when a committed engine version is unavailable', () => {
    const incompatible = event({
      id: 'e1',
      type: 'game/created',
      actor: 'table',
      sequence: 1,
      payload: { gameId: 'future', seed: 42, config: { ...GAME_CONFIG, reducer: 'future-reducer' } }
    });
    const result = replay([incompatible]);
    expect(result.state.revision).toBe(0);
    expect(result.diagnostics[0]?.message).toContain('unsupported');
  });
  it('finishes immediately when a squad publicly concedes', () => {
    const state = createInitialState('duel');
    state.phase = 'engagement';
    state.revision = 12;
    state.pending = 'target';
    const result = applyEvent(
      state,
      event({ id: 'e13', type: 'game/conceded', actor: 'table', sequence: 13, payload: { seat: 'imperial' } })
    );
    expect(result.diagnostic).toBeUndefined();
    expect(result.state.phase).toBe('finished');
    expect(result.state.winner).toBe('rebel');
    expect(result.state.pending).toBeNull();
  });
  it('accepts fixed setup pieces only in the reviewed alternating order', () => {
    const state = createInitialState('duel');
    state.phase = 'setup';
    state.revision = 4;
    const wrong = applyEvent(
      state,
      event({ id: 'e5-wrong', type: 'setup/placed', actor: 'table', sequence: 5, payload: { pieceId: 'asteroid-02' } })
    );
    expect(wrong.diagnostic?.message).toContain('highlighted');
    const first = applyEvent(
      state,
      event({ id: 'e5', type: 'setup/placed', actor: 'table', sequence: 5, payload: { pieceId: 'asteroid-01' } })
    );
    expect(first.diagnostic).toBeUndefined();
    expect(first.state.setupPlaced).toEqual(['asteroid-01']);
    expect(first.state.phase).toBe('setup');
  });
  it('serializes attacker and defender dice modification windows', () => {
    const state = createInitialState('duel');
    state.phase = 'engagement';
    state.revision = 20;
    state.pending = 'attacker-modify';
    state.activeShipId = 'red-five';
    state.ships['red-five']!.focus = 1;
    state.ships['onyx-one']!.evade = 1;
    state.attack = {
      attackerId: 'red-five',
      defenderId: 'onyx-one',
      range: 2,
      obstructed: false,
      attack: ['focus', 'blank'],
      defense: ['blank']
    };
    const attack = applyEvent(
      state,
      event({
        id: 'e21',
        type: 'engagement/attack-modified',
        actor: 'table',
        sequence: 21,
        payload: { choice: 'focus' }
      })
    );
    expect(attack.state.attack?.attack).toEqual(['hit', 'blank']);
    expect(attack.state.pending).toBe('defender-modify');
    expect(attack.state.ships['red-five']?.focus).toBe(0);
    const defense = applyEvent(
      attack.state,
      event({
        id: 'e22',
        type: 'engagement/defense-modified',
        actor: 'table',
        sequence: 22,
        payload: { choice: 'evade' }
      })
    );
    expect(defense.state.attack?.defense).toEqual(['blank', 'evade']);
    expect(defense.state.pending).toBe('damage');
    expect(defense.state.ships['onyx-one']?.evade).toBe(0);
  });
  it('repairs enabled faceup ship damage as the active ship action', () => {
    const state = createInitialState('duel');
    state.phase = 'activation';
    state.pending = 'action';
    state.activeShipId = 'red-five';
    state.revision = 8;
    state.ships['red-five']!.damage.push({ id: 'weapons-failure-1', faceup: true, title: 'Weapons Failure' });
    const result = applyEvent(
      state,
      event({
        id: 'e9',
        type: 'damage/repaired',
        actor: 'table',
        sequence: 9,
        payload: { shipId: 'red-five', cardId: 'weapons-failure-1' }
      })
    );
    expect(result.diagnostic).toBeUndefined();
    expect(result.state.ships['red-five']!.damage[0]).toEqual({
      id: 'weapons-failure-1',
      faceup: false,
      title: 'Facedown damage'
    });
    expect(result.state.ships['red-five']!.activated).toBe(true);
  });
  it('requires direct target-lock and barrel-roll choices', () => {
    const state = createInitialState('duel');
    state.phase = 'activation';
    state.pending = 'action';
    state.activeShipId = 'red-five';
    state.revision = 10;
    const noLockTarget = applyEvent(
      state,
      event({
        id: 'e11',
        type: 'activation/action',
        actor: 'table',
        sequence: 11,
        payload: { shipId: 'red-five', action: 'lock' }
      })
    );
    expect(noLockTarget.diagnostic?.message).toContain('Touch an enemy');
    const rolled = applyEvent(
      state,
      event({
        id: 'e11-roll',
        type: 'activation/action',
        actor: 'table',
        sequence: 11,
        payload: { shipId: 'red-five', action: 'barrel-roll', direction: 'right' }
      })
    );
    expect(rolled.diagnostic).toBeUndefined();
    expect(rolled.state.ships['red-five']!.pose.x).toBe(state.ships['red-five']!.pose.x + 4_000);
  });
});

describe('standard damage deck', () => {
  it('contains 33 stable instances with the reviewed 8/25 type split', () => {
    expect(damageCards.reduce((sum, card) => sum + card.count, 0)).toBe(33);
    expect(damageCards.filter((card) => card.type === 'pilot').reduce((sum, card) => sum + card.count, 0)).toBe(8);
    expect(new Set(createDamageDeck(42)).size).toBe(33);
  });
  it('shuffles deterministically by committed seed', () => {
    expect(createDamageDeck(42)).toEqual(createDamageDeck(42));
    expect(createDamageDeck(42)).not.toEqual(createDamageDeck(43));
  });
});
