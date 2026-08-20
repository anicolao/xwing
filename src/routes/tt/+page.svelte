<script lang="ts">
  import '$lib/styles/game.css';
  import { assets, base } from '$app/paths';
  import { onMount } from 'svelte';
  import QrCode from '$lib/components/QrCode.svelte';
  import ShipPiece from '$lib/components/ShipPiece.svelte';
  import { publicProjection } from '$lib/game/selectors';
  import { replay } from '$lib/game/reducer';
  import type { GameState } from '$lib/game/model';
  import { setupOrder, shipById, teachingDuel, type Action, type Seat } from '$lib/manifests/teaching-duel';
  import { appendEvent, createRoom, pairingCode, ROOM_ID, subscribeToRoom } from '$lib/repository/local-game';

  let game: GameState = $state(publicProjection(replay([]).state));
  let ready = $state(false);
  let notice = $state('Lay the display flat between both players.');
  let rotation = $state(0);
  let viewScale = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let drag = $state<{ pointerId: number; x: number; y: number } | null>(null);
  let rebelUrl = $state('');
  let imperialUrl = $state('');
  let confirmConcession = $state<Seat | null>(null);
  let busy = $state(false);

  onMount(() => {
    const route = `${location.origin}${base}/hand?room=${ROOM_ID}`;
    rebelUrl = `${route}&seat=rebel&code=${pairingCode.rebel}`;
    imperialUrl = `${route}&seat=imperial&code=${pairingCode.imperial}`;
    const unsubscribe = subscribeToRoom(ROOM_ID, (events) => {
      game = publicProjection(replay(events).state);
      ready = true;
    });
    return unsubscribe;
  });

  async function perform(action: () => void | Promise<unknown>, message: string) {
    if (busy) return;
    busy = true;
    try {
      await action();
      notice = message;
    } catch (error) {
      notice = error instanceof Error ? error.message : 'Action could not be completed.';
    } finally {
      busy = false;
    }
  }

  function openRoom() {
    perform(() => createRoom(), 'Room FLIGHT7 opened. Pair each phone to its own seat.');
  }
  function readySeat(seat: Seat) {
    perform(
      () => appendEvent({ type: 'player/ready', actor: 'table', payload: { seat } }),
      `${seat === 'rebel' ? 'Rebel' : 'Imperial'} squad ready.`
    );
  }
  function placeSetupPiece(pieceId: string) {
    perform(
      () => appendEvent({ type: 'setup/placed', actor: 'table', payload: { pieceId } }),
      'Placement accepted on the shared table.'
    );
  }
  function reveal(shipId: string) {
    perform(
      () => appendEvent({ type: 'activation/revealed', actor: 'table', payload: { shipId } }),
      `${shipById(shipId)!.name} flew its revealed maneuver.`
    );
  }
  function act(shipId: string, action: Action | 'pass') {
    const enemy = Object.values(game.ships).find((ship) => ship.seat !== game.ships[shipId]!.seat && !ship.destroyed);
    perform(
      () =>
        appendEvent({
          type: 'activation/action',
          actor: 'table',
          payload: { shipId, action, targetId: action === 'lock' ? enemy?.id : undefined }
        }),
      action === 'pass' ? 'Action passed.' : `${shipById(shipId)!.name} performed ${action}.`
    );
  }
  function target(defenderId: string) {
    perform(
      () =>
        appendEvent({
          type: 'engagement/targeted',
          actor: 'table',
          payload: { attackerId: game.activeShipId!, defenderId }
        }),
      `${shipById(defenderId)!.name} targeted. Confirm the firing solution.`
    );
  }
  function passAttack() {
    perform(
      () => appendEvent({ type: 'engagement/passed', actor: 'table', payload: { attackerId: game.activeShipId! } }),
      'No attack. Next ship engages.'
    );
  }
  function roll() {
    perform(
      () => appendEvent({ type: 'engagement/rolled', actor: 'table', payload: {} }),
      'Dice rolled from the committed seed.'
    );
  }
  function modifyAttack(choice: 'focus' | 'force' | 'pass') {
    perform(
      () => appendEvent({ type: 'engagement/attack-modified', actor: 'table', payload: { choice } }),
      choice === 'pass' ? 'Attacker passed modifications.' : `Attacker spent ${choice}.`
    );
  }
  function modifyDefense(choice: 'focus' | 'evade' | 'pass') {
    perform(
      () => appendEvent({ type: 'engagement/defense-modified', actor: 'table', payload: { choice } }),
      choice === 'pass' ? 'Defender passed modifications.' : `Defender spent ${choice}.`
    );
  }
  function resolveAttack() {
    perform(
      () => appendEvent({ type: 'engagement/resolved', actor: 'table', payload: {} }),
      'Results neutralized and damage applied.'
    );
  }
  function endRound() {
    perform(() => appendEvent({ type: 'round/ended', actor: 'table', payload: {} }), 'End phase resolved.');
  }
  function concede(seat: Seat) {
    if (confirmConcession !== seat) {
      confirmConcession = seat;
      notice = `Tap again to confirm the ${seat} concession.`;
      return;
    }
    perform(
      () => appendEvent({ type: 'game/conceded', actor: 'table', payload: { seat } }),
      `${seat === 'rebel' ? 'Rebel' : 'Imperial'} squad conceded.`
    );
    confirmConcession = null;
  }
  function rematch() {
    perform(
      () => appendEvent({ type: 'game/rematched', actor: 'table', payload: { seed: 0x5857494e + game.revision } }),
      'Rematch opened with a new deterministic seed.'
    );
  }
  function rotateView() {
    rotation = (rotation + 90) % 360;
    notice = `Table view rotated ${rotation} degrees. Rules geometry is unchanged.`;
  }
  function zoomView(delta: number) {
    viewScale = Math.min(2, Math.max(0.75, viewScale + delta));
    notice = `Table view ${Math.round(viewScale * 100)} percent. Rules scale is unchanged.`;
  }
  function centerView() {
    viewScale = 1;
    panX = 0;
    panY = 0;
    notice = 'Table view centered at 100 percent.';
  }
  function keyView(event: KeyboardEvent) {
    if (event.key === '+' || event.key === '=') zoomView(0.25);
    else if (event.key === '-') zoomView(-0.25);
    else if (event.key === '0') centerView();
    else if (event.key.startsWith('Arrow')) {
      panX += event.key === 'ArrowLeft' ? -40 : event.key === 'ArrowRight' ? 40 : 0;
      panY += event.key === 'ArrowUp' ? -40 : event.key === 'ArrowDown' ? 40 : 0;
    } else return;
    event.preventDefault();
  }
  function beginPan(event: PointerEvent) {
    if ((event.target as Element).closest('button')) return;
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function movePan(event: PointerEvent) {
    if (drag?.pointerId === event.pointerId) {
      panX += event.clientX - drag.x;
      panY += event.clientY - drag.y;
      drag = { ...drag, x: event.clientX, y: event.clientY };
    }
  }
  function endPan(event: PointerEvent) {
    if (drag?.pointerId === event.pointerId) drag = null;
  }

  const activeShip = $derived(game.activeShipId ? game.ships[game.activeShipId] : undefined);
  const activeManifest = $derived(activeShip ? shipById(activeShip.id) : undefined);
  const nextPlacement = $derived(setupOrder[game.setupPlaced.length]);
</script>

<svelte:head><title>X-Wing shared tabletop</title></svelte:head>
<svelte:window onkeydown={keyView} />

<main
  class:busy
  aria-busy={busy}
  data-status={ready ? 'ready' : 'loading'}
  data-e2e-layout
  data-view={`${rotation}:${viewScale}:${panX}:${panY}`}
  style={`--starfield:url('${assets}/assets/starfield.webp');--view-rotation:${rotation}deg;--view-scale:${viewScale};--pan-x:${panX}px;--pan-y:${panY}px`}
>
  <div class="stars" aria-hidden="true"></div>

  <section class="edge far" aria-label="Imperial player edge">
    <div class="edge-status">
      <span class="seat-mark imperial"></span><strong>IMPERIAL EDGE</strong><span
        >{game.seats.imperial.joined ? 'PHONE LINKED' : 'PAIR PHONE'}</span
      >
    </div>
    {#if game.phase === 'lobby' && game.gameId !== 'uncreated'}
      <div class="pair-card">
        <QrCode value={imperialUrl} label="Imperial phone pairing code" />
        <p><b>{pairingCode.imperial}</b><small>Imperial private hand</small></p>
      </div>
      {#if game.seats.imperial.joined}<button onclick={() => readySeat('imperial')} disabled={game.seats.imperial.ready}
          >{game.seats.imperial.ready ? 'Squad ready' : 'Ready Imperial squad'}</button
        >{/if}
    {/if}
    {#if !['lobby', 'finished'].includes(game.phase)}<button class="concede" onclick={() => concede('imperial')}
        >{confirmConcession === 'imperial' ? 'Confirm Imperial concession' : 'Concede Imperial squad'}</button
      >{/if}
    <nav class="view-controls" aria-label="Imperial table view">
      <button onclick={() => zoomView(-0.25)} aria-label="Zoom out from Imperial edge">−</button><button
        onclick={centerView}
        aria-label="Center view from Imperial edge">◎</button
      ><button onclick={() => zoomView(0.25)} aria-label="Zoom in from Imperial edge">+</button><button
        onclick={rotateView}
        aria-label="Rotate from Imperial edge">↻</button
      >
    </nav>
  </section>

  <aside class="rail left" aria-label="Game state">
    <p class="wordmark">X-WING</p>
    <p class="phase">{game.phase}</p>
    <p>Round {game.round || '—'}</p>
    <p class="rules">FFG 2E<br />Rules 1.3.2</p>
    <a class="replay-link" href={`${base}/replay?room=${ROOM_ID}`}>Replay</a>
    <p class="view-readout">VIEW {Math.round(viewScale * 100)}% · {rotation}°</p>
  </aside>

  <!-- svelte-ignore a11y_no_noninteractive_element_interactions (the spatial play surface supports direct pointer panning) -->
  <section
    class="battlefield"
    role="application"
    aria-label="Three foot square play area"
    onpointerdown={beginPan}
    onpointermove={movePan}
    onpointerup={endPan}
    onpointercancel={endPan}
    style={`transform:translate(var(--pan-x),var(--pan-y)) scale(var(--view-scale)) rotate(var(--view-rotation))`}
  >
    <div class="grid" aria-hidden="true"></div>
    {#each setupOrder.filter((piece) => piece.kind === 'obstacle') as obstacle, index}
      {#if game.setupPlaced.includes(obstacle.id) || !['lobby', 'setup'].includes(game.phase)}<img
          class="obstacle"
          style={`--ox:${obstacle.x / 914.4}%;--oy:${obstacle.y / 914.4}%;--or:${index * 31}deg`}
          src={`${assets}/assets/${obstacle.asset}`}
          alt={`Obstacle ${index + 1}`}
        />{/if}
    {/each}
    {#each Object.values(game.ships) as ship}
      {#if game.setupPlaced.includes(ship.id) || !['lobby', 'setup'].includes(game.phase)}<ShipPiece
          {ship}
          active={ship.id === game.activeShipId}
          selectable={(game.phase === 'activation' && game.pending === 'reveal' && ship.id === game.activeShipId) ||
            (game.phase === 'engagement' &&
              game.pending === 'target' &&
              ship.seat !== activeShip?.seat &&
              !ship.destroyed)}
          onclick={() => (game.phase === 'activation' ? reveal(ship.id) : target(ship.id))}
        />{/if}
    {/each}
    {#if game.phase === 'setup' && nextPlacement}
      <button
        class="placement"
        style={`--px:${nextPlacement.x / 914.4}%;--py:${nextPlacement.y / 914.4}%`}
        onclick={() => placeSetupPiece(nextPlacement.id)}
        aria-label={`Place ${nextPlacement.kind === 'ship' ? shipById(nextPlacement.id)?.name : `obstacle ${game.setupPlaced.length + 1}`} for ${nextPlacement.seat}`}
      >
        <img src={`${assets}/assets/${nextPlacement.asset}`} alt="" /><span
          >{nextPlacement.seat.toUpperCase()} · PLACE</span
        >
      </button>
    {/if}
    {#if game.phase === 'lobby'}
      <div class="center-message">
        <img src={`${assets}/assets/maneuver-dial-back.webp`} alt="Maneuver dial" />
        <h1>{game.gameId === 'uncreated' ? 'OPEN A TEACHING DUEL' : 'PAIR BOTH PRIVATE HANDS'}</h1>
        <p>Public play stays here. Only hidden maneuver choices move to a phone.</p>
        {#if game.gameId === 'uncreated'}<button class="primary" onclick={openRoom}>Create tabletop room</button>{/if}
      </div>
    {:else if game.phase === 'setup'}
      <div class="instruction setup-instruction">
        <b>FIXED SETUP · {game.setupPlaced.length + 1}/9</b><span
          >{nextPlacement?.seat.toUpperCase()} player: touch the highlighted {nextPlacement?.kind} on the battlefield</span
        >
      </div>
    {:else if game.phase === 'planning'}
      <div class="center-message compact">
        <h1>PLANNING</h1>
        <p>
          Dials remain hidden. {game.seats.rebel.committed ? 'Rebel committed.' : 'Rebel choosing.'}
          {game.seats.imperial.committed ? 'Imperial committed.' : 'Imperial choosing.'}
        </p>
      </div>
    {:else if game.phase === 'activation' && game.pending === 'reveal'}
      <div class="instruction"><b>REVEAL</b><span>Touch {activeManifest?.name} on the battlefield</span></div>
    {:else if game.phase === 'engagement' && game.pending === 'target'}
      <div class="instruction">
        <b>CHOOSE TARGET</b><span>Touch an enemy in arc, or pass</span><button onclick={passAttack}>Pass attack</button>
      </div>
    {/if}
    {#if game.attack}
      <div class="dice-tray" aria-label="Attack dice tray">
        <p>
          {shipById(game.attack.attackerId)?.name} → {shipById(game.attack.defenderId)?.name} · RANGE {game.attack
            .range}{game.attack.obstructed ? ' · OBSTRUCTED' : ''}
        </p>
        {#if game.pending === 'attack'}
          <button class="primary" onclick={roll}>Roll attack and defense</button>
        {:else}
          <div class="dice">
            {#each game.attack.attack as face}<img
                src={`${assets}/assets/icons/die-${face}.png`}
                alt={`Attack die ${face}`}
              />{/each}
            <i></i>
            {#each game.attack.defense as face}<img
                src={`${assets}/assets/icons/die-${face}.png`}
                alt={`Defense die ${face}`}
              />{/each}
          </div>
          {#if game.pending === 'attacker-modify'}
            <nav class="modifier-controls" aria-label="Attacker dice modifications">
              <button
                onclick={() => modifyAttack('focus')}
                disabled={!game.ships[game.attack.attackerId]?.focus || !game.attack.attack.includes('focus')}
                >Spend focus</button
              ><button
                onclick={() => modifyAttack('force')}
                disabled={!game.ships[game.attack.attackerId]?.force || !game.attack.attack.includes('focus')}
                >Spend Force</button
              ><button onclick={() => modifyAttack('pass')}>Pass attack modification</button>
            </nav>
          {:else if game.pending === 'defender-modify'}
            <nav class="modifier-controls" aria-label="Defender dice modifications">
              <button
                onclick={() => modifyDefense('focus')}
                disabled={!game.ships[game.attack.defenderId]?.focus || !game.attack.defense.includes('focus')}
                >Spend focus</button
              ><button onclick={() => modifyDefense('evade')} disabled={!game.ships[game.attack.defenderId]?.evade}
                >Spend evade</button
              ><button onclick={() => modifyDefense('pass')}>Pass defense modification</button>
            </nav>
          {:else}<button onclick={resolveAttack}>Apply results</button>{/if}
        {/if}
      </div>
    {/if}
  </section>

  <aside class="rail right" aria-label="Public event log">
    <h2>FLIGHT LOG</h2>
    <ol>
      {#each game.log.slice(-6).reverse() as entry}<li>{entry}</li>{/each}
    </ol>
  </aside>

  <section class="edge near" aria-label="Rebel player edge">
    <div class="edge-status">
      <span class="seat-mark rebel"></span><strong>REBEL EDGE</strong><span
        >{game.seats.rebel.joined ? 'PHONE LINKED' : 'PAIR PHONE'}</span
      >
    </div>
    {#if game.phase === 'lobby' && game.gameId !== 'uncreated'}
      <div class="pair-card">
        <QrCode value={rebelUrl} label="Rebel phone pairing code" />
        <p><b>{pairingCode.rebel}</b><small>Rebel private hand</small></p>
      </div>
      {#if game.seats.rebel.joined}<button onclick={() => readySeat('rebel')} disabled={game.seats.rebel.ready}
          >{game.seats.rebel.ready ? 'Squad ready' : 'Ready Rebel squad'}</button
        >{/if}
    {/if}
    {#if !['lobby', 'finished'].includes(game.phase)}<button class="concede" onclick={() => concede('rebel')}
        >{confirmConcession === 'rebel' ? 'Confirm Rebel concession' : 'Concede Rebel squad'}</button
      >{/if}
    <nav class="view-controls" aria-label="Rebel table view">
      <button onclick={() => zoomView(-0.25)} aria-label="Zoom out from Rebel edge">−</button><button
        onclick={centerView}
        aria-label="Center view from Rebel edge">◎</button
      ><button onclick={() => zoomView(0.25)} aria-label="Zoom in from Rebel edge">+</button><button
        onclick={rotateView}
        aria-label="Rotate from Rebel edge">↻</button
      >
    </nav>
  </section>
  {#if game.phase === 'activation' && game.pending === 'action' && activeShip && activeManifest}
    <nav
      class:far-actions={activeShip.seat === 'imperial'}
      class="action-strip"
      aria-label={`${activeManifest.name} actions`}
    >
      <strong>{activeManifest.name}</strong>
      {#each activeManifest.actions as action}
        <button onclick={() => act(activeShip!.id, action)} disabled={activeShip.stress > 0 || activeShip.skipAction}>
          <img src={`${assets}/assets/icons/action-${action}.png`} alt="" />{action}
        </button>
      {/each}
      <button onclick={() => act(activeShip!.id, 'pass')}>Pass</button>
    </nav>
  {/if}
  {#if game.phase === 'engagement' && game.pending === 'end'}<button class="end-round" onclick={endRound}
      >Resolve End phase</button
    >{/if}
  {#if game.phase === 'finished'}<div class="result">
      <b>{game.winner === 'draw' ? 'DRAW' : `${game.winner?.toUpperCase()} VICTORY`}</b><span
        >The event history is complete.</span
      ><a href={`${base}/replay?room=${ROOM_ID}`}>Review replay</a><button onclick={rematch}>Open rematch</button>
    </div>{/if}
  <p class="announcement" role="status">{notice}</p>
</main>

<style>
  main {
    position: relative;
    display: grid;
    grid-template:
      'far far far' minmax(86px, 11vh) 'left board right' minmax(0, 1fr) 'near near near' minmax(86px, 11vh)
      / minmax(180px, 15vw) minmax(0, 1fr) minmax(190px, 15vw);
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    isolation: isolate;
  }
  main.busy button {
    pointer-events: none;
  }
  .stars {
    position: absolute;
    z-index: -2;
    inset: 0;
    background:
      linear-gradient(#020914cc, #020914e8),
      var(--starfield) center/cover;
  }
  .edge {
    z-index: 8;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(12px, 2vw, 50px);
    padding: 10px 18%;
    background: linear-gradient(90deg, #07111fee, #102335ee, #07111fee);
    border-color: #5ebcd055;
  }
  .far {
    grid-area: far;
    border-bottom: 1px solid;
    transform: rotate(180deg);
  }
  .near {
    grid-area: near;
    border-top: 1px solid;
  }
  .edge-status {
    display: flex;
    align-items: center;
    gap: 16px;
    letter-spacing: 0.12em;
  }
  .edge-status span:last-child {
    color: #8fb0ba;
    font-size: 0.75em;
  }
  .seat-mark {
    width: 20px;
    height: 20px;
    border: 3px solid currentColor;
    transform: rotate(45deg);
  }
  .rebel {
    color: #efbb58;
  }
  .imperial {
    color: #66cde3;
    border-radius: 50%;
  }
  .pair-card {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 72px;
  }
  .pair-card :global(img) {
    width: 64px;
  }
  .pair-card p {
    display: grid;
    margin: 0;
  }
  .pair-card b {
    font: 700 clamp(16px, 1.2vw, 30px) 'Space Mono';
    letter-spacing: 0.14em;
  }
  .pair-card small {
    color: #9eb5bd;
  }
  .edge button,
  .primary {
    border: 1px solid #6fd4e8;
    border-radius: 7px;
    padding: 9px 18px;
    color: #fff;
    background: #17364b;
    font-weight: 700;
    cursor: pointer;
  }
  .view-controls {
    display: flex;
    gap: 5px;
  }
  .view-controls button {
    min-width: 44px;
    min-height: 44px;
    padding: 7px;
    font-size: 1.15em;
  }
  .edge button:disabled {
    border-color: #4eaa76;
    background: #153426;
    color: #b9e8cb;
  }
  .rail {
    z-index: 3;
    padding: 28px 20px;
    background: #07111fbb;
    border-color: #5ebcd033;
  }
  .left {
    grid-area: left;
    border-right: 1px solid;
  }
  .right {
    grid-area: right;
    border-left: 1px solid;
  }
  .wordmark {
    font: 700 clamp(17px, 1.4vw, 34px) 'Space Mono';
    letter-spacing: 0.18em;
  }
  .phase {
    margin-top: 5vh;
    color: #efbb58;
    font: 700 clamp(18px, 1.5vw, 36px) 'Space Mono';
    text-transform: uppercase;
  }
  .rules {
    position: absolute;
    bottom: 15vh;
    color: #7f9ca7;
    line-height: 1.6;
  }
  .view-readout {
    position: absolute;
    bottom: 12vh;
    color: #8fb0ba;
    font: 700 clamp(10px, 0.7vw, 16px) 'Space Mono';
  }
  .replay-link {
    display: inline-block;
    margin-top: 16px;
    color: #6fd4e8;
    font-weight: 700;
  }
  .right h2 {
    color: #6fd4e8;
    font: 700 clamp(13px, 1vw, 24px) 'Space Mono';
    letter-spacing: 0.1em;
  }
  .right ol {
    display: grid;
    gap: 16px;
    padding-left: 22px;
    color: #b8cbd2;
    font-size: clamp(12px, 0.9vw, 21px);
  }
  .battlefield {
    position: relative;
    grid-area: board;
    align-self: center;
    justify-self: center;
    width: min(100%, 78vh);
    aspect-ratio: 1;
    overflow: hidden;
    border: 2px solid #7bc9d688;
    border-radius: 4px;
    background: #061323;
    box-shadow:
      inset 0 0 80px #000,
      0 0 36px #4db6cc22;
    transition: transform 0.45s ease;
  }
  .grid {
    position: absolute;
    inset: 0;
    opacity: 0.25;
    background-image:
      linear-gradient(#69bbca44 1px, transparent 1px), linear-gradient(90deg, #69bbca44 1px, transparent 1px);
    background-size: 10% 10%;
  }
  .obstacle {
    position: absolute;
    left: var(--ox);
    top: var(--oy);
    width: 11%;
    transform: translate(-50%, -50%) rotate(var(--or));
    filter: drop-shadow(0 5px 4px #000);
  }
  .placement {
    position: absolute;
    z-index: 7;
    left: var(--px);
    top: var(--py);
    display: grid;
    place-items: center;
    width: 12%;
    aspect-ratio: 1;
    padding: 5px;
    transform: translate(-50%, -50%);
    border: 3px dashed #efbb58;
    border-radius: 50%;
    background: #efbb5818;
    color: #fff;
    cursor: pointer;
    animation: pulse-placement 1.3s ease-in-out infinite;
  }
  .placement img {
    width: 78%;
    height: 78%;
    object-fit: contain;
    filter: drop-shadow(0 6px 5px #000);
  }
  .placement span {
    position: absolute;
    top: 100%;
    min-width: max-content;
    padding: 3px 7px;
    border-radius: 3px;
    background: #07111fee;
    color: #efbb58;
    font: 700 clamp(10px, 0.72vw, 18px) 'Space Mono';
  }
  .center-message {
    position: absolute;
    z-index: 5;
    left: 50%;
    top: 50%;
    display: grid;
    justify-items: center;
    width: min(78%, 700px);
    padding: clamp(18px, 3vw, 50px);
    border: 1px solid #6fd4e866;
    border-radius: 14px;
    transform: translate(-50%, -50%) rotate(calc(-1 * var(--view-rotation)));
    background: #07111fee;
    text-align: center;
    box-shadow: 0 20px 70px #000;
  }
  .center-message img {
    width: clamp(84px, 10vw, 200px);
  }
  .center-message h1 {
    margin: 15px 0 4px;
    font: 700 clamp(17px, 1.8vw, 40px) 'Space Mono';
    letter-spacing: 0.08em;
  }
  .center-message p {
    margin: 8px 0 18px;
    color: #b7cbd2;
    font-size: clamp(12px, 1vw, 23px);
  }
  .compact {
    width: min(65%, 560px);
    padding: 24px;
  }
  .primary {
    min-height: 54px;
    background: #b66c22;
    border-color: #efbb58;
    font-size: 1.08em;
  }
  .instruction {
    position: absolute;
    z-index: 6;
    left: 50%;
    top: 50%;
    display: grid;
    gap: 7px;
    justify-items: center;
    padding: 18px 28px;
    transform: translate(-50%, -50%) rotate(calc(-1 * var(--view-rotation)));
    border: 1px solid #efbb58;
    border-radius: 10px;
    background: #07111feb;
    text-align: center;
    pointer-events: none;
  }
  .instruction b {
    color: #efbb58;
    font: 700 1.1rem 'Space Mono';
  }
  .instruction button,
  .dice-tray button {
    border: 1px solid #6fd4e8;
    border-radius: 6px;
    background: #17384c;
    color: white;
    font-weight: 700;
    pointer-events: auto;
  }
  .action-strip {
    position: absolute;
    z-index: 12;
    left: 50%;
    bottom: 11vh;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    transform: translateX(-50%);
    border: 1px solid #efbb58;
    border-radius: 10px 10px 0 0;
    background: #071421f5;
  }
  .action-strip.far-actions {
    top: 11vh;
    bottom: auto;
    transform: translateX(-50%) rotate(180deg);
    border-radius: 0 0 10px 10px;
  }
  .action-strip button {
    display: flex;
    align-items: center;
    gap: 5px;
    min-height: 52px;
    border: 1px solid #6fd4e8;
    border-radius: 6px;
    background: #133247;
    color: white;
    text-transform: capitalize;
  }
  .action-strip img {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }
  .dice-tray {
    position: absolute;
    z-index: 9;
    left: 50%;
    top: 50%;
    display: grid;
    gap: 12px;
    justify-items: center;
    min-width: 44%;
    padding: 18px;
    transform: translate(-50%, -50%) rotate(calc(-1 * var(--view-rotation)));
    border: 1px solid #efbb58;
    border-radius: 12px;
    background: #07111ff5;
  }
  .dice-tray p {
    margin: 0;
    font-weight: 700;
  }
  .dice {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .dice img {
    width: clamp(38px, 4vw, 72px);
    aspect-ratio: 1;
    object-fit: contain;
  }
  .dice i {
    width: 2px;
    height: 55px;
    margin: 0 8px;
    background: #78929c;
  }
  .modifier-controls {
    display: flex;
    gap: 8px;
  }
  .modifier-controls button {
    min-height: 48px;
    padding: 8px 14px;
  }
  .modifier-controls button:disabled {
    opacity: 0.38;
  }
  .end-round {
    position: absolute;
    z-index: 12;
    left: 50%;
    bottom: calc(11vh + 30px);
    transform: translateX(-50%);
    border: 1px solid #efbb58;
    border-radius: 7px;
    padding: 10px 18px;
    background: #a85e1e;
    color: white;
    font-weight: 700;
  }
  .result {
    position: absolute;
    z-index: 15;
    left: 50%;
    top: 50%;
    display: grid;
    gap: 12px;
    padding: 40px 70px;
    transform: translate(-50%, -50%);
    border: 2px solid #efbb58;
    border-radius: 14px;
    background: #07111ff5;
    text-align: center;
  }
  .result b {
    color: #efbb58;
    font: 700 2rem 'Space Mono';
  }
  .result a {
    color: #6fd4e8;
  }
  .result button {
    border: 1px solid #efbb58;
    border-radius: 6px;
    background: #a85e1e;
    color: white;
    font-weight: 700;
  }
  .announcement {
    position: absolute;
    z-index: 10;
    left: 50%;
    bottom: calc(11vh + 10px);
    margin: 0;
    padding: 7px 16px;
    transform: translateX(-50%);
    border-radius: 30px;
    background: #081522dd;
    color: #cce7ec;
    font-size: clamp(12px, 0.8vw, 18px);
  }
  @media (max-aspect-ratio: 4/3) {
    main::before {
      position: fixed;
      z-index: 50;
      inset: 0;
      display: grid;
      place-items: center;
      padding: 30px;
      background: #06101a;
      content: 'Rotate this display to landscape for the shared tabletop.';
      text-align: center;
      font-size: 1.5rem;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .battlefield {
      transition: none;
    }
  }
  @keyframes pulse-placement {
    50% {
      box-shadow: 0 0 38px #efbb5899;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .placement {
      animation: none;
    }
  }
</style>
