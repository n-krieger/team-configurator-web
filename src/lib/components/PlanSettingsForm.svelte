<script lang="ts">
  import { DEFAULT_WEIGHTS } from '../algorithm/engine';
  import { t, type MessageKey } from '../i18n.svelte';
  import type { PlanSettings } from '../types';
  import Stepper from './Stepper.svelte';

  let { settings = $bindable() }: { settings: PlanSettings } = $props();

  const weights: { key: 'a' | 'b' | 'c'; label: MessageKey; hint: MessageKey; step: number }[] = [
    { key: 'a', label: 'weightA', hint: 'weightAHint', step: 10 },
    { key: 'b', label: 'weightB', hint: 'weightBHint', step: 0.1 },
    { key: 'c', label: 'weightC', hint: 'weightCHint', step: 1 },
  ];

  function reset() {
    settings.weights = { ...DEFAULT_WEIGHTS };
    settings.restarts = 10;
    settings.sameFitnessLimit = 10;
  }
</script>

<div class="stack">
  <p class="muted small">{t('weightsHint')}</p>
  {#each weights as w (w.key)}
    <div class="row">
      <div class="spacer">
        <div>{t(w.label)}</div>
        <div class="muted small">{t(w.hint)}</div>
      </div>
      <Stepper bind:value={settings.weights[w.key]} min={-1000} max={1000} step={w.step} digits={2} label={t(w.label)} />
    </div>
  {/each}
  <div class="row">
    <div class="spacer">
      <div>{t('restarts')}</div>
      <div class="muted small">{t('restartsHint')}</div>
    </div>
    <Stepper bind:value={settings.restarts} min={0} max={100} label={t('restarts')} />
  </div>
  <div class="row">
    <div class="spacer">
      <div>{t('sameLimit')}</div>
      <div class="muted small">{t('sameLimitHint')}</div>
    </div>
    <Stepper bind:value={settings.sameFitnessLimit} min={1} max={200} label={t('sameLimit')} />
  </div>
  <button type="button" class="small" onclick={reset}>{t('resetDefaults')}</button>
</div>
