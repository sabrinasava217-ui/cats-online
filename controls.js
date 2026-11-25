// Status kontrol sentuh (dibaca oleh GameScene setiap frame)
const CONTROLS = { left: false, right: false, jump: false, onSwitch: null };

(function () {
  function hold(id, key) {
    const el = document.getElementById(id);
    const on = (e) => { e.preventDefault(); CONTROLS[key] = true; el.classList.add('down'); };
    const off = (e) => { e.preventDefault(); CONTROLS[key] = false; el.classList.remove('down'); };
    el.addEventListener('pointerdown', on);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, off));
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  hold('btn-left', 'left');
  hold('btn-right', 'right');
  hold('btn-jump', 'jump');
  document.getElementById('btn-switch').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (CONTROLS.onSwitch) CONTROLS.onSwitch();
  });
})();
