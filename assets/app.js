const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');
function closeMenu() {
  menuButton?.setAttribute('aria-expanded', 'false');
  navigation?.classList.remove('is-open');
}
menuButton?.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  navigation.classList.toggle('is-open', !expanded);
});
navigation?.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('.site-header')) closeMenu();
});
const deviceButtons = [...document.querySelectorAll('[data-device]')];
deviceButtons.forEach((button) => button.addEventListener('click', () => {
  const isIphone = button.dataset.device === 'iphone';
  deviceButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  const instruction = document.querySelector('#device-instruction');
  instruction.textContent = isIphone
    ? '在 iPhone 上打开 WhatsApp，进入「设置」→「已关联的设备」，再轻点「关联设备」。'
    : '在 Android 手机上打开 WhatsApp，轻点右上角「⋮」→「已关联的设备」，再轻点「关联设备」。';
}));
