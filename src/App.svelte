<script lang="ts">
  import Icon from './lib/components/Icon.svelte';
  import { cancelGeneration, generation } from './lib/generate.svelte';
  import { t } from './lib/i18n.svelte';
  import { newRoster } from './lib/plan';
  import { go, route } from './lib/router.svelte';
  import { findPlan, findRoster, upsertRoster } from './lib/store.svelte';
  import { toast } from './lib/toast.svelte';
  import Home from './routes/Home.svelte';
  import ImportView from './routes/ImportView.svelte';
  import PlanNew from './routes/PlanNew.svelte';
  import PlanView from './routes/PlanView.svelte';
  import RosterEdit from './routes/RosterEdit.svelte';
  import Settings from './routes/Settings.svelte';

  const page = $derived.by(() => {
    const [section, id] = route.path;
    if (section === 'roster' && id && id !== 'new') {
      const roster = findRoster(id);
      if (roster) return { name: 'roster' as const, roster, title: roster.name || t('newRoster') };
    }
    if (section === 'plan' && id === 'new') return { name: 'planNew' as const, title: t('newPlan') };
    if (section === 'plan' && id) {
      const plan = findPlan(id);
      if (plan) return { name: 'plan' as const, plan, title: t('plans') };
    }
    if (section === 'import') return { name: 'import' as const, title: t('import') };
    if (section === 'settings') return { name: 'settings' as const, title: t('settings') };
    return { name: 'home' as const, title: t('appName') };
  });

  $effect(() => {
    const [section, id] = route.path;
    if (section === 'roster' && id === 'new') {
      const roster = newRoster();
      upsertRoster(roster);
      go(`/roster/${roster.id}`, { replace: true });
    }
  });

  $effect(() => {
    document.title = page.name === 'home' ? t('appName') : `${page.title} · ${t('appName')}`;
  });
</script>

<header class="topbar">
  <div class="row">
    {#if page.name !== 'home'}
      <a class="button icon ghost" href="#/" aria-label={t('back')}><Icon name="back" /></a>
    {/if}
    <h1 class="spacer ellipsis">{page.title}</h1>
    {#if page.name !== 'settings'}
      <a class="button icon ghost" href="#/settings" aria-label={t('settings')}><Icon name="settings" /></a>
    {/if}
  </div>
</header>

{#if page.name === 'roster'}
  {#key page.roster.id}<RosterEdit roster={page.roster} />{/key}
{:else if page.name === 'plan'}
  {#key page.plan.id}<PlanView plan={page.plan} />{/key}
{:else if page.name === 'planNew'}
  <PlanNew />
{:else if page.name === 'import'}
  <ImportView />
{:else if page.name === 'settings'}
  <Settings />
{:else}
  <Home />
{/if}

{#if generation.running}
  <div class="overlay" role="alertdialog" aria-modal="true" aria-labelledby="gen-title">
    <div class="card">
      <div class="spinner" aria-hidden="true"></div>
      <h2 id="gen-title">{t('generating')}</h2>
      {#if generation.runs > 1}
        <p class="muted small">{t('runOf', { r: Math.min(generation.run + 1, generation.runs), n: generation.runs })}</p>
        <div class="bar"><div style="width: {(100 * generation.run) / generation.runs}%"></div></div>
      {/if}
      <button onclick={cancelGeneration}>{t('cancel')}</button>
    </div>
  </div>
{/if}

{#if toast.message}
  {#key toast.id}
    <div class="toast" class:error={toast.error} role="status">{toast.message}</div>
  {/key}
{/if}

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    background: color-mix(in srgb, var(--bg) 90%, transparent);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
    padding: env(safe-area-inset-top) 8px 0;
  }
  .topbar > .row {
    max-width: 960px;
    margin: 0 auto;
    min-height: 56px;
  }
  .topbar h1 {
    font-size: 1.1rem;
    padding: 0 8px;
  }
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: rgb(0 0 0 / 0.45);
    display: grid;
    place-items: center;
    padding: 16px;
  }
  .overlay .card {
    width: min(360px, 100%);
    align-items: center;
    text-align: center;
  }
  .overlay button {
    align-self: stretch;
  }
  .bar {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--surface-2);
    overflow: hidden;
  }
  .bar > div {
    height: 100%;
    background: var(--accent);
    transition: width 0.2s;
  }
  .spinner {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 4px solid var(--surface-2);
    border-top-color: var(--accent);
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(84px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    z-index: 60;
    max-width: calc(100vw - 32px);
    background: var(--text);
    color: var(--bg);
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 0.9rem;
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.2);
  }
  .toast.error {
    background: var(--danger);
    color: #fff;
  }
</style>
