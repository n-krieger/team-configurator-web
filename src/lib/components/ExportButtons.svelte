<script lang="ts">
  import { t } from '../i18n.svelte';
  import { canShareFiles, saveFile, shareFile } from '../share';
  import { showToast } from '../toast.svelte';
  import Icon from './Icon.svelte';

  let { filename, content, title }: { filename: string; content: () => string; title: string } = $props();

  const shareable = canShareFiles();

  async function send() {
    try {
      await shareFile(filename, content(), title);
    } catch {
      showToast(t('shareFailed'), { error: true });
    }
  }
</script>

{#if shareable}
  <button type="button" onclick={send}><Icon name="share" />{t('shareFile')}</button>
{/if}
<button type="button" onclick={() => saveFile(filename, content())}><Icon name="download" />{t('saveFile')}</button>
