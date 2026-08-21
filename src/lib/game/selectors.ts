import { shipById, type Seat } from '$lib/manifests/teaching-duel';
import type { GameState } from './model';
export const publicProjection = (state: GameState) => ({
  ...state,
  ships: Object.fromEntries(
    Object.entries(state.ships).map(([id, ship]) => [
      id,
      { ...ship, maneuver: ship.revealed ? ship.maneuver : undefined }
    ])
  )
});
export const handProjection = (state: GameState, seat: Seat) => ({
  gameId: state.gameId,
  phase: state.phase,
  round: state.round,
  seat,
  connected: state.seats[seat].joined,
  committed: state.seats[seat].committed,
  opponentCommitted: state.seats[seat === 'rebel' ? 'imperial' : 'rebel'].committed,
  ships: Object.values(state.ships)
    .filter((ship) => ship.seat === seat && !ship.destroyed)
    .map((ship) => ({ ...ship, name: shipById(ship.id)!.name }))
});
