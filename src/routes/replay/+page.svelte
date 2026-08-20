<script lang="ts">
  import '$lib/styles/game.css';
  import { assets, base } from '$app/paths';
  import { onMount } from 'svelte';
  import ShipPiece from '$lib/components/ShipPiece.svelte';
  import type { GameEvent } from '$lib/game/model';
  import { publicProjection } from '$lib/game/selectors';
  import { replay } from '$lib/game/reducer';
  import { ROOM_ID, subscribeToRoom } from '$lib/repository/local-game';

  let events = $state<GameEvent[]>([]);
  let cursor = $state(0);
  let ready = $state(false);
  const snapshot = $derived(publicProjection(replay(events.slice(0, cursor)).state));
  onMount(() => {
    const room = new URLSearchParams(location.search).get('room') ?? ROOM_ID;
    return subscribeToRoom(room, (next) => {
      events = next;
      cursor = next.length;
      ready = true;
    });
  });
</script>

<svelte:head><title>X-Wing event replay</title></svelte:head>
<main
  data-status={ready ? 'ready' : 'loading'}
  data-e2e-layout
  style={`--starfield:url('${assets}/assets/starfield.webp')`}
>
  <header>
    <a href={`${base}/tt`}>← Table</a>
    <div>
      <p>IMMUTABLE FLIGHT REPLAY</p>
      <small class="event-position">{snapshot.gameId} · event {cursor} of {events.length}</small><small
        >{snapshot.config.ruleset} · {snapshot.config.reducer} · {snapshot.config.geometry} · {snapshot.config
          .prng}</small
      >
    </div>
    <span>{snapshot.phase} · round {snapshot.round}</span>
  </header>
  <section class="stage" aria-label="Replay battlefield">
    <div class="grid"></div>
    {#each Object.values(snapshot.ships) as ship}<ShipPiece {ship} />{/each}
  </section>
  <aside data-e2e-ignore-layout>
    <h1>Event history</h1>
    <input aria-label="Replay position" type="range" min="0" max={events.length} bind:value={cursor} />
    <div class="buttons">
      <button onclick={() => (cursor = Math.max(0, cursor - 1))}>Previous</button><button
        onclick={() => (cursor = Math.min(events.length, cursor + 1))}>Next</button
      >
    </div>
    <ol>
      {#each events as event, index}<li class:current={index + 1 === cursor}>
          <button onclick={() => (cursor = index + 1)}
            ><b>{index + 1}. {event.type}</b><span>{event.actor}</span></button
          >
        </li>{/each}
    </ol>
  </aside>
  <footer role="status">
    {cursor === 0 ? 'Before the room opened.' : (snapshot.log.at(-1) ?? `${events[cursor - 1]?.type} accepted.`)}
  </footer>
</main>

<style>
  main {
    display: grid;
    grid-template: 'header header' 74px 'stage history' minmax(0, 1fr) 'footer footer' 54px / minmax(0, 1fr) minmax(
        300px,
        24vw
      );
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background:
      linear-gradient(#04101add, #04101af2),
      var(--starfield) center/cover;
  }
  header {
    grid-area: header;
    display: flex;
    align-items: center;
    gap: 22px;
    padding: 12px 24px;
    border-bottom: 1px solid #6fd4e855;
    background: #071421ef;
  }
  header a {
    color: #6fd4e8;
    font-weight: 700;
  }
  header div {
    display: grid;
  }
  header p,
  header small {
    margin: 0;
  }
  header p {
    font: 700 1rem 'Space Mono';
    letter-spacing: 0.1em;
  }
  header small {
    color: #8faab4;
  }
  header > span {
    margin-left: auto;
    color: #efbb58;
    font-weight: 700;
    text-transform: uppercase;
  }
  .stage {
    position: relative;
    grid-area: stage;
    align-self: center;
    justify-self: center;
    width: min(76vh, 70vw);
    aspect-ratio: 1;
    border: 2px solid #6fd4e888;
    background: #061323;
    box-shadow: inset 0 0 90px #000;
  }
  .grid {
    position: absolute;
    inset: 0;
    opacity: 0.25;
    background-image:
      linear-gradient(#69bbca44 1px, transparent 1px), linear-gradient(90deg, #69bbca44 1px, transparent 1px);
    background-size: 10% 10%;
  }
  aside {
    grid-area: history;
    padding: 20px;
    overflow: auto;
    border-left: 1px solid #6fd4e855;
    background: #071421cc;
  }
  aside h1 {
    margin-top: 0;
    font: 700 1.1rem 'Space Mono';
  }
  input {
    width: 100%;
    accent-color: #efbb58;
  }
  .buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .buttons button,
  li button {
    border: 1px solid #6fd4e855;
    border-radius: 5px;
    background: #102a3b;
    color: white;
  }
  ol {
    display: grid;
    gap: 6px;
    padding: 0;
    list-style: none;
  }
  li button {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 8px;
    text-align: left;
  }
  li.current button {
    border-color: #efbb58;
    background: #513719;
  }
  li span {
    color: #8faab4;
    text-transform: capitalize;
  }
  footer {
    grid-area: footer;
    padding: 15px 24px;
    border-top: 1px solid #efbb5855;
    background: #071421;
    color: #bed1d7;
  }
</style>
