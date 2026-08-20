<script lang="ts">
  import QRCode from 'qrcode';
  let { value, label }: { value: string; label: string } = $props();
  let source = $state('');

  $effect(() => {
    const encodedValue = value;
    source = '';
    void QRCode.toDataURL(encodedValue, {
      width: 220,
      margin: 1,
      color: { dark: '#07111fff', light: '#edf7f4ff' }
    }).then((result) => {
      if (value === encodedValue) source = result;
    });
  });
</script>

{#if source}
  <img src={source} alt={label} data-qr-value={value} />
{:else}
  <span aria-label={`${label} loading`} data-qr-value={value}></span>
{/if}

<style>
  img,
  span {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 0.5rem;
    background: #edf7f4;
  }
</style>
