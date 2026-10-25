<script lang="ts">
  import Icon from './Icon.svelte';

  let {
    value = $bindable(),
    min = 0,
    max = Infinity,
    step = 1,
    digits = 0,
    label,
  }: { value: number; min?: number; max?: number; step?: number; digits?: number; label: string } = $props();

  const round = (v: number) => Number(v.toFixed(digits));
  const clamp = (v: number) => Math.min(max, Math.max(min, round(v)));
</script>

<div class="stepper" role="group" aria-label={label}>
  <button type="button" class="icon small" aria-label="−" disabled={value <= min} onclick={() => (value = clamp(value - step))}>
    <Icon name="minus" size={18} />
  </button>
  <input
    type="number"
    inputmode={digits > 0 ? 'decimal' : 'numeric'}
    aria-label={label}
    {min}
    max={Number.isFinite(max) ? max : undefined}
    step={step}
    value={value}
    onchange={(e) => {
      const n = Number((e.currentTarget as HTMLInputElement).value.replace(',', '.'));
      value = Number.isFinite(n) ? clamp(n) : value;
      (e.currentTarget as HTMLInputElement).value = String(value);
    }}
  />
  <button type="button" class="icon small" aria-label="+" disabled={value >= max} onclick={() => (value = clamp(value + step))}>
    <Icon name="plus" size={18} />
  </button>
</div>

<style>
  .stepper {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex: none;
  }
  input {
    width: 4.2em;
    text-align: center;
    padding: 4px;
    min-height: 36px;
    -moz-appearance: textfield;
    appearance: textfield;
  }
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
</style>
