<script lang="ts">
  import { assets } from '$app/paths';
  import { shipById } from '$lib/manifests/teaching-duel';
  import type { ShipState } from '$lib/game/model';
  let { ship, active = false, selectable = false, onclick }: { ship: ShipState; active?: boolean; selectable?: boolean; onclick?: () => void } = $props();
  const manifest = $derived(shipById(ship.id)!);
</script>

<button
  class:active class:destroyed={ship.destroyed} class:selectable
  style={`--x:${ship.pose.x / 914.4}%;--y:${ship.pose.y / 914.4}%;--angle:${ship.pose.angle / 1000}deg`}
  aria-label={`${manifest.name}, ${ship.hull} hull, ${ship.shields} shields${active ? ', active' : ''}`}
  disabled={!selectable}
  onclick={selectable ? onclick : undefined}
  data-ship={ship.id}
>
  <span class="base"><img src={`${assets}/assets/bases/small-base.png`} alt="" /></span>
  <img class="craft" src={`${assets}/assets/${manifest.asset}`} alt="" />
  <span class="label">{manifest.name}</span>
  <span class="vitals" aria-hidden="true">◆{ship.hull} ◇{ship.shields}</span>
  {#if ship.focus}<img class="token focus" src={`${assets}/assets/icons/token-force.png`} alt="Focus" />{/if}
  {#if ship.evade}<img class="token evade" src={`${assets}/assets/icons/action-evade.png`} alt="Evade" />{/if}
  {#if ship.stress}<img class="token stress" src={`${assets}/assets/icons/token-stress.png`} alt="Stress" />{/if}
  {#if ship.force}<span class="force" aria-label={`${ship.force} Force charges`}>{ship.force}</span>{/if}
  {#if ship.damage.length}<span class="damage" aria-label={`${ship.damage.length} damage cards`}><img src={`${assets}/assets/damage-card-back.webp`} alt="" /><b>{ship.damage.length}</b></span>{/if}
</button>

<style>
  button { position:absolute; z-index:3; left:var(--x); top:var(--y); width:7.5%; min-width:52px; aspect-ratio:1; padding:0; border:0; background:transparent; transform:translate(-50%,-50%) rotate(var(--angle)); color:#fff; transition:left .7s cubic-bezier(.2,.7,.2,1),top .7s cubic-bezier(.2,.7,.2,1),transform .7s ease; }
  button:disabled { opacity:1; }
  button.selectable { cursor:pointer; }
  button.active::before, button.selectable::before { position:absolute; inset:-12%; border:3px solid #f4b64e; border-radius:50%; box-shadow:0 0 24px #f4b64e88; content:''; animation:pulse 1.6s ease-in-out infinite; }
  .base { position:absolute; inset:10%; transform:rotate(calc(-1 * var(--angle))); }
  .base img { width:100%; height:100%; object-fit:contain; opacity:.88; }
  .craft { position:absolute; inset:6%; width:88%; height:88%; object-fit:contain; filter:drop-shadow(0 8px 8px #000); }
  .label, .vitals { position:absolute; left:50%; min-width:max-content; transform:translateX(-50%) rotate(calc(-1 * var(--angle))); padding:1px 5px; border-radius:3px; background:#07111fdd; font-size:clamp(9px,.62vw,18px); }
  .label { top:90%; font-weight:700; } .vitals { top:111%; color:#dce8ed; }
  .token { position:absolute; width:36%; height:36%; object-fit:contain; filter:drop-shadow(0 2px 3px #000); transform:rotate(calc(-1 * var(--angle))); }
  .focus { right:-16%; top:2%; } .evade { right:-16%; top:36%; } .stress { left:-16%; top:2%; }
  .damage { position:absolute; right:-14%; bottom:-12%; display:grid; place-items:center; width:32%; aspect-ratio:.7; border:1px solid #e47562; border-radius:2px; overflow:hidden; color:white; transform:rotate(calc(-1 * var(--angle))); } .damage img { position:absolute; width:100%; height:100%; object-fit:cover; } .damage b { position:relative; display:grid; place-items:center; width:68%; aspect-ratio:1; border-radius:50%; background:#07111fdd; }
  .force { position:absolute; left:-16%; bottom:-12%; display:grid; place-items:center; width:30%; aspect-ratio:1; border:2px solid #a78bea; border-radius:50%; background:#30265b; color:white; font-weight:700; transform:rotate(calc(-1 * var(--angle))); }
  .destroyed { opacity:.3; filter:grayscale(1); }
  @keyframes pulse { 50% { transform:scale(1.08); opacity:.65; } }
  @media (prefers-reduced-motion: reduce) { button.active::before, button.selectable::before { animation:none; } }
  @media (prefers-reduced-motion: reduce) { button { transition:none; } }
</style>
