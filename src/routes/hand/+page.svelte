<script lang="ts">
  import '$lib/styles/game.css';
  import { assets } from '$app/paths';
  import { onMount } from 'svelte';
  import { handProjection } from '$lib/game/selectors';
  import { replay } from '$lib/game/reducer';
  import { shipById, type Seat } from '$lib/manifests/teaching-duel';
  import { appendEvent, canAccessRoom, claimSeat, ROOM_ID, subscribeToRoom } from '$lib/repository/local-game';

  let seat = $state<Seat>('rebel');
  let room = $state(ROOM_ID);
  let paired = $state(false);
  let ready = $state(false);
  let message = $state('This phone will show only your private maneuver dials.');
  let busy = $state(false);
  let projection = $state(handProjection(replay([]).state, 'rebel'));

  onMount(() => {
    const query = new URLSearchParams(location.search);
    seat = query.get('seat') === 'imperial' ? 'imperial' : 'rebel';
    room = query.get('room') ?? ROOM_ID;
    let unsubscribe = () => {};
    const connectionFailed = (error: Error) => {
      message = `Firestore connection failed: ${error.message}`;
      ready = true;
    };
    const connect = () => {
      unsubscribe();
      unsubscribe = subscribeToRoom(
        room,
        (events) => {
          projection = handProjection(replay(events).state, seat);
          paired = projection.connected;
          ready = true;
        },
        connectionFailed
      );
    };
    void canAccessRoom(room)
      .then((access) => {
        if (access) connect();
        else ready = true;
      })
      .catch(connectionFailed);
    reconnect = connect;
    return () => unsubscribe();
  });

  let reconnect = () => {};

  async function perform(action: () => Promise<unknown>, success: string, fallback: string) {
    if (busy) return;
    busy = true;
    try {
      await action();
      message = success;
    } catch (error) {
      message = error instanceof Error ? error.message : fallback;
    } finally {
      busy = false;
    }
  }
  const pair = () =>
    perform(
      async () => {
        await claimSeat(room, seat);
        reconnect();
      },
      `${seat === 'rebel' ? 'Rebel' : 'Imperial'} hand paired. Return attention to the table.`,
      'Pairing failed.'
    );
  const assign = (shipId: string, maneuverId: string) =>
    perform(
      () => appendEvent({ type: 'planning/assigned', actor: seat, payload: { shipId, maneuverId } }, room),
      `${shipById(shipId)!.name} dial set. You may revise it until committing.`,
      'Dial could not be set.'
    );
  const commit = () =>
    perform(
      () => appendEvent({ type: 'planning/committed', actor: seat, payload: { seat } }, room),
      'Maneuvers committed. Return attention to the table.',
      'Commitment failed.'
    );
  const allAssigned = $derived(projection.ships.length > 0 && projection.ships.every((ship) => ship.maneuver));
</script>

<svelte:head><title>{seat === 'rebel' ? 'Rebel' : 'Imperial'} private hand</title></svelte:head>
<main
  class:busy
  aria-busy={busy}
  data-status={ready ? 'ready' : 'loading'}
  data-e2e-layout
  class:imperial={seat === 'imperial'}
  style={`--starfield:url('${assets}/assets/starfield.webp')`}
>
  <header>
    <span class="mark"></span>
    <div>
      <p>{seat === 'rebel' ? 'REBEL' : 'IMPERIAL'} PRIVATE HAND</p>
      <small>ROOM {room}</small>
    </div>
    <span class:online={paired} class="connection">{paired ? 'LINKED' : 'OFFLINE'}</span>
  </header>
  {#if !paired}
    <section class="pair">
      <img src={`${assets}/assets/maneuver-dial-back.webp`} alt="Maneuver dial" />
      <p class="eyebrow">Seat enrollment</p>
      <h1>Pair this hand</h1>
      <p>Confirm that this is the {seat === 'rebel' ? 'Rebel' : 'Imperial'} QR code shown on the tabletop.</p>
      <button onclick={pair}>Claim {seat === 'rebel' ? 'Rebel' : 'Imperial'} seat</button>
    </section>
  {:else}
    <section class:planning={projection.phase === 'planning'} class="waiting">
      <img src={`${assets}/assets/maneuver-dial-back.webp`} alt="Closed maneuver dial" />
      <p class="eyebrow">{projection.phase}</p>
      <h1>{projection.phase === 'planning' ? 'Choose your dials' : 'Eyes on the table'}</h1>
      <p>
        {projection.phase === 'planning'
          ? 'Only you can see these dials. Revise freely, then commit the squad.'
          : 'All public choices and game state remain on the shared surface.'}
      </p>
      {#if projection.phase === 'planning' && !projection.committed}
        <div class="dials">
          {#each projection.ships as ship}
            <fieldset>
              <legend>{ship.name}</legend>
              <div class="maneuvers">
                {#each shipById(ship.id)!.dial as maneuver}
                  <button
                    class:selected={ship.maneuver?.id === maneuver.id}
                    class:difficulty-blue={maneuver.difficulty === 'blue'}
                    class:difficulty-red={maneuver.difficulty === 'red'}
                    onclick={() => assign(ship.id, maneuver.id)}
                    aria-label={`${ship.name}: speed ${maneuver.speed} ${maneuver.bearing}, ${maneuver.difficulty}`}
                  >
                    <span>{maneuver.speed}</span><img
                      src={`${assets}/assets/maneuvers/${maneuver.bearing === 'koiogran' ? 'koiogran' : maneuver.bearing}.png`}
                      alt=""
                    />
                  </button>
                {/each}
              </div>
            </fieldset>
          {/each}
          <button class="commit" onclick={commit} disabled={!allAssigned}>Commit all maneuvers</button>
        </div>
      {:else if projection.committed}
        <div class="committed"><b>COMMITTED</b><span>Dial values are sealed until table reveal.</span></div>
      {/if}
      <dl>
        <div>
          <dt>Your seat</dt>
          <dd>{seat}</dd>
        </div>
        <div>
          <dt>Opponent</dt>
          <dd>{projection.opponentCommitted ? 'Committed' : 'Waiting'}</dd>
        </div>
        <div>
          <dt>Round</dt>
          <dd>{projection.round || 'Setup'}</dd>
        </div>
      </dl>
    </section>
  {/if}
  <p role="status" class="status">{message}</p>
</main>

<style>
  main {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100svh;
    padding: 20px;
    overflow: hidden;
    background:
      linear-gradient(#061322dd, #061322f5),
      var(--starfield) center/cover;
  }
  main.busy button {
    pointer-events: none;
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid #edb54b55;
  }
  header p,
  header small {
    margin: 0;
  }
  header p {
    font: 700 0.82rem 'Space Mono';
    letter-spacing: 0.08em;
  }
  header small {
    color: #91aab4;
  }
  .mark {
    width: 24px;
    height: 24px;
    border: 3px solid #efbb58;
    transform: rotate(45deg);
  }
  .imperial .mark {
    border-radius: 50%;
    border-color: #6fd4e8;
  }
  .connection {
    margin-left: auto;
    color: #ef8a72;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
  }
  .connection.online {
    color: #72d39b;
  }
  .pair,
  .waiting {
    align-self: center;
    display: grid;
    justify-items: center;
    text-align: center;
  }
  .pair > img,
  .waiting > img {
    width: min(52vw, 220px);
    filter: drop-shadow(0 14px 18px #000);
  }
  .waiting.planning {
    align-self: start;
    padding-top: 14px;
  }
  .waiting.planning > img {
    width: 82px;
  }
  .waiting.planning > img,
  .waiting.planning > .eyebrow,
  .waiting.planning > h1,
  .waiting.planning > p,
  .waiting.planning > dl {
    display: none;
  }
  .eyebrow {
    margin: 22px 0 5px;
    color: #6fd4e8;
    font: 700 0.72rem 'Space Mono';
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }
  h1 {
    margin: 0 0 16px;
    font-size: 2rem;
  }
  button {
    width: min(100%, 300px);
    margin-top: 14px;
    border: 1px solid #efbb58;
    border-radius: 7px;
    background: #a85e1e;
    color: white;
    font-weight: 700;
  }
  .dials {
    display: grid;
    gap: 9px;
    width: 100%;
  }
  fieldset {
    margin: 0;
    padding: 7px;
    border: 1px solid #6fd4e855;
    border-radius: 8px;
  }
  legend {
    padding: 0 8px;
    font-weight: 700;
  }
  .maneuvers {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 5px;
  }
  .maneuvers button {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    width: auto;
    min-width: 0;
    min-height: 44px;
    margin: 0;
    padding: 2px 4px;
    border: 2px solid #d7d9cf;
    background: #182833;
  }
  .maneuvers button.difficulty-blue {
    border-color: #64cce3;
  }
  .maneuvers button.difficulty-red {
    border-color: #e96f5f;
  }
  .maneuvers button.selected {
    background: #a85e1e;
    box-shadow: 0 0 0 3px #fff;
  }
  .maneuvers span {
    font: 700 0.88rem 'Space Mono';
  }
  .maneuvers img {
    width: 100%;
    height: 30px;
    object-fit: contain;
  }
  .commit {
    justify-self: center;
    min-height: 48px;
    margin: 0;
  }
  .commit:disabled {
    opacity: 0.4;
  }
  .committed {
    display: grid;
    gap: 5px;
    width: 100%;
    padding: 18px;
    border: 1px solid #72d39b;
    border-radius: 8px;
    background: #153526aa;
  }
  .committed b {
    color: #72d39b;
    font: 700 1rem 'Space Mono';
  }
  .waiting > p:not(.eyebrow) {
    max-width: 330px;
    color: #b3c8cf;
    line-height: 1.45;
  }
  dl {
    display: grid;
    width: 100%;
    margin-top: 20px;
    border-top: 1px solid #6fd4e844;
  }
  dl div {
    display: flex;
    justify-content: space-between;
    padding: 11px 2px;
    border-bottom: 1px solid #6fd4e833;
  }
  dt {
    color: #8faab4;
  }
  dd {
    margin: 0;
    font-weight: 700;
    text-transform: capitalize;
  }
  .status {
    min-height: 48px;
    margin: 0;
    padding: 12px;
    border-left: 3px solid #efbb58;
    background: #071421cc;
    color: #c5d9de;
    font-size: 0.9rem;
  }
</style>
