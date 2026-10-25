/** Sending files and text via the phone's share sheet, with download/clipboard fallbacks. */

export type ShareResult = 'shared' | 'saved' | 'copied' | 'cancelled';

const BOM = '﻿'; // lets Excel detect UTF-8 (umlauts)

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function saveFile(filename: string, content: string): ShareResult {
  const url = URL.createObjectURL(new Blob([BOM + content], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return 'saved';
}

export function canShareFiles(): boolean {
  try {
    const probe = new File(['x'], 'x.csv', { type: 'text/csv' });
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export async function shareFile(filename: string, content: string, title: string): Promise<ShareResult> {
  const file = new File([BOM + content], filename, { type: 'text/csv' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (error) {
      if (isAbort(error)) return 'cancelled';
    }
  }
  return saveFile(filename, content);
}

export async function shareText(text: string): Promise<ShareResult> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (error) {
      if (isAbort(error)) return 'cancelled';
    }
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
