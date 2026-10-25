<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import Dialog from '../lib/components/Dialog.svelte';
  import ExportButtons from '../lib/components/ExportButtons.svelte';
  import Icon from '../lib/components/Icon.svelte';
  import { fileName, rosterToCsv } from '../lib/fileformat';
  import { t } from '../lib/i18n.svelte';
  import { exportOptions, presetPositions, rosterProblems, type PresetKind } from '../lib/plan';
  import { go } from '../lib/router.svelte';
  import { deleteRoster, upsertRoster } from '../lib/store.svelte';
  import { parseTextList } from '../lib/textlist';
  import type { Roster } from '../lib/types';
  import { clone, newId, now } from '../lib/util';

  let { roster }: { roster: Roster } = $props();

  const problems = $derived(rosterProblems(roster));

  // keep "changed" up to date without touching it on the first render
  let first = true;
  $effect(() => {
    JSON.stringify(roster.name) + JSON.stringify(roster.positions) + JSON.stringify(roster.players);
    if (first) first = false;
    else roster.updatedAt = now();
  });

  // a list that was created and left empty is discarded
  onDestroy(() => {
    if (!roster.name.trim() && roster.players.length === 0) deleteRoster(roster.id);
  });

  let newName = $state('');
  let newPosition = $state(untrack(() => roster.positions[0]?.id ?? ''));
  let nameInput: HTMLInputElement;

  function addPlayer(event: SubmitEvent) {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const position = roster.positions.some((p) => p.id === newPosition) ? newPosition : roster.positions[0].id;
    roster.players.push({ id: newId(), name, position, strength: 1 });
    newName = '';
    nameInput.focus();
  }

  function removePlayer(id: string) {
    roster.players = roster.players.filter((p) => p.id !== id);
  }

  function addPosition() {
    roster.positions.push({ id: newId(), label: '' });
  }

  function movePosition(index: number, delta: number) {
    const [p] = roster.positions.splice(index, 1);
    roster.positions.splice(index + delta, 0, p);
  }

  function removePosition(index: number) {
    const [removed] = roster.positions.splice(index, 1);
    for (const player of roster.players) {
      if (player.position === removed.id) player.position = roster.positions[0].id;
    }
  }

  function applyPreset(kind: PresetKind) {
    if (roster.players.length > 0 && !confirm(t('applyPresetConfirm'))) return;
    const old = roster.positions.map((p) => p.id);
    const positions = presetPositions(kind);
    for (const player of roster.players) {
      const i = Math.min(Math.max(0, old.indexOf(player.position)), positions.length - 1);
      player.position = positions[i].id;
    }
    roster.positions = positions;
    newPosition = positions[0].id;
  }

  let pasteOpen = $state(false);
  let pasteText = $state('');
  const pasted = $derived(parseTextList(pasteText, roster.positions));

  function addPasted() {
    for (const line of pasted) {
      roster.players.push({
        id: newId(),
        name: line.name,
        position: line.position ?? roster.positions[0].id,
        strength: line.strength ?? 1,
      });
    }
    pasteText = '';
    pasteOpen = false;
  }

  function duplicateRoster() {
    const copy = clone(roster);
    copy.id = newId();
    copy.name = `${roster.name || t('untitledRoster')} (${t('copySuffix')})`;
    copy.updatedAt = now();
    upsertRoster(copy);
    go(`/roster/${copy.id}`);
  }

  function remove() {
    if (!confirm(t('deleteRosterConfirm', { name: roster.name || t('untitledRoster') }))) return;
    deleteRoster(roster.id);
    go('/');
  }
</script>

<main>
  <section class="card">
    <label class="field">
      {t('rosterName')}
      <input bind:value={roster.name} placeholder={t('rosterNamePlaceholder')} autocomplete="off" />
    </label>
  </section>

  <section class="card">
    <details>
      <summary>
        <span>{t('positions')}</span>
        <span class="muted small ellipsis">{roster.positions.map((p) => p.label).join(' · ')}</span>
      </summary>
      <div class="stack" style="margin-top: 12px">
        <p class="muted small">{t('positionsHint')}</p>
        {#each roster.positions as position, i (position.id)}
          <div class="row">
            <span class="dot" style="--c: var(--pos-{i % 6})"></span>
            <input
              bind:value={position.label}
              aria-label={t('positionLabel')}
              class:invalid={!position.label.trim() || problems.isDuplicatePosition(position)}
              title={problems.isDuplicatePosition(position) ? t('duplicatePosition') : undefined}
            />
            <button class="icon small ghost" aria-label={t('moveUp')} disabled={i === 0} onclick={() => movePosition(i, -1)}>
              <Icon name="up" />
            </button>
            <button
              class="icon small ghost"
              aria-label={t('moveDown')}
              disabled={i === roster.positions.length - 1}
              onclick={() => movePosition(i, 1)}
            >
              <Icon name="down" />
            </button>
            <button
              class="icon small ghost danger"
              aria-label={t('remove')}
              disabled={roster.positions.length === 1}
              onclick={() => removePosition(i)}
            >
              <Icon name="trash" />
            </button>
          </div>
        {/each}
        <button class="small" onclick={addPosition}><Icon name="plus" size={18} />{t('addPosition')}</button>
        <div class="muted small">{t('presets')}</div>
        <div class="row wrap">
          <button class="small" onclick={() => applyPreset('three')}>{t('presetThree')}</button>
          <button class="small" onclick={() => applyPreset('two')}>{t('presetTwo')}</button>
          <button class="small" onclick={() => applyPreset('none')}>{t('presetNone')}</button>
        </div>
      </div>
    </details>
  </section>

  <section class="card">
    <div class="row">
      <h2 class="spacer">{t('players')} <span class="muted">({roster.players.length})</span></h2>
      <button class="small" onclick={() => (pasteOpen = true)}><Icon name="clipboard" size={18} />{t('pasteList')}</button>
    </div>
    <p class="muted small">{t('strengthHint')}</p>

    {#if roster.players.length === 0}
      <p class="muted">{t('noPlayersYet')}</p>
    {:else}
      <div class="players" class:single={roster.positions.length === 1}>
        <span class="muted small">{t('playerName')}</span>
        {#if roster.positions.length > 1}<span class="muted small">{t('positionLabel')}</span>{/if}
        <span class="muted small">{t('strength')}</span>
        <span></span>
        {#each roster.players as player (player.id)}
          {@const invalid = problems.isEmpty(player) || problems.isDuplicate(player)}
          <input
            bind:value={player.name}
            aria-label={t('playerName')}
            class:invalid
            title={problems.isEmpty(player) ? t('emptyName') : problems.isDuplicate(player) ? t('duplicateName') : undefined}
            autocomplete="off"
          />
          {#if roster.positions.length > 1}
            <select bind:value={player.position} aria-label={t('positionLabel')}>
              {#each roster.positions as position (position.id)}
                <option value={position.id}>{position.label}</option>
              {/each}
            </select>
          {/if}
          <input
            type="number"
            inputmode="decimal"
            step="0.1"
            min="0"
            aria-label={t('strength')}
            value={player.strength}
            onchange={(e) => {
              const n = Number(e.currentTarget.value.replace(',', '.'));
              if (Number.isFinite(n) && n >= 0) player.strength = n;
              else e.currentTarget.value = String(player.strength);
            }}
          />
          <button class="icon small ghost danger" aria-label={t('remove')} onclick={() => removePlayer(player.id)}>
            <Icon name="trash" />
          </button>
        {/each}
      </div>
      {#if !problems.ok}
        <p class="notice error">{t('fixRosterFirst')}</p>
      {/if}
    {/if}

    <form class="row" onsubmit={addPlayer}>
      <input bind:this={nameInput} bind:value={newName} placeholder={t('addPlayer')} aria-label={t('addPlayer')} enterkeyhint="done" autocomplete="off" />
      {#if roster.positions.length > 1}
        <select bind:value={newPosition} aria-label={t('positionLabel')} class="new-position">
          {#each roster.positions as position (position.id)}
            <option value={position.id}>{position.label}</option>
          {/each}
        </select>
      {/if}
      <button class="icon primary" type="submit" aria-label={t('addPlayer')} disabled={!newName.trim()}>
        <Icon name="plus" />
      </button>
    </form>
  </section>

  <section class="card">
    <div class="row wrap">
      <ExportButtons
        filename={fileName(roster.name, 'roster')}
        title={roster.name}
        content={() => rosterToCsv($state.snapshot(roster), exportOptions())}
      />
      <button onclick={duplicateRoster}><Icon name="copy" />{t('duplicate')}</button>
      <button class="danger" onclick={remove}><Icon name="trash" />{t('delete')}</button>
    </div>
  </section>
</main>

<div class="actionbar">
  <div>
    <a class="button primary" class:disabled={roster.players.length === 0} href="#/plan/new?roster={roster.id}">
      <Icon name="grid" />{t('createPlan')}
    </a>
  </div>
</div>

<Dialog bind:open={pasteOpen} title={t('pasteList')}>
  <p class="muted small">{t('pasteHint')}</p>
  <textarea bind:value={pasteText} placeholder={'Anna\nBen\n…'}></textarea>
  {#snippet footer()}
    <button onclick={() => (pasteOpen = false)}>{t('cancel')}</button>
    <button class="primary" disabled={pasted.length === 0} onclick={addPasted}>{t('pasteAdd', { n: pasted.length })}</button>
  {/snippet}
</Dialog>

<style>
  summary .muted {
    font-weight: 400;
    min-width: 0;
  }
  .dot {
    flex: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--c);
  }
  .players {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 7.5em) 4em 36px;
    gap: 6px;
    align-items: center;
  }
  .players.single {
    grid-template-columns: minmax(0, 1fr) 4em 36px;
  }
  .players input,
  .players select {
    min-height: 40px;
    padding: 6px 8px;
  }
  .players select {
    padding-right: 4px;
  }
  .new-position {
    width: 8em;
    flex: none;
  }
  .button.disabled {
    pointer-events: none;
    opacity: 0.5;
  }
</style>
