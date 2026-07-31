document.querySelector('[data-year]').textContent = new Date().getFullYear();

const pricingModal = document.querySelector('[data-pricing-modal]');
const pricingBackdrop = document.querySelector('[data-pricing-backdrop]');
const openPricingButton = document.querySelector('[data-open-pricing]');
const closePricingButton = document.querySelector('[data-close-pricing]');
let hideTimer;

function openPricing() {
  clearTimeout(hideTimer);
  pricingModal.hidden = false;
  pricingBackdrop.hidden = false;
  requestAnimationFrame(() => {
    document.body.classList.add('modal-open');
    closePricingButton.focus();
  });
}

function closePricing() {
  document.body.classList.remove('modal-open');
  hideTimer = setTimeout(() => {
    pricingModal.hidden = true;
    pricingBackdrop.hidden = true;
    openPricingButton.focus();
  }, 220);
}

openPricingButton.addEventListener('click', openPricing);
closePricingButton.addEventListener('click', closePricing);
pricingBackdrop.addEventListener('click', closePricing);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !pricingModal.hidden) closePricing();
});

if (location.hash === '#pricing') openPricing();
