<script lang="ts">
  import Icon from '../lib/components/Icon.svelte';
  import { ImportError, parseImport, type ImportErrorCode, type Imported } from '../lib/fileformat';
  import { formatDate, t, type MessageKey } from '../lib/i18n.svelte';
  import { go } from '../lib/router.svelte';
  import { findPlan, findRoster, upsertPlan, upsertRoster } from '../lib/store.svelte';
  import { showToast } from '../lib/toast.svelte';
  import { newId, now } from '../lib/util';

  const errorKeys: Record<ImportErrorCode, MessageKey> = {
    empty: 'errEmpty',
    unknownFormat: 'errUnknownFormat',
    newerVersion: 'errNewerVersion',
    noPlayers: 'errNoPlayers',
    unknownPlayer: 'errUnknownPlayer',
    invalidRound: 'errInvalidRound',
  };

  let imported = $state<Imported | undefined>();
  let error = $state('');
  let pasteText = $state('');
  let alsoSaveRoster = $state(true);

  function read(text: string, sourceName = '') {
    error = '';
    imported = undefined;
    try {
      const result = parseImport(text);
      if (result.kind === 'roster' && !result.roster.name) {
        result.roster.name = sourceName.replace(/(\.players)?\.(csv|txt)$/i, '') || t('importedName');
      }
      imported = result;
      alsoSaveRoster = result.kind === 'plan' && !findRoster(result.plan.roster.id);
    } catch (e) {
      error = e instanceof ImportError ? t(errorKeys[e.code], { d: e.detail }) : t('errRead');
    }
  }

  async function onFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      read(await file.text(), file.name);
    } catch {
      error = t('errRead');
    }
  }

  const existing = $derived(
    imported?.kind === 'roster'
      ? findRoster(imported.roster.id)
      : imported?.kind === 'plan'
        ? findPlan(imported.plan.id)
        : undefined,
  );
  const fileDate = $derived(
    imported?.kind === 'roster' ? imported.roster.updatedAt : imported?.kind === 'plan' ? imported.plan.updatedAt : '',
  );

  function save(asNew: boolean) {
    if (!imported) return;
    const data = $state.snapshot(imported);
    if (data.kind === 'roster') {
      if (asNew) Object.assign(data.roster, { id: newId(), updatedAt: now() });
      upsertRoster(data.roster);
      showToast(t('importedRoster'));
      go(`/roster/${data.roster.id}`);
    } else {
      if (asNew) Object.assign(data.plan, { id: newId(), updatedAt: now() });
      if (alsoSaveRoster && !findRoster(data.plan.roster.id)) upsertRoster(structuredClone(data.plan.roster));
      upsertPlan(data.plan);
      showToast(t('importedPlan'));
      go(`/plan/${data.plan.id}`);
    }
  }
</script>

<main>
  <section class="card">
    <label class="button primary file">
      <Icon name="upload" />{t('chooseFile')}
      <input type="file" accept=".csv,.txt,text/csv,text/plain" class="visually-hidden" onchange={onFile} />
    </label>
    <details>
      <summary>{t('orPaste')}</summary>
      <div class="stack" style="margin-top: 8px">
        <textarea bind:value={pasteText} placeholder={t('pastePlaceholder')}></textarea>
        <button disabled={!pasteText.trim()} onclick={() => read(pasteText)}>{t('readText')}</button>
      </div>
    </details>
  </section>

  {#if error}
    <p class="notice error" role="alert">{error}</p>
  {/if}

  {#if imported}
    <section class="card" aria-live="polite">
      {#if imported.kind === 'roster'}
        <h2>{t('previewRoster', { name: imported.roster.name })}</h2>
        <p class="muted small">
          {t('playersCount', { n: imported.roster.players.length })} · {imported.roster.positions.map((p) => p.label).join(' · ')}
        </p>
        <p class="small names">{imported.roster.players.map((p) => p.name).join(', ')}</p>
      {:else}
        <h2>{t('previewPlan', { name: imported.plan.name })}</h2>
        <p class="muted small">
          {t('roundsCount', { n: imported.plan.rounds.length })} · {t('playersCount', { n: imported.plan.roster.players.length })}
        </p>
        {#if !findRoster(imported.plan.roster.id)}
          <label class="row check">
            <input type="checkbox" bind:checked={alsoSaveRoster} />
            {t('alsoSaveRoster')}
          </label>
        {/if}
      {/if}

      {#if existing}
        <p class="notice warn small">
          {t('existsHint', { date: formatDate(existing.updatedAt), fileDate: formatDate(fileDate) })}
        </p>
        <button class="primary" onclick={() => save(false)}>{t('replaceExisting')}</button>
        <button onclick={() => save(true)}>{t('saveAsNew')}</button>
      {:else}
        <button class="primary" onclick={() => save(false)}>{t('save')}</button>
      {/if}
    </section>
  {/if}

  <section class="card">
    <h2>{t('importHelpTitle')}</h2>
    <ul class="help muted small">
      <li>{t('importHelpIos')}</li>
      <li>{t('importHelpAndroid')}</li>
      <li>{t('importHelpSpreadsheet')}</li>
    </ul>
  </section>
</main>

<style>
  .file {
    cursor: pointer;
  }
  .names {
    overflow-wrap: anywhere;
  }
  .check {
    min-height: 44px;
  }
  .check input {
    width: 22px;
    height: 22px;
    min-height: 22px;
    flex: none;
    accent-color: var(--accent);
  }
  .help {
    margin: 0;
    padding-left: 1.2em;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
</style>
