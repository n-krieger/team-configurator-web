<script lang="ts">
  let { label, index }: { label: string; index: number } = $props();
</script>

<span class="chip" style="--c: var(--pos-{index % 6})" title={label}>{label.slice(0, 2)}</span>

<style>
  .chip {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 1.9em;
    height: 1.5em;
    padding: 0 4px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--c);
    background: color-mix(in srgb, var(--c) 14%, transparent);
  }
</style>
