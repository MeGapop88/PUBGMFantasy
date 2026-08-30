/**
 * UI HELPERS — Toast notifications, page renderer, nav active state, formatters
 */

let toastContainer;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function toast(message, type = 'success', duration = 3500) {
  const icons = { success: 'check_circle', error: 'error', warning: 'warning' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span class="material-symbols-outlined text-lg">${icons[type] ?? 'info'}</span>
    <span class="toast-msg font-headline font-bold uppercase tracking-wider">${message}</span>
  `;
  getToastContainer().appendChild(el);
  setTimeout(() => el.remove(), duration);
}

export function renderPage(html) {
  const container = document.getElementById('page-container');
  if (container) container.innerHTML = html;
}

export function showPageLoader(message = 'LOADING TELEMETRY...') {
  renderPage(`
    <div class="page-loader flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div class="w-12 h-12 border-2 border-outline-variant border-t-primary rounded-full animate-spin"></div>
      <p class="font-headline font-bold text-sm text-primary uppercase tracking-widest">${message}</p>
    </div>
  `);
}

export function setActiveNav(page) {
  // Top navigation links
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.page === page) {
      link.classList.add('text-primary', 'border-b-2', 'border-primary', 'bg-primary/5');
      link.classList.remove('text-outline');
    } else {
      link.classList.remove('text-primary', 'border-b-2', 'border-primary', 'bg-primary/5');
      link.classList.add('text-outline');
    }
  });

  // Mobile drawer links
  document.querySelectorAll('.nav-mobile-link').forEach(link => {
    if (link.dataset.page === page) {
      link.classList.add('text-primary', 'bg-primary/10', 'border-l-4', 'border-primary');
      link.classList.remove('text-outline');
    } else {
      link.classList.remove('text-primary', 'bg-primary/10', 'border-l-4', 'border-primary');
      link.classList.add('text-outline');
    }
  });
}

export function fmt(n, decimals = 0) {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtPower(n) {
  if (n === null || n === undefined) return '—';
  return Math.round(Number(n)).toLocaleString('en-US') + ' PWR';
}

export function fmtPowerNumber(n) {
  if (n === null || n === undefined) return '—';
  return Math.round(Number(n)).toLocaleString('en-US');
}

export function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function placementColor(rank) {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  if (rank <= 5)  return '#FF6B00';
  return '#a98a7d';
}

export function getInitials(name) {
  if (!name) return '?';
  return name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase();
}
