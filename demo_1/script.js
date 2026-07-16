const header = document.getElementById('siteHeader');
const menuToggle = document.getElementById('menuToggle');
const mobileMenu = document.getElementById('mobileMenu');
const dialog = document.getElementById('demoDialog');
const backdrop = document.getElementById('dialogBackdrop');
const dialogTitle = document.getElementById('dialogTitle');

const syncHeader = () => header.classList.toggle('scrolled', window.scrollY > 0);
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

menuToggle.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.mobile-menu a').forEach(link => link.addEventListener('click', () => {
  header.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
}));

function showDialog(label) {
  dialogTitle.textContent = label === '登录' ? '登录 mori' : '欢迎体验 mori';
  backdrop.hidden = false;
  dialog.hidden = false;
  requestAnimationFrame(() => document.body.classList.add('dialog-open'));
}

function hideDialog() {
  document.body.classList.remove('dialog-open');
  setTimeout(() => { backdrop.hidden = true; dialog.hidden = true; }, 180);
}

document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => showDialog(button.dataset.dialog)));
document.getElementById('dialogClose').addEventListener('click', hideDialog);
document.getElementById('dialogOk').addEventListener('click', hideDialog);
backdrop.addEventListener('click', hideDialog);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !dialog.hidden) hideDialog(); });
