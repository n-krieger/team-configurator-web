<script lang="ts">
  import { untrack } from 'svelte';
  import Dialog from '../lib/components/Dialog.svelte';
  import ExportButtons from '../lib/components/ExportButtons.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import PairOverview from '../lib/components/PairOverview.svelte';
  import PlanSettingsForm from '../lib/components/PlanSettingsForm.svelte';
  import RoundCard from '../lib/components/RoundCard.svelte';
  import RoundEditor from '../lib/components/RoundEditor.svelte';
  import { fileName, planToCsv } from '../lib/fileformat';
  import { Cancelled, generate } from '../lib/generate.svelte';
  import { formatNumber, t } from '../lib/i18n.svelte';
  import {
    attendees,
    exportOptions,
    isGenerated,
    newRound,
    pairsByCount,
    planStats,
    planText,
    playerMap,
    syncFromRoster,
  } from '../lib/plan';
  import { go } from '../lib/router.svelte';
  import { deletePlan, findRoster } from '../lib/store.svelte';
  import { shareText } from '../lib/share';
  import { showToast } from '../lib/toast.svelte';
  import type { Plan, PlanSettings } from '../lib/types';
  import { clone, now } from '../lib/util';

  let { plan }: { plan: Plan } = $props();

  const stats = $derived(planStats(plan));
  /** Summary lines: never together (k = 0) and repeated pairs (k ≥ 2); pairs are named when there are at most 3. */
  const pairLines = $derived.by(() => {
    if (!stats) return [];
    return [...pairsByCount(plan)]
      .filter(([k]) => k !== 1)
      .sort((a, b) => a[0] - b[0])
      .map(([k, pairs]) => ({
        k,
        text: k === 0 ? t('statsMissing', { n: pairs.length }) : t('statsRepeated', { n: pairs.length, k }),
        names: pairs.length <= 3 ? pairs.map(([a, b]) => `${a.name} & ${b.name}`).join(', ') : '',
      }));
  });
  const openRounds = $derived(plan.rounds.flatMap((r, i) => (r.locked ? [] : [i])));
  const adjustedRounds = $derived(plan.rounds.flatMap((r, i) => (r.adjusted && !r.locked ? [i] : [])));
  const anyGenerated = $derived(plan.rounds.some(isGenerated));

  // ---- generating

  async function run(targets: number[], { fromCurrent = false } = {}) {
    for (const i of targets) {
      const round = plan.rounds[i];
      if (round.nTeams > attendees(plan, round).length) {
        showToast(`${t('round', { n: i + 1 })}: ${t('tooManyTeams')}`, { error: true });
        return;
      }
    }
    selected = undefined;
    try {
      await generate(plan, targets, { fromCurrent });
    } catch (error) {
      if (!(error instanceof Cancelled)) {
        showToast(t('generateFailed', { msg: error instanceof Error ? error.message : String(error) }), { error: true });
      }
    }
  }

  function generateAll() {
    if (openRounds.length === 0) {
      showToast(t('nothingToGenerate'));
      return;
    }
    const replaced = openRounds.filter((i) => isGenerated(plan.rounds[i])).length;
    if (replaced > 0 && !confirm(t('regenerateConfirm', { n: openRounds.length }))) return;
    run(openRounds);
  }

  function optimiseAll() {
    if (openRounds.length === 0) {
      showToast(t('nothingToGenerate'));
      return;
    }
    run(openRounds, { fromCurrent: true });
  }

  // ---- manual swaps: tap one player, then a player in another team of the same round

  let selected = $state<{ round: number; id: string } | undefined>();

  function onPlayer(roundIndex: number, id: string) {
    const teams = plan.rounds[roundIndex].teams;
    const teamOf = (pid: string) => teams.findIndex((team) => team.includes(pid));
    if (!selected || selected.round !== roundIndex || selected.id === id || teamOf(selected.id) === teamOf(id)) {
      selected = selected?.id === id ? undefined : { round: roundIndex, id };
      return;
    }
    const a = selected.id;
    const ta = teams[teamOf(a)];
    const tb = teams[teamOf(id)];
    ta[ta.indexOf(a)] = id;
    tb[tb.indexOf(id)] = a;
    plan.updatedAt = now();
    selected = undefined;
    const names = playerMap(plan);
    showToast(t('swapped', { a: names.get(a)?.name ?? '?', b: names.get(id)?.name ?? '?' }));
  }

  const selectedName = $derived(selected ? playerMap(plan).get(selected.id)?.name : undefined);

  // ---- rounds

  let editorOpen = $state(false);
  let editorIndex = $state(0);

  function editRound(i: number) {
    editorIndex = i;
    editorOpen = true;
  }

  function addRound() {
    const last = plan.rounds[plan.rounds.length - 1];
    plan.rounds.push(newRound(last?.nTeams ?? 2));
    plan.updatedAt = now();
    editRound(plan.rounds.length - 1);
  }

  function deleteRound(i: number) {
    if (!confirm(t('deleteRoundConfirm', { n: i + 1 }))) return;
    editorOpen = false;
    selected = undefined;
    plan.rounds.splice(i, 1);
    plan.updatedAt = now();
  }

  // ---- plan actions

  let shareOpen = $state(false);
  let pairsOpen = $state(false);
  let settingsOpen = $state(false);
  let draftName = $state('');
  let draftSettings = $state<PlanSettings>(untrack(() => clone(plan.settings)));

  function openSettings() {
    draftName = plan.name;
    draftSettings = clone($state.snapshot(plan.settings));
    settingsOpen = true;
  }

  function saveSettings() {
    plan.name = draftName.trim() || plan.name;
    plan.settings = clone($state.snapshot(draftSettings));
    plan.updatedAt = now();
    settingsOpen = false;
  }

  function sync() {
    const roster = findRoster(plan.roster.id);
    if (!roster) {
      showToast(t('syncMissing'));
      return;
    }
    const n = syncFromRoster(plan, $state.snapshot(roster));
    showToast(n > 0 ? t('syncDone', { n }) : t('syncNone', { name: roster.name || t('untitledRoster') }));
  }

  async function sendText() {
    shareOpen = false;
    try {
      if ((await shareText(planText($state.snapshot(plan)))) === 'copied') showToast(t('copied'));
    } catch {
      showToast(t('shareFailed'), { error: true });
    }
  }

  function remove() {
    if (!confirm(t('deletePlanConfirm', { name: plan.name }))) return;
    deletePlan(plan.id);
    go('/');
  }
</script>

<main>
  <header class="stack">
    <h1 class="title">{plan.name}</h1>
    <p class="muted small">
      {plan.roster.name || t('untitledRoster')} · {t('playersCount', { n: plan.roster.players.length })} ·
      {t('roundsCount', { n: plan.rounds.length })}
    </p>
  </header>

  {#if stats}
    <section class="card">
      <div class="row">
        <h2 class="spacer">{t('pairings')}</h2>
        <span class="muted small">{t('score')} {formatNumber(stats.fitness, 1)}</span>
      </div>
      <div class="meter" role="presentation">
        <div style="width: {stats.totalPairs ? (100 * stats.uniquePairs) / stats.totalPairs : 0}%"></div>
      </div>
      <p>{t('statsPlayed', { u: stats.uniquePairs, t: stats.totalPairs })}</p>
      <ul class="facts muted small">
        {#each pairLines as line (line.k)}
          <li>{line.text}{#if line.names}: <span class="pairs">{line.names}</span>{/if}</li>
        {/each}
      </ul>
      <button class="small" onclick={() => (pairsOpen = true)}><Icon name="users" size={18} />{t('whoWithWhom')}</button>
    </section>
  {/if}

  {#if adjustedRounds.length > 0}
    <section class="notice warn stack">
      <p>{t('adjustedNotice', { rounds: adjustedRounds.map((i) => t('round', { n: i + 1 })).join(', ') })}</p>
      <button class="primary" onclick={optimiseAll}><Icon name="refresh" />{t('optimiseAll')}</button>
    </section>
  {/if}

  {#if selectedName}
    <p class="notice swap-hint">{t('swapHint', { name: selectedName })}</p>
  {/if}

  {#each plan.rounds as round, i (round)}
    <RoundCard
      {plan}
      {round}
      index={i}
      selected={selected?.round === i ? selected.id : undefined}
      onPlayer={(id) => onPlayer(i, id)}
      onEdit={() => editRound(i)}
      onGenerate={() => run([i])}
    />
  {/each}

  <section class="card">
    <div class="row wrap">
      <button onclick={optimiseAll} disabled={!anyGenerated}><Icon name="refresh" />{t('optimiseAll')}</button>
      <button onclick={addRound}><Icon name="plus" />{t('addRound')}</button>
      <button onclick={openSettings}><Icon name="settings" />{t('planSettings')}</button>
      <button onclick={sync}><Icon name="users" />{t('syncRoster')}</button>
      <button class="danger" onclick={remove}><Icon name="trash" />{t('delete')}</button>
    </div>
    <p class="muted small">{t('optimiseAllHint')}</p>
  </section>
</main>

<div class="actionbar">
  <div>
    <button class="primary" onclick={generateAll} disabled={plan.rounds.length === 0}>
      <Icon name="refresh" />{anyGenerated ? t('regenerate') : t('generate')}
    </button>
    <button onclick={() => (shareOpen = true)}><Icon name="share" />{t('shareFile')}</button>
  </div>
</div>

{#if plan.rounds[editorIndex]}
  <RoundEditor bind:open={editorOpen} {plan} index={editorIndex} onDelete={() => deleteRound(editorIndex)} />
{/if}

<Dialog bind:open={shareOpen} title={t('shareFile')}>
  <div class="stack">
    <ExportButtons
      filename={fileName(plan.name, 'plan')}
      title={plan.name}
      content={() => planToCsv($state.snapshot(plan), exportOptions())}
    />
    <button onclick={sendText}><Icon name="text" />{t('shareText')}</button>
  </div>
</Dialog>

<Dialog bind:open={pairsOpen} title={t('whoWithWhom')}>
  <PairOverview {plan} />
</Dialog>

<Dialog bind:open={settingsOpen} title={t('planSettings')}>
  <label class="field">
    {t('planName')}
    <input bind:value={draftName} autocomplete="off" />
  </label>
  <PlanSettingsForm bind:settings={draftSettings} />
  {#snippet footer()}
    <button onclick={() => (settingsOpen = false)}>{t('cancel')}</button>
    <button class="primary" onclick={saveSettings}>{t('save')}</button>
  {/snippet}
</Dialog>

<style>
  .title {
    font-size: 1.4rem;
    overflow-wrap: anywhere;
  }
  .meter {
    height: 8px;
    border-radius: 4px;
    background: var(--surface-2);
    overflow: hidden;
  }
  .meter > div {
    height: 100%;
    background: var(--ok);
  }
  .facts {
    margin: 0;
    padding-left: 1.2em;
  }
  .pairs {
    color: var(--text);
  }
  .swap-hint {
    position: sticky;
    top: 64px;
    z-index: 5;
    box-shadow: var(--shadow);
  }
</style>
