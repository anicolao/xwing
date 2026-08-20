import type { Bearing, Maneuver } from '$lib/manifests/teaching-duel';
export interface Point { x: number; y: number }
export interface Pose extends Point { angle: number }
export const FULL_TURN = 360_000;
export const BASE_SIZE = 4_000;
export const RANGE_UNIT = 10_000;
export const normalizeAngle = (angle: number) => ((angle % FULL_TURN) + FULL_TURN) % FULL_TURN;
export function rotate(point: Point, angle: number): Point {
  const radians = (angle / FULL_TURN) * Math.PI * 2;
  return { x: Math.round(point.x * Math.cos(radians) - point.y * Math.sin(radians)), y: Math.round(point.x * Math.sin(radians) + point.y * Math.cos(radians)) };
}
const bearingTurn: Record<Bearing, number> = { straight: 0, 'bank-left': -45_000, 'bank-right': 45_000, 'turn-left': -90_000, 'turn-right': 90_000, koiogran: 180_000, 'tallon-left': -90_000, 'tallon-right': 90_000 };
export function executeManeuver(start: Pose, maneuver: Maneuver): Pose {
  const turn = bearingTurn[maneuver.bearing];
  const curved = maneuver.bearing.startsWith('bank') || maneuver.bearing.startsWith('turn') || maneuver.bearing.startsWith('tallon');
  const delta = rotate({ x: 0, y: -(maneuver.speed + 1) * BASE_SIZE }, start.angle + (curved ? turn / 2 : 0));
  return { x: start.x + delta.x, y: start.y + delta.y, angle: normalizeAngle(start.angle + turn) };
}
export const distance = (a: Point, b: Point) => Math.round(Math.hypot(a.x - b.x, a.y - b.y));
export function rangeBetween(a: Pose, b: Pose): 0 | 1 | 2 | 3 | 4 {
  const edgeDistance = Math.max(0, distance(a, b) - BASE_SIZE);
  if (edgeDistance === 0) return 0;
  if (edgeDistance <= RANGE_UNIT) return 1;
  if (edgeDistance <= RANGE_UNIT * 2) return 2;
  if (edgeDistance <= RANGE_UNIT * 3) return 3;
  return 4;
}
export function isInFrontArc(attacker: Pose, target: Pose): boolean {
  const facing = rotate({ x: 0, y: -1_000 }, attacker.angle);
  const vector = { x: target.x - attacker.x, y: target.y - attacker.y };
  const dot = facing.x * vector.x + facing.y * vector.y;
  return dot > 0 && Math.abs(facing.x * vector.y - facing.y * vector.x) <= dot;
}
export const overlaps = (a: Pose, b: Pose) => Math.abs(a.x - b.x) < BASE_SIZE && Math.abs(a.y - b.y) < BASE_SIZE;
export function rollbackOverlap(start: Pose, destination: Pose, occupied: readonly Pose[]): Pose {
  let low = 0; let high = 1_000;
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const progress = Math.floor((low + high) / 2);
    const candidate = {
      x: Math.round(start.x + (destination.x - start.x) * progress / 1_000),
      y: Math.round(start.y + (destination.y - start.y) * progress / 1_000),
      angle: normalizeAngle(Math.round(start.angle + (destination.angle - start.angle) * progress / 1_000))
    };
    if (occupied.some((pose) => overlaps(candidate, pose))) high = progress;
    else low = progress;
  }
  return { x: Math.round(start.x + (destination.x - start.x) * low / 1_000), y: Math.round(start.y + (destination.y - start.y) * low / 1_000), angle: normalizeAngle(Math.round(start.angle + (destination.angle - start.angle) * low / 1_000)) };
}

export function segmentIntersectsCircle(start: Point, end: Point, center: Point, radius: number): boolean {
  const dx = end.x - start.x; const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((center.x - start.x) * dx + (center.y - start.y) * dy) / lengthSquared));
  return distance(center, { x: start.x + projection * dx, y: start.y + projection * dy }) <= radius;
}
export function containsPose(pose: Pose, width = 91_440, height = 91_440): boolean {
  const half = BASE_SIZE / 2;
  return pose.x >= half && pose.y >= half && pose.x <= width - half && pose.y <= height - half;
}
