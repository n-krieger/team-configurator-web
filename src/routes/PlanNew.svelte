<script lang="ts">
  import { DEFAULT_WEIGHTS } from '../lib/algorithm/engine';
  import PlanSettingsForm from '../lib/components/PlanSettingsForm.svelte';
  import Stepper from '../lib/components/Stepper.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import { Cancelled, generate } from '../lib/generate.svelte';
  import { formatDate, formatNumber, t } from '../lib/i18n.svelte';
  import { createPlan, rosterProblems } from '../lib/plan';
  import { go, route } from '../lib/router.svelte';
  import { db, findPlan, findRoster, upsertPlan } from '../lib/store.svelte';
  import { showToast } from '../lib/toast.svelte';
  import type { PlanSettings } from '../lib/types';
  import { now } from '../lib/util';

  const rosters = $derived(db.rosters.filter((r) => r.players.length > 0));
  let rosterId = $state(route.query.get('roster') ?? db.rosters.find((r) => r.players.length > 0)?.id ?? '');
  const roster = $derived(findRoster(rosterId));

  let name = $state('');
  let nameTouched = $state(false);
  $effect(() => {
    if (!nameTouched && roster) name = `${roster.name || t('untitledRoster')} – ${formatDate(now())}`;
  });

  let nRounds = $state(4);
  let nTeams = $state(2);
  let settings: PlanSettings = $state({ weights: { ...DEFAULT_WEIGHTS }, restarts: 10, sameFitnessLimit: 10 });

  const problems = $derived(roster ? rosterProblems(roster) : undefined);
  const nPlayers = $derived(roster?.players.length ?? 0);
  const valid = $derived(!!roster && !!problems?.ok && nTeams <= nPlayers && name.trim() !== '');

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!roster || !valid) return;
    const plan = createPlan($state.snapshot(roster), name.trim(), nRounds, nTeams, settings);
    upsertPlan(plan);
    go(`/plan/${plan.id}`, { replace: true });
    try {
      await generate(findPlan(plan.id)!, plan.rounds.map((_, i) => i));
    } catch (error) {
      if (!(error instanceof Cancelled)) showToast(t('generateFailed', { msg: String(error) }), { error: true });
    }
  }
</script>

<main>
  {#if rosters.length === 0}
    <section class="card">
      <p>{t('needRoster')}</p>
      <a class="button primary" href="#/roster/new"><Icon name="plus" />{t('newRoster')}</a>
    </section>
  {:else}
    <form id="new-plan" class="stack" onsubmit={submit}>
      <section class="card">
        <label class="field">
          {t('roster')}
          <select bind:value={rosterId}>
            {#each rosters as r (r.id)}
              <option value={r.id}>{r.name || t('untitledRoster')} ({t('playersCount', { n: r.players.length })})</option>
            {/each}
          </select>
        </label>
        {#if problems && !problems.ok}
          <p class="notice error">
            {t('fixRosterFirst')} <a href="#/roster/{rosterId}">{roster?.name || t('untitledRoster')}</a>
          </p>
        {/if}
        <label class="field">
          {t('planName')}
          <input bind:value={name} oninput={() => (nameTouched = true)} autocomplete="off" />
        </label>
      </section>

      <section class="card">
        <div class="row">
          <span class="spacer">{t('rounds')}</span>
          <Stepper bind:value={nRounds} min={1} max={30} label={t('rounds')} />
        </div>
        <div class="row">
          <div class="spacer">
            <div>{t('teamsPerRound')}</div>
            {#if nPlayers > 0}
              <div class="muted small">{t('playersPerTeam', { n: formatNumber(nPlayers / nTeams, 1) })}</div>
            {/if}
          </div>
          <Stepper bind:value={nTeams} min={1} max={Math.max(1, nPlayers)} label={t('teamsPerRound')} />
        </div>
        {#if nTeams > nPlayers}<p class="notice error">{t('tooManyTeams')}</p>{/if}
        <p class="muted small">{t('attendanceLater')}</p>
      </section>

      <section class="card">
        <details>
          <summary>{t('advanced')}</summary>
          <div style="margin-top: 12px"><PlanSettingsForm bind:settings /></div>
        </details>
      </section>
    </form>
  {/if}
</main>

{#if rosters.length > 0}
  <div class="actionbar">
    <div>
      <button class="primary" type="submit" form="new-plan" disabled={!valid}>
        <Icon name="refresh" />{t('createAndGenerate')}
      </button>
    </div>
  </div>
{/if}
