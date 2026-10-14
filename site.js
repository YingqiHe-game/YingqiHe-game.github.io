const dialog = document.querySelector('#image-viewer');
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => {
  const image = dialog.querySelector('img');
  image.src = button.dataset.image;
  image.alt = button.dataset.caption;
  dialog.querySelector('p').textContent = button.dataset.caption;
  dialog.showModal();
}));
dialog?.querySelector('.close').addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
const versions = {
  baseline: {turns:'29.99', battles:'2.83', cap:'99.89%', threshold:'30', widths:[100,28.3,99.89]},
  m9d: {turns:'25.61', battles:'6.67', cap:'44.32%', threshold:'18', widths:[85.4,66.7,44.32]},
  final: {turns:'24.91', battles:'6.62', cap:'38.31%', threshold:'17', widths:[83,66.2,38.31]}
};
document.querySelectorAll('[data-version]').forEach(button => button.addEventListener('click', () => {
  const data = versions[button.dataset.version];
  document.querySelectorAll('[data-version]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  ['turns','battles','cap'].forEach((name,index) => {
    document.querySelector(`[data-metric="${name}"]`).textContent = data[name];
    document.querySelector(`[data-bar="${name}"]`).style.width = `${data.widths[index]}%`;
  });
  document.querySelector('[data-threshold]').textContent = data.threshold;
}));
document.querySelector('[data-print]')?.addEventListener('click', () => window.print());
// A section link remains useful when its detailed record is collapsed.
function revealLinkedSection() {
  if (!location.hash) return;
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(id);
  if (!target) return;
  let ancestor = target.parentElement;
  let opened = false;
  while (ancestor) {
    if (ancestor.tagName === 'DETAILS' && !ancestor.open) {
      ancestor.open = true;
      opened = true;
    }
    ancestor = ancestor.parentElement;
  }
  if (opened) requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
}
window.addEventListener('hashchange', revealLinkedSection);
revealLinkedSection();

// Short GIF-derived demonstrations run only while visible. Long videos keep controls.
const motionClips = [...document.querySelectorAll('[data-loop-video]')];
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionStates = new Map();

function updateMotionButton(video) {
  const state = motionStates.get(video);
  if (!state?.button) return;
  const action = video.paused ? 'Play' : 'Pause';
  state.button.textContent = `${action} motion`;
  state.button.setAttribute('aria-label', `${action} ${video.dataset.motionLabel} animation`);
}

function shouldRunMotion(video) {
  const state = motionStates.get(video);
  return state.visible && !state.userPaused && !document.hidden &&
    (!motionPreference.matches || state.manualPlayback);
}

function syncMotion(video) {
  if (!shouldRunMotion(video)) {
    video.pause();
    updateMotionButton(video);
    return;
  }
  video.play().then(() => {
    if (!shouldRunMotion(video)) video.pause();
    updateMotionButton(video);
  }).catch(() => {
    // A blocked automatic start leaves a working manual control.
    updateMotionButton(video);
  });
}

motionClips.forEach(video => {
  const button = video.closest('.motion-frame').querySelector('[data-motion-toggle]');
  const state = {button, visible:false, userPaused:false, manualPlayback:false};
  motionStates.set(video, state);
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.controls = false;
  button.hidden = false;
  video.addEventListener('play', () => updateMotionButton(video));
  video.addEventListener('pause', () => updateMotionButton(video));
  button.addEventListener('click', () => {
    if (video.paused) {
      state.userPaused = false;
      state.manualPlayback = true;
    } else {
      state.userPaused = true;
    }
    syncMotion(video);
  });
  updateMotionButton(video);
});

if ('IntersectionObserver' in window) {
  const motionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      motionStates.get(entry.target).visible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
      syncMotion(entry.target);
    });
  }, {threshold:[0,0.15]});
  motionClips.forEach(video => motionObserver.observe(video));
} else {
  motionClips.forEach(video => {
    motionStates.get(video).visible = true;
    syncMotion(video);
  });
}
document.addEventListener('visibilitychange', () => motionClips.forEach(syncMotion));
motionPreference.addEventListener('change', () => motionClips.forEach(syncMotion));
