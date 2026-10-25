<script lang="ts">
  import { t } from '../i18n.svelte';
  import { fitAttendance } from '../plan';
  import type { Plan } from '../types';
  import Dialog from './Dialog.svelte';
  import Icon from './Icon.svelte';
  import Stepper from './Stepper.svelte';

  let {
    open = $bindable(false),
    plan,
    index,
    onDelete,
  }: { open: boolean; plan: Plan; index: number; onDelete: () => void } = $props();

  let nTeams = $state(2);
  let present = $state<Record<string, boolean>>({});

  // load a fresh draft whenever the dialog opens
  $effect(() => {
    if (!open) return;
    const round = plan.rounds[index];
    if (!round) return;
    nTeams = round.nTeams;
    const absent = new Set(round.absent);
    present = Object.fromEntries(plan.roster.players.map((p) => [p.id, !absent.has(p.id)]));
  });

  const nPresent = $derived(Object.values(present).filter(Boolean).length);

  function setAll(value: boolean) {
    for (const id of Object.keys(present)) present[id] = value;
  }

  function save() {
    const round = plan.rounds[index];
    const absent = plan.roster.players.filter((p) => !present[p.id]).map((p) => p.id);
    const teamsChanged = round.nTeams !== nTeams;
    const attendanceChanged = absent.join() !== round.absent.join();
    if (teamsChanged || (attendanceChanged && round.teams.length === 0)) {
      round.nTeams = nTeams;
      round.absent = absent;
      round.teams = [];
      round.locked = false;
      round.adjusted = false;
    } else if (attendanceChanged) {
      fitAttendance(plan, round, absent);
    }
    if (teamsChanged || attendanceChanged) plan.updatedAt = new Date().toISOString();
    open = false;
  }
</script>

<Dialog bind:open title={t('round', { n: index + 1 })}>
  <div class="row">
    <span class="spacer">{t('teamsPerRound')}</span>
    <Stepper bind:value={nTeams} min={1} max={Math.max(1, nPresent)} label={t('teamsPerRound')} />
  </div>
  <div class="row">
    <strong class="spacer">{t('present')} ({nPresent}/{plan.roster.players.length})</strong>
    <button class="small" onclick={() => setAll(true)}>{t('all')}</button>
    <button class="small" onclick={() => setAll(false)}>{t('none')}</button>
  </div>
  <ul class="list">
    {#each plan.roster.players as player (player.id)}
      <li>
        <label class="row check">
          <input type="checkbox" bind:checked={present[player.id]} />
          <span class="ellipsis">{player.name}</span>
        </label>
      </li>
    {/each}
  </ul>
  {#if nTeams > nPresent}<p class="notice error">{t('tooManyTeams')}</p>{/if}
  {#if plan.rounds[index]?.teams.length}<p class="notice warn small">{t('roundChangeClears')}</p>{/if}
  <button class="danger" onclick={onDelete}><Icon name="trash" />{t('deleteRound')}</button>
  {#snippet footer()}
    <button onclick={() => (open = false)}>{t('cancel')}</button>
    <button class="primary" disabled={nTeams > nPresent} onclick={save}>{t('save')}</button>
  {/snippet}
</Dialog>

<style>
  .check {
    min-height: 44px;
    cursor: pointer;
  }
  .check input {
    width: 22px;
    min-height: 22px;
    height: 22px;
    flex: none;
    accent-color: var(--accent);
  }
</style>
