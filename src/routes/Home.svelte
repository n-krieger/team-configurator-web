<script lang="ts">
  import Icon from '../lib/components/Icon.svelte';
  import { formatDate, t } from '../lib/i18n.svelte';
  import { db } from '../lib/store.svelte';

  const byDate = <T extends { updatedAt: string }>(items: T[]) =>
    [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
</script>

<main>
  {#if db.rosters.length === 0 && db.plans.length === 0}
    <section class="card welcome">
      <h2>{t('welcomeTitle')}</h2>
      <p class="muted">{t('welcomeText')}</p>
      <a class="button primary" href="#/roster/new"><Icon name="plus" />{t('newRoster')}</a>
      <a class="button" href="#/import"><Icon name="upload" />{t('welcomeImport')}</a>
    </section>
  {:else}
    <section class="card">
      <div class="row">
        <h2 class="spacer">{t('plans')}</h2>
        <a class="button small primary" href="#/plan/new"><Icon name="plus" size={18} />{t('newPlan')}</a>
      </div>
      {#if db.plans.length > 0}
        <ul class="list">
          {#each byDate(db.plans) as plan (plan.id)}
            <li>
              <a class="list-link" href="#/plan/{plan.id}">
                <Icon name="grid" />
                <div class="grow">
                  <div class="ellipsis">{plan.name}</div>
                  <div class="muted small ellipsis">
                    {t('roundsCount', { n: plan.rounds.length })} · {t('playersCount', { n: plan.roster.players.length })}
                    · {t('updated', { date: formatDate(plan.updatedAt) })}
                  </div>
                </div>
                <Icon name="chevron" />
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="card">
      <div class="row">
        <h2 class="spacer">{t('rosters')}</h2>
        <a class="button small" href="#/roster/new"><Icon name="plus" size={18} />{t('newRoster')}</a>
      </div>
      {#if db.rosters.length > 0}
        <ul class="list">
          {#each byDate(db.rosters) as roster (roster.id)}
            <li>
              <a class="list-link" href="#/roster/{roster.id}">
                <Icon name="users" />
                <div class="grow">
                  <div class="ellipsis">{roster.name || t('untitledRoster')}</div>
                  <div class="muted small ellipsis">
                    {t('playersCount', { n: roster.players.length })} · {t('updated', { date: formatDate(roster.updatedAt) })}
                  </div>
                </div>
                <Icon name="chevron" />
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <a class="button" href="#/import"><Icon name="upload" />{t('import')}</a>
  {/if}
</main>

<style>
  .welcome .button {
    white-space: normal;
    text-align: center;
    padding: 8px 14px;
  }
</style>
