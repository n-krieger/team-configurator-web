<script lang="ts">
  import { LANGUAGES, locale, setLang, t, type Lang } from '../lib/i18n.svelte';
  import { go } from '../lib/router.svelte';
  import { deleteAll, storageStatus } from '../lib/store.svelte';

  function removeAll() {
    if (!confirm(t('deleteAllConfirm'))) return;
    deleteAll();
    go('/');
  }
</script>

<main>
  <section class="card">
    <h2>{t('language')}</h2>
    <div class="row wrap" role="radiogroup" aria-label={t('language')}>
      {#each Object.entries(LANGUAGES) as [code, name] (code)}
        <button
          role="radio"
          aria-checked={locale.lang === code}
          class:primary={locale.lang === code}
          onclick={() => setLang(code as Lang)}
        >
          {name}
        </button>
      {/each}
    </div>
  </section>

  <section class="card">
    <h2>{t('privacy')}</h2>
    <p class="small">{t('privacyText')}</p>
  </section>

  <section class="card">
    <h2>{t('storage')}</h2>
    <p class="small" class:notice={!storageStatus.persisted} class:warn={!storageStatus.persisted}>
      {storageStatus.persisted ? t('storagePersisted') : t('storageNotPersisted')}
    </p>
  </section>

  <section class="card">
    <h2>{t('install')}</h2>
    <p class="small">{t('installText')}</p>
  </section>

  <section class="card">
    <h2>{t('about')}</h2>
    <p class="small muted">{t('aboutText')}</p>
    <p class="small muted">v{__APP_VERSION__}</p>
    <button class="danger" onclick={removeAll}>{t('deleteAll')}</button>
  </section>
</main>
