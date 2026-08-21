<script lang="ts">
  import '@fontsource/atkinson-hyperlegible/400.css';
  import '@fontsource/atkinson-hyperlegible/700.css';
  import '@fontsource/space-mono/700.css';
  import { assets as assetBase } from '$app/paths';
  import { onMount } from 'svelte';

  let ready = $state(false);
  const buildHash = (import.meta.env.VITE_GIT_HASH ?? 'local-development').slice(0, 8);
  const asset = (path: string) => `${assetBase}/assets/${path}`;

  onMount(() => {
    ready = true;
  });
</script>

<svelte:head>
  <title>X-Wing — Choose your maneuver</title>
</svelte:head>

<main
  data-status={ready ? 'ready' : 'loading'}
  data-e2e-layout
  style={`--starfield: url('${asset('starfield.webp')}')`}
>
  <div class="space" aria-hidden="true"></div>
  <header>
    <a class="wordmark" href={assetBase || '/'} aria-label="X-Wing home">X-WING</a>
    <p class="edition">FFG Second Edition · Rules Reference 1.3.2</p>
  </header>

  <section class="hero" aria-labelledby="hero-title">
    <div class="copy">
      <p class="eyebrow">Tactical flight, rebuilt for the browser</p>
      <h1 id="hero-title">Choose your maneuver.<br /><span>Own the outcome.</span></h1>
      <p class="lede">
        A deterministic two-player dogfight with private planning, exact geometry, explainable rulings, and complete
        replay.
      </p>

      <div class="readiness">
        <p role="status">
          <span class:online={ready} aria-hidden="true"></span>
          {ready ? 'Flight console ready' : 'Initializing flight console…'}
        </p>
        <p class="scope">Foundation preview · gameplay controls arrive in the next vertical slice</p>
      </div>

      <nav aria-label="Project documentation">
        <a href="https://github.com/anicolao/xwing/blob/main/VISION.md">Product vision</a>
        <a href="https://github.com/anicolao/xwing/blob/main/IMPLEMENTATION_PLAN.md">Implementation plan</a>
        <a href="https://github.com/anicolao/xwing/blob/main/E2E_GUIDE.md">E2E contract</a>
      </nav>
    </div>

    <div class="tableau" data-e2e-ignore-layout aria-label="A T-65 X-wing and two TIE fighters approach maneuver dials">
      <div class="orbit orbit-one"></div>
      <div class="orbit orbit-two"></div>
      <img class="dial" src={asset('maneuver-dial-back.webp')} alt="Original circular maneuver dial artwork" />
      <img class="xwing" src={asset('ships/t65-x-wing.webp')} alt="Original overhead T-65 X-wing artwork" />
      <img class="tie tie-one" src={asset('ships/tie-ln-fighter.webp')} alt="Original overhead TIE fighter artwork" />
      <img class="tie tie-two" src={asset('ships/tie-ln-fighter.webp')} alt="" />
    </div>
  </section>

  <footer>
    <p>Unofficial fan project · GPL-3.0-only</p>
    <p data-testid="build-marker">Build {buildHash}</p>
  </footer>
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(html) {
    color-scheme: dark;
    background: #07111f;
  }

  :global(body) {
    margin: 0;
    min-width: 320px;
    min-height: 100vh;
    font-family: 'Atkinson Hyperlegible', sans-serif;
    background: #07111f;
  }

  :global(a) {
    color: inherit;
  }

  main {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100svh;
    overflow: hidden;
    color: #dce8ed;
    isolation: isolate;
  }

  .space {
    position: absolute;
    z-index: -2;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(7, 17, 31, 0.98) 0%, rgba(7, 17, 31, 0.84) 45%, rgba(7, 17, 31, 0.3) 100%),
      var(--starfield) center / cover;
  }

  .space::after {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 78% 48%, rgba(55, 153, 179, 0.2), transparent 36%);
    content: '';
  }

  header,
  footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: min(100% - 48px, 1200px);
    margin-inline: auto;
  }

  header {
    padding-block: 24px;
    border-bottom: 1px solid rgba(111, 212, 232, 0.2);
  }

  .wordmark {
    font-family: 'Space Mono', monospace;
    font-size: 1.15rem;
    font-weight: 700;
    letter-spacing: 0.24em;
    text-decoration: none;
  }

  .edition,
  footer,
  .scope {
    color: #91aab4;
  }

  .edition {
    margin: 0;
    font-size: 0.82rem;
    letter-spacing: 0.05em;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1.1fr);
    align-items: center;
    gap: 2rem;
    width: min(100% - 48px, 1200px);
    margin-inline: auto;
    padding-block: 40px;
  }

  .copy {
    position: relative;
    z-index: 2;
    max-width: 590px;
  }

  .eyebrow {
    margin: 0 0 16px;
    color: #6fd4e8;
    font-family: 'Space Mono', monospace;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: clamp(2.7rem, 6vw, 5.6rem);
    line-height: 0.94;
    letter-spacing: -0.045em;
  }

  h1 span {
    color: #e8a23a;
  }

  .lede {
    max-width: 540px;
    margin: 24px 0 30px;
    color: #b8cbd2;
    font-size: clamp(1rem, 1.7vw, 1.25rem);
    line-height: 1.55;
  }

  .readiness {
    display: grid;
    gap: 4px;
    padding-left: 16px;
    border-left: 2px solid #e8a23a;
  }

  .readiness p {
    margin: 0;
  }

  [role='status'] {
    display: flex;
    align-items: center;
    gap: 9px;
    font-weight: 700;
  }

  [role='status'] span {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #91aab4;
  }

  [role='status'] span.online {
    background: #79d39b;
    box-shadow: 0 0 0 4px rgba(121, 211, 155, 0.12);
  }

  .scope {
    font-size: 0.84rem;
  }

  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 28px;
  }

  nav a {
    min-height: 44px;
    padding: 11px 15px;
    border: 1px solid rgba(111, 212, 232, 0.34);
    border-radius: 4px;
    background: rgba(7, 17, 31, 0.58);
    font-weight: 700;
    text-decoration: none;
  }

  nav a:hover,
  nav a:focus-visible {
    border-color: #6fd4e8;
    outline: 2px solid transparent;
    background: rgba(111, 212, 232, 0.12);
  }

  .tableau {
    position: relative;
    justify-self: end;
    width: min(48vw, 600px);
    aspect-ratio: 1;
  }

  .tableau img,
  .orbit {
    position: absolute;
  }

  .dial {
    top: 16%;
    left: 20%;
    width: 64%;
    border-radius: 50%;
    filter: drop-shadow(0 18px 34px rgba(0, 0, 0, 0.65));
    opacity: 0.86;
  }

  .xwing {
    z-index: 2;
    top: 18%;
    left: 31%;
    width: 38%;
    border-radius: 50%;
    filter: drop-shadow(0 15px 20px rgba(0, 0, 0, 0.76));
    transform: rotate(-8deg);
  }

  .tie {
    z-index: 3;
    width: 20%;
    border-radius: 50%;
    filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.8));
  }

  .tie-one {
    top: 10%;
    right: 0;
    transform: rotate(-22deg);
  }

  .tie-two {
    right: 3%;
    bottom: 6%;
    transform: rotate(16deg) scale(0.78);
    opacity: 0.82;
  }

  .orbit {
    inset: 6%;
    border: 1px solid rgba(111, 212, 232, 0.2);
    border-radius: 50%;
  }

  .orbit-two {
    inset: 13%;
    border-style: dashed;
    transform: rotate(24deg);
  }

  footer {
    padding-block: 18px 24px;
    border-top: 1px solid rgba(111, 212, 232, 0.2);
    font-family: 'Space Mono', monospace;
    font-size: 0.72rem;
  }

  footer p {
    margin: 0;
  }

  @media (max-width: 760px) {
    header,
    footer,
    .hero {
      width: min(100% - 28px, 620px);
    }

    header {
      padding-block: 17px;
    }

    .edition {
      max-width: 180px;
      text-align: right;
    }

    .hero {
      grid-template-columns: 1fr;
      align-content: center;
      gap: 10px;
      padding-block: 24px;
    }

    .tableau {
      position: absolute;
      z-index: -1;
      top: 16%;
      right: -27%;
      width: 78vw;
      opacity: 0.3;
    }

    .copy {
      max-width: 100%;
    }

    h1 {
      max-width: 600px;
    }

    .lede {
      max-width: 460px;
    }

    footer {
      gap: 12px;
    }
  }

  @media (max-width: 430px) {
    .edition {
      display: none;
    }

    h1 {
      font-size: clamp(2.35rem, 12vw, 3.2rem);
    }

    .lede {
      margin-block: 18px 22px;
      font-size: 1rem;
    }

    nav {
      margin-top: 22px;
    }

    nav a {
      flex: 1 1 calc(50% - 5px);
      text-align: center;
    }

    nav a:last-child {
      flex-basis: 100%;
    }

    footer {
      flex-wrap: wrap;
      padding-block: 13px 16px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      scroll-behavior: auto !important;
      transition: none !important;
    }
  }
</style>
