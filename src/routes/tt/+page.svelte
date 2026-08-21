<script lang="ts">
  import '$lib/styles/game.css';
  import { assets, base } from '$app/paths';
  import { onMount } from 'svelte';
  import CombatPanel from '$lib/components/CombatPanel.svelte';
  import QrCode from '$lib/components/QrCode.svelte';
  import ShipPiece from '$lib/components/ShipPiece.svelte';
  import { publicProjection } from '$lib/game/selectors';
  import { replay } from '$lib/game/reducer';
  import type { GameState } from '$lib/game/model';
  import { setupOrder, shipById, teachingDuel, type Action, type Seat } from '$lib/manifests/teaching-duel';
  import {
    appendEvent,
    canAccessRoom,
    createRoom,
    ROOM_ID,
    subscribeToRoom,
    tableRoomId
  } from '$lib/repository/local-game';

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
  let lockSourceId = $state<string | null>(null);
  let room = $state(ROOM_ID);
  let reconnect = () => {};

  onMount(() => {
    let unsubscribe = () => {};
    room = tableRoomId();
    const connectionFailed = (error: Error) => {
      notice = `Firestore connection failed: ${error.message}`;
      ready = true;
    };
    const connect = () => {
      unsubscribe();
      unsubscribe = subscribeToRoom(
        room,
        (events) => {
          game = publicProjection(replay(events).state);
          ready = true;
        },
        connectionFailed
      );
    };
    reconnect = connect;
    void canAccessRoom(room)
      .then((access) => {
        if (access) {
          setPairingLinks();
          connect();
        } else void openRoom();
      })
      .catch(connectionFailed);
    return () => unsubscribe();
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

  function setPairingLinks() {
    const route = `${location.origin}${base}/hand?room=${room}`;
    rebelUrl = `${route}&seat=rebel`;
    imperialUrl = `${route}&seat=imperial`;
  }
  function openRoom() {
    return perform(async () => {
      await createRoom(room);
      setPairingLinks();
      reconnect();
    }, `Room ${room} opened. Scan each seat's QR code with its phone.`);
  }
  function readySeat(seat: Seat) {
    perform(
      () => appendEvent({ type: 'player/ready', actor: 'table', payload: { seat } }, room),
      `${seat === 'rebel' ? 'Rebel' : 'Imperial'} squad ready.`
    );
  }
  function placeSetupPiece(pieceId: string) {
    perform(
      () => appendEvent({ type: 'setup/placed', actor: 'table', payload: { pieceId } }, room),
      'Placement accepted on the shared table.'
    );
  }
  function reveal(shipId: string) {
    perform(
      () => appendEvent({ type: 'activation/revealed', actor: 'table', payload: { shipId } }, room),
      `${shipById(shipId)!.name} flew its revealed maneuver.`
    );
  }
  function act(shipId: string, action: Action | 'pass', targetId?: string, direction?: 'left' | 'right') {
    lockSourceId = null;
    perform(
      () =>
        appendEvent(
          {
            type: 'activation/action',
            actor: 'table',
            payload: { shipId, action, targetId, direction }
          },
          room
        ),
      action === 'pass' ? 'Action passed.' : `${shipById(shipId)!.name} performed ${action}.`
    );
  }
  function beginLock(shipId: string) {
    lockSourceId = shipId;
    notice = 'Touch the enemy ship that will receive the target lock.';
  }
  function repair(shipId: string, cardId: string, title: string) {
    perform(
      () => appendEvent({ type: 'damage/repaired', actor: 'table', payload: { shipId, cardId } }, room),
      `${shipById(shipId)!.name} repaired ${title}.`
    );
  }
  function target(defenderId: string) {
    perform(
      () =>
        appendEvent(
          {
            type: 'engagement/targeted',
            actor: 'table',
            payload: { attackerId: game.activeShipId!, defenderId }
          },
          room
        ),
      `${shipById(defenderId)!.name} targeted. Confirm the firing solution.`
    );
  }
  function passAttack() {
    perform(
      () =>
        appendEvent({ type: 'engagement/passed', actor: 'table', payload: { attackerId: game.activeShipId! } }, room),
      'No attack. Next ship engages.'
    );
  }
  function roll() {
    perform(
      () => appendEvent({ type: 'engagement/rolled', actor: 'table', payload: {} }, room),
      'Dice rolled from the committed seed.'
    );
  }
  function modifyAttack(choice: 'focus' | 'force' | 'pass') {
    perform(
      () => appendEvent({ type: 'engagement/attack-modified', actor: 'table', payload: { choice } }, room),
      choice === 'pass' ? 'Attacker passed modifications.' : `Attacker spent ${choice}.`
    );
  }
  function modifyDefense(choice: 'focus' | 'evade' | 'pass') {
    perform(
      () => appendEvent({ type: 'engagement/defense-modified', actor: 'table', payload: { choice } }, room),
      choice === 'pass' ? 'Defender passed modifications.' : `Defender spent ${choice}.`
    );
  }
  function resolveAttack() {
    perform(
      () => appendEvent({ type: 'engagement/resolved', actor: 'table', payload: {} }, room),
      'Results neutralized and damage applied.'
    );
  }
  function endRound() {
    perform(() => appendEvent({ type: 'round/ended', actor: 'table', payload: {} }, room), 'End phase resolved.');
  }
  function concede(seat: Seat) {
    if (confirmConcession !== seat) {
      confirmConcession = seat;
      notice = `Tap again to confirm the ${seat} concession.`;
      return;
    }
    perform(
      () => appendEvent({ type: 'game/conceded', actor: 'table', payload: { seat } }, room),
      `${seat === 'rebel' ? 'Rebel' : 'Imperial'} squad conceded.`
    );
    confirmConcession = null;
  }
  function rematch() {
    perform(
      () =>
        appendEvent({ type: 'game/rematched', actor: 'table', payload: { seed: 0x5857494e + game.revision } }, room),
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

  function shipAnchorStyle(ship: GameState['ships'][string]) {
    return `--prompt-x:${ship.pose.x / 914.4}%;--prompt-y:${ship.pose.y / 914.4}%;--seat-facing:${ship.seat === 'imperial' ? '180deg' : '0deg'}`;
  }

  const activeShip = $derived(game.activeShipId ? game.ships[game.activeShipId] : undefined);
  const activeManifest = $derived(activeShip ? shipById(activeShip.id) : undefined);
  const nextPlacement = $derived(setupOrder[game.setupPlaced.length]);
  const publicNotice = $derived(game.outcome?.text ?? notice);
  const combatControlShipId = $derived(
    game.attack ? (game.pending === 'defender-modify' ? game.attack.defenderId : game.attack.attackerId) : undefined
  );
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
        <QrCode value={imperialUrl} label="Imperial phone QR code" />
        <p><b>IMPERIAL</b><small>Scan to claim this private hand</small></p>
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
    <a class="replay-link" href={`${base}/replay?room=${room}`}>Replay</a>
    <p class="view-readout">VIEW {Math.round(viewScale * 100)}% · {rotation}°</p>
    {#if game.phase === 'lobby'}
      <section class="gutter-prompt">
        <h1>{game.gameId === 'uncreated' ? 'OPENING TABLETOP ROOM' : 'PAIR BOTH PRIVATE HANDS'}</h1>
        <p>Public play stays here. Hidden maneuvers stay on each phone.</p>
      </section>
    {:else if game.phase === 'planning'}
      <section class="gutter-prompt">
        <h1>PLANNING</h1>
        <p>
          {game.seats.rebel.committed ? 'Rebel committed.' : 'Rebel choosing.'}
          {game.seats.imperial.committed ? 'Imperial committed.' : 'Imperial choosing.'}
        </p>
      </section>
    {:else if game.phase === 'engagement' && game.pending === 'end'}
      <section class="gutter-prompt">
        <h1>END PHASE</h1>
        <p>All surviving ships have engaged.</p>
        <button class="gutter-action" onclick={endRound}>Resolve End phase</button>
      </section>
    {:else if game.phase === 'finished'}
      <section class="gutter-prompt result">
        <h1>{game.winner === 'draw' ? 'DRAW' : `${game.winner?.toUpperCase()} VICTORY`}</h1>
        <p>The event history is complete.</p>
        <a href={`${base}/replay?room=${room}`}>Review replay</a>
        <button class="gutter-action" onclick={rematch}>Open rematch</button>
      </section>
    {/if}
    <p class="announcement" role="status">{publicNotice}</p>
    <div
      class="far-gutter-mirror"
      aria-hidden="true"
      data-title={game.phase === 'lobby'
        ? game.gameId === 'uncreated'
          ? 'OPENING ROOM'
          : 'PAIR BOTH HANDS'
        : game.phase === 'planning'
          ? 'PLANNING'
          : game.phase === 'finished'
            ? game.winner === 'draw'
              ? 'DRAW'
              : `${game.winner?.toUpperCase()} VICTORY`
            : game.phase === 'engagement' && game.pending === 'end'
              ? 'END PHASE'
              : game.phase.toUpperCase()}
      data-detail={publicNotice}
    ></div>
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
          outcome={!game.attack && game.outcome?.shipIds.includes(ship.id) ? game.outcome : undefined}
          selectable={(game.phase === 'activation' && game.pending === 'reveal' && ship.id === game.activeShipId) ||
            (lockSourceId !== null && ship.seat !== game.ships[lockSourceId]?.seat && !ship.destroyed) ||
            (game.phase === 'engagement' &&
              game.pending === 'target' &&
              ship.seat !== activeShip?.seat &&
              !ship.destroyed)}
          onclick={() =>
            lockSourceId
              ? act(lockSourceId, 'lock', ship.id)
              : game.phase === 'activation'
                ? reveal(ship.id)
                : target(ship.id)}
        />{/if}
    {/each}
    {#if game.phase === 'setup' && nextPlacement}
      <button
        class="placement"
        style={`--px:${nextPlacement.x / 914.4}%;--py:${nextPlacement.y / 914.4}%;--seat-facing:${nextPlacement.seat === 'imperial' ? '180deg' : '0deg'}`}
        onclick={() => placeSetupPiece(nextPlacement.id)}
        aria-label={`Place ${nextPlacement.kind === 'ship' ? shipById(nextPlacement.id)?.name : `obstacle ${game.setupPlaced.length + 1}`} for ${nextPlacement.seat}`}
      >
        <img src={`${assets}/assets/${nextPlacement.asset}`} alt="" /><span
          >FIXED SETUP {game.setupPlaced.length + 1}/9 · {nextPlacement.seat.toUpperCase()} PLACE {nextPlacement.kind.toUpperCase()}</span
        >
      </button>
    {/if}
    {#if activeShip && activeManifest && !game.attack && ['reveal', 'action', 'target'].includes(game.pending ?? '')}
      <div
        class:above-ship={activeShip.seat === 'rebel'}
        class="ship-anchor"
        style={shipAnchorStyle(activeShip)}
        data-context-ship={activeShip.id}
      >
        <div class="player-facing">
          {#if game.pending === 'reveal'}
            <div class="instruction"><b>REVEAL</b><span>Touch {activeManifest.name}</span></div>
          {:else if game.pending === 'target'}
            <div class="instruction">
              <b>{activeManifest.name.toUpperCase()} · CHOOSE TARGET</b><span>Touch an enemy in arc, or pass</span
              ><button onclick={passAttack}>Pass attack</button>
            </div>
          {:else if game.pending === 'action'}
            <nav class="action-strip" aria-label={`${activeManifest.name} actions`}>
              <strong>{activeManifest.name}</strong>
              {#if lockSourceId}
                <span class="lock-instruction">Touch an enemy at range 0–3</span>
              {:else}
                {#each activeManifest.actions as action}
                  {#if action === 'barrel-roll'}
                    <button
                      onclick={() => act(activeShip!.id, action, undefined, 'left')}
                      disabled={activeShip.stress > 0 || activeShip.skipAction}
                      aria-label="Barrel roll left"
                    >
                      <img src={`${assets}/assets/icons/action-${action}.png`} alt="" />← roll
                    </button>
                    <button
                      onclick={() => act(activeShip!.id, action, undefined, 'right')}
                      disabled={activeShip.stress > 0 || activeShip.skipAction}
                      aria-label="Barrel roll right"
                    >
                      <img src={`${assets}/assets/icons/action-${action}.png`} alt="" />roll →
                    </button>
                  {:else}
                    <button
                      onclick={() => (action === 'lock' ? beginLock(activeShip!.id) : act(activeShip!.id, action))}
                      disabled={activeShip.stress > 0 || activeShip.skipAction}
                    >
                      <img src={`${assets}/assets/icons/action-${action}.png`} alt="" />{action}
                    </button>
                  {/if}
                {/each}
                {#each activeShip.damage.filter((card) => card.faceup && (card.id.startsWith('weapons-failure-') || card.id.startsWith('structural-damage-'))) as card}
                  <button
                    class="repair"
                    onclick={() => repair(activeShip!.id, card.id, card.title)}
                    disabled={activeShip.stress > 0 || activeShip.skipAction}
                    aria-label={`Repair ${card.title}`}>Repair {card.title}</button
                  >
                {/each}
                <button onclick={() => act(activeShip!.id, 'pass')}>Pass</button>
              {/if}
            </nav>
          {/if}
        </div>
      </div>
    {/if}
    {#if game.attack}
      {#each [game.ships[game.attack.attackerId]!, game.ships[game.attack.defenderId]!] as combatShip}
        <div
          class:above-ship={combatShip.seat === 'rebel'}
          class:combat-attacker={combatShip.id === game.attack.attackerId}
          class:combat-defender={combatShip.id === game.attack.defenderId}
          class="ship-anchor combat-anchor"
          style={shipAnchorStyle(combatShip)}
          data-context-ship={combatShip.id}
        >
          <div class="player-facing">
            <CombatPanel
              {game}
              interactive={combatShip.id === combatControlShipId}
              onroll={roll}
              onattack={modifyAttack}
              ondefense={modifyDefense}
              onresolve={resolveAttack}
            />
          </div>
        </div>
      {/each}
    {/if}
  </section>

  <aside class="rail right" aria-label="Public event log" data-latest={game.log.at(-1) ?? 'Waiting for first event.'}>
    <div class="far-log-mirror" aria-hidden="true" data-latest={game.log.at(-1) ?? 'Waiting for first event.'}></div>
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
        <QrCode value={rebelUrl} label="Rebel phone QR code" />
        <p><b>REBEL</b><small>Scan to claim this private hand</small></p>
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
  .edge button {
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
    position: relative;
    z-index: 3;
    overflow: hidden;
    padding: 28px 20px;
    background: #07111fbb;
    border-color: #5ebcd033;
  }
  .left {
    grid-area: left;
    display: flex;
    flex-direction: column;
    border-right: 1px solid;
  }
  .right {
    grid-area: right;
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    border-left: 1px solid;
  }
  .wordmark {
    font: 700 clamp(17px, 1.4vw, 34px) 'Space Mono';
    letter-spacing: 0.18em;
  }
  .phase {
    margin: 2vh 0 0;
    color: #efbb58;
    font: 700 clamp(18px, 1.5vw, 36px) 'Space Mono';
    text-transform: uppercase;
  }
  .rules {
    margin: auto 0 0;
    color: #7f9ca7;
    line-height: 1.6;
  }
  .view-readout {
    margin: 8px 0 0;
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
    align-content: start;
    overflow: hidden;
    padding-left: 22px;
    color: #b8cbd2;
    font-size: clamp(12px, 0.9vw, 21px);
  }
  .far-log-mirror {
    display: grid;
    gap: 7px;
    margin-bottom: 24px;
    padding: 12px;
    transform: rotate(180deg);
    border-bottom: 1px solid #5ebcd044;
    color: #b8cbd2;
  }
  .far-log-mirror::before {
    color: #6fd4e8;
    font: 700 clamp(11px, 0.8vw, 18px) 'Space Mono';
    letter-spacing: 0.1em;
    content: 'LATEST OUTCOME';
  }
  .far-log-mirror::after {
    content: attr(data-latest);
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
    transform: rotate(calc(var(--seat-facing) - var(--view-rotation)));
  }
  .gutter-prompt {
    display: grid;
    gap: 10px;
    margin-top: 4vh;
    padding: 14px;
    border: 1px solid #6fd4e866;
    border-radius: 9px;
    background: #0a1928e8;
  }
  .gutter-prompt h1 {
    margin: 0;
    color: #efbb58;
    font: 700 clamp(13px, 1vw, 23px) 'Space Mono';
    letter-spacing: 0.08em;
  }
  .gutter-prompt p {
    margin: 0;
    color: #b7cbd2;
    font-size: clamp(11px, 0.78vw, 18px);
  }
  .gutter-prompt a {
    color: #6fd4e8;
  }
  .far-gutter-mirror {
    display: grid;
    gap: 6px;
    margin: auto 0 18px;
    padding: 12px;
    transform: rotate(180deg);
    border-top: 1px solid #5ebcd044;
    color: #9ebac3;
  }
  .far-gutter-mirror::before {
    color: #efbb58;
    font: 700 clamp(11px, 0.8vw, 18px) 'Space Mono';
    content: attr(data-title);
  }
  .far-gutter-mirror::after {
    content: attr(data-detail);
    font-size: clamp(10px, 0.7vw, 16px);
  }
  .gutter-action {
    min-height: 44px;
    border: 1px solid #efbb58;
    border-radius: 6px;
    background: #a85e1e;
    color: #fff;
    font-weight: 700;
  }
  .instruction {
    display: grid;
    gap: 7px;
    justify-items: center;
    padding: 18px 28px;
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
  .action-strip button {
    border: 1px solid #6fd4e8;
    border-radius: 6px;
    background: #17384c;
    color: white;
    font-weight: 700;
    pointer-events: auto;
  }
  .action-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: min(660px, 58vw);
    padding: 10px 16px;
    border: 1px solid #efbb58;
    border-radius: 10px;
    background: #071421f5;
    pointer-events: auto;
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
  .action-strip .repair {
    border-color: #efbb58;
    background: #5a3a18;
  }
  .action-strip img {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }
  .lock-instruction {
    color: #efbb58;
    font-weight: 700;
  }
  .ship-anchor {
    position: absolute;
    z-index: 10;
    left: clamp(22%, var(--prompt-x), 78%);
    top: clamp(18%, var(--prompt-y), 82%);
    transform: translate(-50%, 76px);
    pointer-events: none;
  }
  .ship-anchor.above-ship {
    transform: translate(-50%, calc(-100% - 76px));
  }
  .player-facing {
    transform: rotate(calc(var(--seat-facing) - var(--view-rotation)));
    transform-origin: center;
  }
  .combat-anchor {
    z-index: 11;
  }
  .ship-anchor.combat-attacker {
    transform: translate(calc(-100% - 72px), -50%);
  }
  .ship-anchor.combat-defender {
    transform: translate(72px, -50%);
  }
  .combat-anchor .player-facing {
    pointer-events: auto;
  }
  .result {
    border-color: #efbb58;
  }
  .announcement {
    margin: 18px 0 0;
    padding: 9px 11px;
    border-radius: 7px;
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
    .battlefield,
    .player-facing {
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
