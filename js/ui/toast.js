let hideTimer = null;

export function showToast(message, variant = 'default') {
  const root = document.getElementById('toast-root');
  if (!root) return;

  root.innerHTML = '';
  const toast = document.createElement('div');
  toast.className = variant === 'default' ? 'toast' : `toast toast--${variant}`;
  toast.textContent = message;
  root.appendChild(toast);

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    toast.remove();
  }, 3200);
}
