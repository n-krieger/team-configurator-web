export const toast = $state({ message: '', error: false, id: 0 });

let timer: ReturnType<typeof setTimeout> | undefined;

export function showToast(message: string, { error = false } = {}): void {
  clearTimeout(timer);
  Object.assign(toast, { message, error, id: toast.id + 1 });
  timer = setTimeout(() => (toast.message = ''), error ? 6000 : 2800);
}
