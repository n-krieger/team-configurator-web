<script lang="ts">
  import { formatNumber, t } from '../i18n.svelte';
  import { attendees, isGenerated, playerMap, teamStrength } from '../plan';
  import type { Plan, Round } from '../types';
  import Icon from './Icon.svelte';
  import PositionChip from './PositionChip.svelte';

  let {
    plan,
    round,
    index,
    selected,
    onPlayer,
    onEdit,
    onGenerate,
  }: {
    plan: Plan;
    round: Round;
    index: number;
    selected: string | undefined;
    onPlayer: (playerId: string) => void;
    onEdit: () => void;
    onGenerate: () => void;
  } = $props();

  const players = $derived(playerMap(plan));
  const positionIndex = $derived(new Map(plan.roster.positions.map((p, i) => [p.id, i])));
  const present = $derived(attendees(plan, round).length);
  const absentNames = $derived(round.absent.map((id) => players.get(id)?.name).filter(Boolean).join(', '));
</script>

<section class="card" class:locked={round.locked}>
  <div class="row">
    <div class="spacer">
      <h2>{t('round', { n: index + 1 })}</h2>
      <div class="muted small">
        {t('teamsCount', { n: round.nTeams })} · {t('attending', { n: present, m: plan.roster.players.length })}
      </div>
    </div>
    {#if isGenerated(round)}
      <button
        class="small"
        class:primary={round.locked}
        aria-pressed={round.locked}
        title={t('lockedHint')}
        onclick={() => (round.locked = !round.locked)}
      >
        <Icon name={round.locked ? 'lock' : 'unlock'} size={18} />{round.locked ? t('unlock') : t('lock')}
      </button>
    {/if}
    <button class="icon small" aria-label={t('editRound')} title={t('editRound')} onclick={onEdit}>
      <Icon name="edit" size={18} />
    </button>
    {#if !round.locked}
      <button class="icon small" aria-label={t('generateRound')} title={t('generateRound')} onclick={onGenerate}>
        <Icon name="refresh" size={18} />
      </button>
    {/if}
  </div>

  {#if !isGenerated(round)}
    <p class="muted">{t('notGenerated')}</p>
    <button class="primary" onclick={onGenerate}><Icon name="refresh" />{t('generateRound')}</button>
  {:else}
    <div class="teams">
      {#each round.teams as team, ti (ti)}
        <div class="team">
          <div class="team-head">
            <strong>{t('team')} {ti + 1}</strong>
            <span class="muted small">⌀ {formatNumber(teamStrength(plan, team))}</span>
          </div>
          <ul>
            {#each team as id (id)}
              {@const player = players.get(id)}
              {@const pi = positionIndex.get(player?.position ?? '') ?? 0}
              <li>
                <button class="player" class:selected={selected === id} aria-pressed={selected === id} onclick={() => onPlayer(id)}>
                  {#if plan.roster.positions.length > 1}
                    <PositionChip label={plan.roster.positions[pi]?.label ?? '?'} index={pi} />
                  {/if}
                  <span class="ellipsis">{player?.name ?? '?'}</span>
                </button>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  {/if}
  {#if absentNames}
    <p class="muted small">{t('absentPlayers', { names: absentNames })}</p>
  {/if}
</section>

<style>
  .locked {
    border-color: var(--accent);
  }
  .teams {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }
  .team {
    background: var(--surface-2);
    border-radius: 10px;
    padding: 8px;
    min-width: 0;
  }
  .team-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 4px;
    padding: 0 4px 4px;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .player {
    width: 100%;
    justify-content: flex-start;
    min-height: 36px;
    padding: 0 6px;
    border: none;
    background: transparent;
    font-weight: 450;
    border-radius: 8px;
  }
  .player.selected {
    background: var(--selected);
    color: #000;
  }
  @media (prefers-color-scheme: dark) {
    .player.selected {
      color: #fff;
    }
  }
</style>
