<script lang="ts">
  import QRCode from 'qrcode';
  import { onMount } from 'svelte';
  let { value, label }: { value: string; label: string } = $props();
  let source = $state('');
  onMount(async () => {
    source = await QRCode.toDataURL(value, { width: 220, margin: 1, color: { dark: '#07111fff', light: '#edf7f4ff' } });
  });
</script>

{#if source}
  <img src={source} alt={label} />
{:else}
  <span aria-label={`${label} loading`}></span>
{/if}

<style>
  img, span { display: block; width: 100%; aspect-ratio: 1; border-radius: 0.5rem; background: #edf7f4; }
</style>
