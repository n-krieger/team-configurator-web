<script lang="ts">
  import { t } from '../i18n.svelte';
  import { pairCounts } from '../plan';
  import type { Plan } from '../types';

  let { plan }: { plan: Plan } = $props();

  // for every participant: team mates grouped by how often they played together
  const rows = $derived.by(() => {
    const { participants, count } = pairCounts(plan);
    return participants
      .map((player) => {
        const groups = new Map<number, string[]>();
        for (const other of participants) {
          if (other.id === player.id) continue;
          const k = count(player.id, other.id);
          if (!groups.has(k)) groups.set(k, []);
          groups.get(k)!.push(other.name);
        }
        return { player, never: groups.get(0)?.length ?? 0, groups: [...groups].sort((a, b) => a[0] - b[0]) };
      })
      .sort((a, b) => b.never - a.never || a.player.name.localeCompare(b.player.name));
  });

  let expanded = $state<string | undefined>();
</script>

<ul class="list">
  {#each rows as row (row.player.id)}
    <li>
      <button
        class="ghost head"
        aria-expanded={expanded === row.player.id}
        onclick={() => (expanded = expanded === row.player.id ? undefined : row.player.id)}
      >
        <span class="ellipsis spacer">{row.player.name}</span>
        {#if row.never > 0}
          <span class="badge">{t('neverCount', { n: row.never })}</span>
        {:else}
          <span class="badge ok">✓</span>
        {/if}
      </button>
      {#if expanded === row.player.id}
        <dl>
          {#if row.never === 0}
            <dd class="muted">{t('playedWithAll')}</dd>
          {/if}
          {#each row.groups as [k, names] (k)}
            <dt class:never={k === 0}>{k === 0 ? t('neverWith') : t('togetherWith', { k })}</dt>
            <dd>{names.join(', ')}</dd>
          {/each}
        </dl>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .head {
    width: 100%;
    justify-content: flex-start;
    padding: 0 4px;
    font-weight: 500;
    text-align: left;
  }
  .badge {
    flex: none;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--warn-soft);
    color: var(--warn);
  }
  .badge.ok {
    background: transparent;
    color: var(--ok);
  }
  dl {
    margin: 0 4px 12px;
    font-size: 0.9rem;
  }
  dt {
    font-weight: 600;
    margin-top: 6px;
  }
  dt.never {
    color: var(--warn);
  }
  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
</style>
