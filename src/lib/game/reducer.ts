import { containsPose, executeManeuver, isInFrontArc, overlaps, rangeBetween } from '$lib/geometry';
import { shipById, ships, type Seat } from '$lib/manifests/teaching-duel';
import type { Diagnostic, GameEvent, GameState, ShipState } from './model';
import { rollAttack, rollDefense } from './prng';

const initialShip = (id: string): ShipState => {
  const manifest = shipById(id)!;
  const pose = id === 'red-five' ? { x: 45_720, y: 80_000, angle: 0 } : id === 'onyx-one' ? { x: 36_000, y: 11_440, angle: 180_000 } : { x: 55_440, y: 11_440, angle: 180_000 };
  return { id, seat: manifest.seat, pose, hull: manifest.hull, shields: manifest.shields, stress: 0, focus: 0, evade: 0, damage: [], revealed: false, activated: false, engaged: false, destroyed: false };
};

export const createInitialState = (gameId = 'uncreated', seed = 0x5857494e): GameState => ({
  gameId, revision: 0, phase: 'lobby', round: 0, seed,
  seats: { rebel: { joined: false, ready: false, committed: false }, imperial: { joined: false, ready: false, committed: false } },
  ships: Object.fromEntries(ships.map((ship) => [ship.id, initialShip(ship.id)])), pending: null, log: []
});

const activationOrder = (state: GameState) => ships.filter((ship) => !state.ships[ship.id]!.activated && !state.ships[ship.id]!.destroyed).sort((a, b) => a.initiative - b.initiative || a.id.localeCompare(b.id));
const engagementOrder = (state: GameState) => ships.filter((ship) => !state.ships[ship.id]!.engaged && !state.ships[ship.id]!.destroyed).sort((a, b) => b.initiative - a.initiative || a.id.localeCompare(b.id));
const nextActivation = (state: GameState) => {
  const next = activationOrder(state)[0];
  if (next) { state.activeShipId = next.id; state.pending = 'reveal'; }
  else { state.phase = 'engagement'; state.activeShipId = engagementOrder(state)[0]?.id; state.pending = state.activeShipId ? 'target' : 'end'; }
};

function resolveDamage(state: GameState) {
  if (!state.attack) return;
  const defender = state.ships[state.attack.defenderId]!;
  const hits = state.attack.attack.filter((face) => face === 'hit' || face === 'critical').length;
  const evades = state.attack.defense.filter((face) => face === 'evade').length + Math.min(defender.evade, 1);
  let remaining = Math.max(0, hits - evades);
  if (defender.evade && hits) defender.evade -= 1;
  const shieldLoss = Math.min(defender.shields, remaining);
  defender.shields -= shieldLoss; remaining -= shieldLoss;
  for (let index = 0; index < remaining; index += 1) {
    const faceup = state.attack.attack.includes('critical') && index === remaining - 1;
    defender.hull -= 1;
    defender.damage.push({ id: `damage-${state.round}-${defender.id}-${defender.damage.length + 1}`, faceup, title: faceup ? 'Direct Hit' : 'Hull damage' });
  }
  defender.destroyed = defender.hull <= 0;
}

export function applyEvent(source: GameState, event: GameEvent): { state: GameState; diagnostic?: Diagnostic } {
  if (event.sequence !== source.revision + 1) return { state: source, diagnostic: { eventId: event.id, message: 'Event sequence is stale or out of order.' } };
  const state = structuredClone(source);
  const reject = (message: string) => ({ state: source, diagnostic: { eventId: event.id, message } });
  switch (event.type) {
    case 'game/created':
      if (state.phase !== 'lobby' || state.revision !== 0) return reject('A game already exists.');
      state.gameId = event.payload.gameId; state.seed = event.payload.seed; state.log.push('Table opened the teaching duel.'); break;
    case 'player/joined':
      if (event.actor !== event.payload.seat || state.seats[event.payload.seat].joined) return reject('Seat claim is not authorized.');
      state.seats[event.payload.seat].joined = true; state.log.push(`${event.payload.seat === 'rebel' ? 'Rebel' : 'Imperial'} phone paired.`); break;
    case 'player/ready':
      if (event.actor !== 'table' || !state.seats[event.payload.seat].joined) return reject('Only the table can ready a paired seat.');
      state.seats[event.payload.seat].ready = true;
      if (state.seats.rebel.ready && state.seats.imperial.ready) { state.phase = 'setup'; state.pending = 'setup'; }
      break;
    case 'setup/completed':
      if (event.actor !== 'table' || state.phase !== 'setup') return reject('Setup is not waiting on the table.');
      state.phase = 'planning'; state.round = 1; state.pending = null; state.log.push('All ships entered the play area. Planning began.'); break;
    case 'planning/assigned': {
      const ship = state.ships[event.payload.shipId]; const selected = shipById(event.payload.shipId)?.dial.find((item) => item.id === event.payload.maneuverId);
      if (state.phase !== 'planning' || !ship || event.actor !== ship.seat || state.seats[ship.seat].committed || !selected) return reject('That private maneuver cannot be assigned now.');
      ship.maneuver = selected; break;
    }
    case 'planning/committed': {
      const owned = Object.values(state.ships).filter((ship) => ship.seat === event.payload.seat && !ship.destroyed);
      if (state.phase !== 'planning' || event.actor !== event.payload.seat || owned.some((ship) => !ship.maneuver)) return reject('Every active ship needs a dial before commitment.');
      state.seats[event.payload.seat].committed = true;
      if (state.seats.rebel.committed && state.seats.imperial.committed) { state.phase = 'activation'; nextActivation(state); state.log.push('Both squadrons committed. Activation began.'); }
      break;
    }
    case 'activation/revealed': {
      const ship = state.ships[event.payload.shipId];
      if (event.actor !== 'table' || state.phase !== 'activation' || event.payload.shipId !== state.activeShipId || !ship?.maneuver) return reject('This is not the active ship.');
      const destination = executeManeuver(ship.pose, ship.maneuver);
      const collision = Object.values(state.ships).some((other) => other.id !== ship.id && !other.destroyed && overlaps(destination, other.pose));
      ship.revealed = true; if (!collision && containsPose(destination)) ship.pose = destination;
      if (ship.maneuver.difficulty === 'red') ship.stress += 1;
      if (ship.maneuver.difficulty === 'blue' && ship.stress) ship.stress -= 1;
      state.pending = 'action'; state.log.push(`${shipById(ship.id)!.name} revealed ${ship.maneuver.speed} ${ship.maneuver.bearing}${collision ? ' and stopped before an overlap' : ''}.`); break;
    }
    case 'activation/action': {
      const ship = state.ships[event.payload.shipId]; const manifest = shipById(event.payload.shipId);
      if (event.actor !== 'table' || state.phase !== 'activation' || state.pending !== 'action' || ship?.id !== state.activeShipId) return reject('This ship cannot act now.');
      if (event.payload.action !== 'pass' && (!manifest?.actions.includes(event.payload.action) || ship.stress > 0)) return reject('That action is not legal.');
      if (event.payload.action === 'focus') ship.focus += 1;
      if (event.payload.action === 'evade') ship.evade += 1;
      if (event.payload.action === 'lock' && event.payload.targetId) ship.lock = event.payload.targetId;
      if (event.payload.action === 'barrel-roll') ship.pose.x += ship.pose.x < 45_720 ? 4_000 : -4_000;
      ship.activated = true; nextActivation(state); break;
    }
    case 'engagement/targeted': {
      const attacker = state.ships[event.payload.attackerId]; const defender = state.ships[event.payload.defenderId]; const range = attacker && defender ? rangeBetween(attacker.pose, defender.pose) : 4;
      if (event.actor !== 'table' || state.phase !== 'engagement' || attacker?.id !== state.activeShipId || !defender || attacker.seat === defender.seat || range < 1 || range > 3 || !isInFrontArc(attacker.pose, defender.pose)) return reject('Target must be an enemy in the front arc at range 1–3.');
      state.attack = { attackerId: attacker.id, defenderId: defender.id, attack: [], defense: [] }; state.pending = 'attack'; break;
    }
    case 'engagement/passed': {
      const attacker = state.ships[event.payload.attackerId];
      if (event.actor !== 'table' || state.phase !== 'engagement' || state.pending !== 'target' || attacker?.id !== state.activeShipId) return reject('This ship cannot pass now.');
      attacker.engaged = true;
      const next = engagementOrder(state)[0]; state.activeShipId = next?.id; state.pending = next ? 'target' : 'end'; break;
    }
    case 'engagement/rolled': {
      if (event.actor !== 'table' || state.phase !== 'engagement' || state.pending !== 'attack' || !state.attack) return reject('No attack is ready to roll.');
      const attackRoll = rollAttack(state.seed, shipById(state.attack.attackerId)!.attack); const defenseRoll = rollDefense(attackRoll.seed, shipById(state.attack.defenderId)!.agility);
      state.seed = defenseRoll.seed; state.attack.attack = attackRoll.results; state.attack.defense = defenseRoll.results; state.pending = 'damage'; break;
    }
    case 'engagement/resolved': {
      if (event.actor !== 'table' || state.phase !== 'engagement' || state.pending !== 'damage' || !state.attack) return reject('No rolled attack is ready to resolve.');
      resolveDamage(state); state.ships[state.attack.attackerId]!.engaged = true; state.attack = undefined;
      const next = engagementOrder(state)[0]; state.activeShipId = next?.id; state.pending = next ? 'target' : 'end'; break;
    }
    case 'round/ended': {
      if (event.actor !== 'table' || state.phase !== 'engagement' || state.pending !== 'end') return reject('The round cannot end now.');
      const alive = (seat: Seat) => Object.values(state.ships).some((ship) => ship.seat === seat && !ship.destroyed && containsPose(ship.pose));
      const rebel = alive('rebel'); const imperial = alive('imperial');
      if (!rebel || !imperial) { state.phase = 'finished'; state.winner = rebel === imperial ? 'draw' : rebel ? 'rebel' : 'imperial'; state.pending = null; }
      else {
        state.round += 1; state.phase = 'planning'; state.pending = null; state.seats.rebel.committed = false; state.seats.imperial.committed = false;
        for (const ship of Object.values(state.ships)) { ship.maneuver = undefined; ship.revealed = false; ship.activated = false; ship.engaged = false; ship.focus = 0; ship.evade = 0; }
      }
      break;
    }
    case 'game/rematched': return { state: { ...createInitialState(state.gameId, event.payload.seed), revision: event.sequence, log: ['Rematch opened.'] } };
  }
  state.revision = event.sequence; return { state };
}

export function replay(events: readonly GameEvent[]): { state: GameState; diagnostics: Diagnostic[] } {
  let state = createInitialState(); const diagnostics: Diagnostic[] = [];
  for (const event of events) { const result = applyEvent(state, event); state = result.state; if (result.diagnostic) diagnostics.push(result.diagnostic); }
  return { state, diagnostics };
}
