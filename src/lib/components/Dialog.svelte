<script lang="ts">
  import type { Snippet } from 'svelte';
  import { t } from '../i18n.svelte';
  import Icon from './Icon.svelte';

  let {
    open = $bindable(false),
    title,
    children,
    footer,
  }: { open: boolean; title: string; children: Snippet; footer?: Snippet } = $props();

  let dialog: HTMLDialogElement;

  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  });
</script>

<dialog
  bind:this={dialog}
  onclose={() => (open = false)}
  onclick={(e) => {
    if (e.target === dialog) open = false;
  }}
>
  <div class="sheet">
    <header class="row">
      <h2 class="spacer">{title}</h2>
      <button type="button" class="icon ghost" aria-label={t('close')} onclick={() => (open = false)}>
        <Icon name="x" />
      </button>
    </header>
    <div class="body">
      {#if open}{@render children()}{/if}
    </div>
    {#if footer}
      <footer class="row">{@render footer()}</footer>
    {/if}
  </div>
</dialog>

<style>
  dialog {
    border: none;
    padding: 0;
    background: transparent;
    color: var(--text);
    width: min(560px, 100vw);
    max-width: 100vw;
    max-height: 100dvh;
    margin: auto auto 0;
  }
  @media (min-width: 600px) {
    dialog {
      margin: auto;
    }
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.45);
  }
  .sheet {
    background: var(--surface);
    border-radius: 16px 16px 0 0;
    max-height: 90dvh;
    display: flex;
    flex-direction: column;
    padding-bottom: env(safe-area-inset-bottom);
  }
  @media (min-width: 600px) {
    .sheet {
      border-radius: 16px;
    }
  }
  header {
    padding: 8px 8px 0 16px;
  }
  .body {
    padding: 8px 16px 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  footer {
    padding: 12px 16px;
    border-top: 1px solid var(--border);
  }
  footer :global(button) {
    flex: 1;
  }
</style>
