<script lang="ts">
  import { assets } from '$app/paths';
  import type { GameState } from '$lib/game/model';
  import { shipById } from '$lib/manifests/teaching-duel';

  let {
    game,
    interactive,
    onroll,
    onattack,
    ondefense,
    onresolve
  }: {
    game: GameState;
    interactive: boolean;
    onroll: () => void;
    onattack: (choice: 'focus' | 'force' | 'pass') => void;
    ondefense: (choice: 'focus' | 'evade' | 'pass') => void;
    onresolve: () => void;
  } = $props();

  const attack = $derived(game.attack!);
</script>

<section class="combat-panel" class:read-only={!interactive} aria-label="Attack dice tray" aria-hidden={!interactive}>
  <p>
    {shipById(attack.attackerId)?.name} → {shipById(attack.defenderId)?.name} · RANGE {attack.range}{attack.obstructed
      ? ' · OBSTRUCTED'
      : ''}
  </p>
  {#if game.pending !== 'attack'}
    <div class="dice">
      {#each attack.attack as face}<img
          src={`${assets}/assets/icons/die-${face}.png`}
          alt={`Attack die ${face}`}
        />{/each}
      <i></i>
      {#each attack.defense as face}<img
          src={`${assets}/assets/icons/die-${face}.png`}
          alt={`Defense die ${face}`}
        />{/each}
    </div>
  {/if}
  {#if interactive}
    {#if game.pending === 'attack'}
      <button class="primary" onclick={onroll}>Roll attack and defense</button>
    {:else if game.pending === 'attacker-modify'}
      <nav aria-label="Attacker dice modifications">
        <button
          onclick={() => onattack('focus')}
          disabled={!game.ships[attack.attackerId]?.focus || !attack.attack.includes('focus')}>Spend focus</button
        ><button
          onclick={() => onattack('force')}
          disabled={!game.ships[attack.attackerId]?.force || !attack.attack.includes('focus')}>Spend Force</button
        ><button onclick={() => onattack('pass')}>Pass attack modification</button>
      </nav>
    {:else if game.pending === 'defender-modify'}
      <nav aria-label="Defender dice modifications">
        <button
          onclick={() => ondefense('focus')}
          disabled={!game.ships[attack.defenderId]?.focus || !attack.defense.includes('focus')}>Spend focus</button
        ><button onclick={() => ondefense('evade')} disabled={!game.ships[attack.defenderId]?.evade}>Spend evade</button
        ><button onclick={() => ondefense('pass')}>Pass defense modification</button>
      </nav>
    {:else if game.pending === 'damage'}
      <button onclick={onresolve}>Apply results</button>
    {/if}
  {:else}
    <b class="stage">
      {game.pending === 'attack'
        ? 'ATTACK READY'
        : game.pending === 'attacker-modify'
          ? 'ATTACKER MODIFYING'
          : game.pending === 'defender-modify'
            ? 'DEFENDER MODIFYING'
            : 'RESULTS READY'}
    </b>
  {/if}
</section>

<style>
  .combat-panel {
    display: grid;
    gap: 10px;
    justify-items: center;
    width: max-content;
    max-width: 620px;
    padding: 14px;
    border: 1px solid #efbb58;
    border-radius: 10px;
    background: #07111ff5;
    box-shadow: 0 12px 38px #000b;
  }
  .combat-panel.read-only {
    border-color: #6fd4e888;
    opacity: 0.88;
  }
  p {
    margin: 0;
    font-weight: 700;
  }
  .dice,
  nav {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dice img {
    width: clamp(34px, 3vw, 62px);
    aspect-ratio: 1;
    object-fit: contain;
    animation: die-arrive 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .dice i {
    width: 2px;
    height: 44px;
    margin: 0 5px;
    background: #78929c;
  }
  button {
    min-height: 44px;
    padding: 7px 12px;
    border: 1px solid #6fd4e8;
    border-radius: 6px;
    background: #17384c;
    color: white;
    font-weight: 700;
  }
  button.primary {
    border-color: #efbb58;
    background: #b66c22;
  }
  button:disabled {
    opacity: 0.38;
  }
  .stage {
    color: #9fc9d3;
    font: 700 0.8rem 'Space Mono';
    letter-spacing: 0.08em;
  }
  @keyframes die-arrive {
    from {
      opacity: 0;
      transform: rotate(-90deg) scale(0.4);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dice img {
      animation: none;
    }
  }
</style>
