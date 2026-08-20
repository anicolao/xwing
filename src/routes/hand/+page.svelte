<script lang="ts">
  import '$lib/styles/game.css';
  import { assets } from '$app/paths';
  import { onMount } from 'svelte';
  import { handProjection } from '$lib/game/selectors';
  import { replay } from '$lib/game/reducer';
  import type { Seat } from '$lib/manifests/teaching-duel';
  import { claimSeat, pairingCode, ROOM_ID, subscribeToRoom } from '$lib/repository/local-game';

  let seat = $state<Seat>('rebel');
  let room = $state(ROOM_ID);
  let code = $state('');
  let paired = $state(false);
  let ready = $state(false);
  let message = $state('This phone will show only your private maneuver dials.');
  let projection = $state(handProjection(replay([]).state, 'rebel'));

  onMount(() => {
    const query = new URLSearchParams(location.search);
    seat = query.get('seat') === 'imperial' ? 'imperial' : 'rebel'; room = query.get('room') ?? ROOM_ID; code = query.get('code') ?? pairingCode[seat];
    const unsubscribe = subscribeToRoom(room, (events) => { projection = handProjection(replay(events).state, seat); paired = projection.connected; ready = true; });
    return unsubscribe;
  });

  function pair() {
    try { claimSeat(room, seat, code); message = `${seat === 'rebel' ? 'Rebel' : 'Imperial'} hand paired. Return attention to the table.`; }
    catch (error) { message = error instanceof Error ? error.message : 'Pairing failed.'; }
  }
</script>

<svelte:head><title>{seat === 'rebel' ? 'Rebel' : 'Imperial'} private hand</title></svelte:head>
<main data-status={ready ? 'ready' : 'loading'} data-e2e-layout class:imperial={seat === 'imperial'} style={`--starfield:url('${assets}/assets/starfield.webp')`}>
  <header><span class="mark"></span><div><p>{seat === 'rebel' ? 'REBEL' : 'IMPERIAL'} PRIVATE HAND</p><small>ROOM {room}</small></div><span class:online={paired} class="connection">{paired ? 'LINKED' : 'OFFLINE'}</span></header>
  {#if !paired}
    <section class="pair">
      <img src={`${assets}/assets/maneuver-dial-back.webp`} alt="Maneuver dial" />
      <p class="eyebrow">Seat enrollment</p><h1>Pair this hand</h1>
      <label for="pair-code">Pairing code</label><input id="pair-code" bind:value={code} autocomplete="one-time-code" />
      <button onclick={pair}>Claim {seat === 'rebel' ? 'Rebel' : 'Imperial'} seat</button>
    </section>
  {:else}
    <section class="waiting">
      <img src={`${assets}/assets/maneuver-dial-back.webp`} alt="Closed maneuver dial" />
      <p class="eyebrow">{projection.phase}</p>
      <h1>{projection.phase === 'planning' ? 'Choose your dials' : 'Eyes on the table'}</h1>
      <p>{projection.phase === 'planning' ? 'Private controls are ready for this squad.' : 'All public choices and game state remain on the shared surface.'}</p>
      <dl><div><dt>Your seat</dt><dd>{seat}</dd></div><div><dt>Opponent</dt><dd>{projection.opponentCommitted ? 'Committed' : 'Waiting'}</dd></div><div><dt>Round</dt><dd>{projection.round || 'Setup'}</dd></div></dl>
    </section>
  {/if}
  <p role="status" class="status">{message}</p>
</main>

<style>
  main { position:relative; display:grid; grid-template-rows:auto 1fr auto; min-height:100svh; padding:20px; overflow:hidden; background:linear-gradient(#061322dd,#061322f5),var(--starfield) center/cover; }
  header { display:flex; align-items:center; gap:12px; padding-bottom:16px; border-bottom:1px solid #edb54b55; } header p, header small { margin:0; } header p { font:700 .82rem 'Space Mono'; letter-spacing:.08em; } header small { color:#91aab4; }
  .mark { width:24px; height:24px; border:3px solid #efbb58; transform:rotate(45deg); } .imperial .mark { border-radius:50%; border-color:#6fd4e8; }
  .connection { margin-left:auto; color:#ef8a72; font-size:.72rem; font-weight:700; letter-spacing:.08em; } .connection.online { color:#72d39b; }
  .pair, .waiting { align-self:center; display:grid; justify-items:center; text-align:center; } .pair > img, .waiting > img { width:min(52vw,220px); filter:drop-shadow(0 14px 18px #000); }
  .eyebrow { margin:22px 0 5px; color:#6fd4e8; font:700 .72rem 'Space Mono'; letter-spacing:.13em; text-transform:uppercase; } h1 { margin:0 0 16px; font-size:2rem; }
  label { justify-self:start; width:min(100%,300px); margin:12px auto 5px; color:#a8c0c8; } input { width:min(100%,300px); min-height:52px; padding:8px 14px; border:1px solid #6fd4e8; border-radius:6px; background:#0d2233; text-align:center; font:700 1.2rem 'Space Mono'; letter-spacing:.15em; text-transform:uppercase; }
  button { width:min(100%,300px); margin-top:14px; border:1px solid #efbb58; border-radius:7px; background:#a85e1e; color:white; font-weight:700; }
  .waiting > p:not(.eyebrow) { max-width:330px; color:#b3c8cf; line-height:1.45; } dl { display:grid; width:100%; margin-top:20px; border-top:1px solid #6fd4e844; } dl div { display:flex; justify-content:space-between; padding:11px 2px; border-bottom:1px solid #6fd4e833; } dt { color:#8faab4; } dd { margin:0; font-weight:700; text-transform:capitalize; }
  .status { min-height:48px; margin:0; padding:12px; border-left:3px solid #efbb58; background:#071421cc; color:#c5d9de; font-size:.9rem; }
</style>
