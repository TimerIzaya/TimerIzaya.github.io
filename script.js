const body = document.body;
const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const navLinks = document.querySelectorAll('[data-nav-links] a');
const storyTrack = document.querySelector('[data-story-track]');

const closeMenu = () => {
  body.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', '打开菜单');
};

menuToggle?.addEventListener('click', () => {
  const isOpen = body.classList.toggle('menu-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? '关闭菜单' : '打开菜单');
});

navLinks.forEach(link => link.addEventListener('click', closeMenu));
window.addEventListener('keydown', event => event.key === 'Escape' && closeMenu());
window.addEventListener('scroll', () => header?.classList.toggle('scrolled', scrollY > 8), { passive: true });

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -35px' });

document.querySelectorAll('.reveal').forEach(element => observer.observe(element));

document.querySelector('[data-track-prev]')?.addEventListener('click', () => {
  storyTrack?.scrollBy({ left: -storyTrack.clientWidth * 0.72, behavior: 'smooth' });
});
document.querySelector('[data-track-next]')?.addEventListener('click', () => {
  storyTrack?.scrollBy({ left: storyTrack.clientWidth * 0.72, behavior: 'smooth' });
});

document.querySelector('[data-year]').textContent = new Date().getFullYear();
