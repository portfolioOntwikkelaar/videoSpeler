/* Super responsive video player JS
   Features:
   - play/pause, stop, skip +/-10s
   - progress with buffered indicator
   - volume + mute, playbackRate
   - fullscreen (F), PiP, CC toggle (if track exists)
   - keyboard shortcuts & accessible updates
*/

const video = document.getElementById('video');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const progress = document.getElementById('progress');
const bufferedBar = document.getElementById('bufferedBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const skipBack = document.getElementById('skipBack');
const skipForward = document.getElementById('skipForward');
const muteBtn = document.getElementById('mute');
const volume = document.getElementById('volume');
const playbackRate = document.getElementById('playbackRate');
const fullscreenBtn = document.getElementById('fullscreen');
const pipBtn = document.getElementById('pipBtn');
const ccBtn = document.getElementById('ccBtn');
const themeToggle = document.getElementById('themeToggle');

/* UTIL: format seconds -> mm:ss or hh:mm:ss if needed */
function fmt(t) {
  if (isNaN(t)) return '00:00';
  const sec = Math.floor(t % 60);
  const min = Math.floor((t / 60) % 60);
  const hrs = Math.floor(t / 3600);
  const pad = n => (n < 10 ? '0' + n : n);
  if (hrs > 0) return `${pad(hrs)}:${pad(min)}:${pad(sec)}`;
  return `${pad(min)}:${pad(sec)}`;
}

/* Update play state */
function updatePlayIcon() {
  if (video.paused) {
    playBtn.textContent = '▶️';
    playBtn.setAttribute('aria-label','Afspelen');
  } else {
    playBtn.textContent = '⏸️';
    playBtn.setAttribute('aria-label','Pauzeer');
  }
}

/* Toggle play/pause */
function togglePlay(){
  if (video.paused) video.play(); else video.pause();
}

/* Stop */
function stopVideo(){
  video.pause();
  video.currentTime = 0;
  updateProgress();
  updatePlayIcon();
}

/* Skip */
function skip(sec){
  video.currentTime = Math.min(Math.max(0, video.currentTime + sec), video.duration || Infinity);
}

/* Update progress bar + times */
function updateProgress(){
  const pct = (video.currentTime / (video.duration || 1)) * 100;
  progress.value = pct || 0;
  currentTimeEl.textContent = fmt(video.currentTime);
  durationEl.textContent = fmt(video.duration || 0);

  // Update played part styling using background size (progress thumb handled by CSS)
  progress.style.background = `linear-gradient(90deg, rgba(255,255,255,0.18) ${pct}%, rgba(255,255,255,0.04) ${pct}%)`;

  // Update buffered visual
  try {
    const buffered = video.buffered;
    if (buffered.length) {
      const bufferedEnd = buffered.end(buffered.length - 1);
      const bufPct = (bufferedEnd / video.duration) * 100;
      bufferedBar.style.width = Math.min(100, bufPct) + '%';
    } else {
      bufferedBar.style.width = '0%';
    }
  } catch (e) {
    bufferedBar.style.width = '0%';
  }
}

/* Seek from progress input */
function setVideoProgress(e){
  const val = Number(progress.value);
  if (isNaN(val)) return;
  video.currentTime = (val/100) * (video.duration || 0);
}

/* Volume handling */
function updateVolume(){
  video.volume = Number(volume.value);
  if (video.volume === 0) {
    muteBtn.textContent = '🔇';
    muteBtn.setAttribute('aria-pressed','true');
  } else {
    muteBtn.textContent = '🔈';
    muteBtn.setAttribute('aria-pressed','false');
  }
}
function toggleMute(){
  if (video.muted || video.volume === 0) {
    video.muted = false;
    video.volume = Math.max(0.05, Number(volume.value) || 1);
    volume.value = video.volume;
  } else {
    video.muted = true;
    volume.value = 0;
  }
  updateVolume();
}

/* Playback rate */
playbackRate.addEventListener('change', () => { video.playbackRate = Number(playbackRate.value); });

/* Fullscreen helper (cross-browser) */
function toggleFullscreen() {
  const doc = document;
  const isFS = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
  const container = document.querySelector('.player-wrap');
  if (!isFS) {
    if (container.requestFullscreen) container.requestFullscreen();
    else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
    else if (container.msRequestFullscreen) container.msRequestFullscreen();
    fullscreenBtn.textContent = '⤡';
  } else {
    if (doc.exitFullscreen) doc.exitFullscreen();
    else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
    else if (doc.msExitFullscreen) doc.msExitFullscreen();
    fullscreenBtn.textContent = '⤢';
  }
}

/* Picture-in-Picture */
async function togglePiP(){
  try {
    // some browsers require that the video is playing
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else {
      if (video.requestPictureInPicture) await video.requestPictureInPicture();
    }
  } catch (err) {
    console.warn('PiP niet beschikbaar', err);
  }
}

/* Captions toggle (if tracks exist) */
function toggleCaptions(){
  const textTracks = video.textTracks || [];
  if (!textTracks.length) return;
  const enabled = Array.from(textTracks).some(t => t.mode === 'showing');
  Array.from(textTracks).forEach(t => t.mode = enabled ? 'disabled' : 'showing');
  ccBtn.setAttribute('aria-pressed', String(!enabled));
}

/* Theme toggle */
function toggleTheme(){
  const root = document.documentElement;
  const current = root.getAttribute('data-theme');
  if (current === 'dark') {
    root.removeAttribute('data-theme');
    themeToggle.setAttribute('aria-pressed','false');
  } else {
    root.setAttribute('data-theme','dark');
    themeToggle.setAttribute('aria-pressed','true');
  }
}

/* Keyboard shortcuts */
function onKey(e){
  const tag = document.activeElement.tagName.toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return; // ignore typing
  switch (e.key.toLowerCase()){
    case ' ':
    case 'k':
      e.preventDefault();
      togglePlay();
      break;
    case 'm':
      toggleMute();
      break;
    case 'f':
      toggleFullscreen();
      break;
    case 'arrowleft':
      skip(-5);
      break;
    case 'arrowright':
      skip(5);
      break;
    case 'arrowup':
      e.preventDefault();
      volume.value = Math.min(1, Number(volume.value) + 0.05).toFixed(2);
      updateVolume();
      break;
    case 'arrowdown':
      e.preventDefault();
      volume.value = Math.max(0, Number(volume.value) - 0.05).toFixed(2);
      updateVolume();
      break;
    case '.':
      // jump to next frame like youtube (optional)
      video.currentTime = Math.min(video.duration, video.currentTime + 0.04);
      break;
  }
}

/* Events wiring */
playBtn.addEventListener('click', togglePlay);
video.addEventListener('click', togglePlay);
video.addEventListener('play', updatePlayIcon);
video.addEventListener('pause', updatePlayIcon);
video.addEventListener('timeupdate', updateProgress);
video.addEventListener('loadedmetadata', updateProgress);
video.addEventListener('progress', updateProgress);

stopBtn.addEventListener('click', stopVideo);
skipBack.addEventListener('click', () => skip(-10));
skipForward.addEventListener('click', () => skip(10));

progress.addEventListener('input', setVideoProgress); // live seek while dragging
progress.addEventListener('change', setVideoProgress);

volume.addEventListener('input', updateVolume);
muteBtn.addEventListener('click', toggleMute);

fullscreenBtn.addEventListener('click', toggleFullscreen);
pipBtn.addEventListener('click', togglePiP);
ccBtn.addEventListener('click', toggleCaptions);
themeToggle.addEventListener('click', toggleTheme);

document.addEventListener('keydown', onKey);

/* Initialize defaults */
(function init(){
  volume.value = 1;
  video.volume = 1;
  playbackRate.value = 1;
  // ensure duration text updates when metadata arrives
  if (video.readyState >= 1) updateProgress();
})();

/* Accessibility: make keyboard focus visible on controls */
document.querySelectorAll('button, input, select').forEach(el => {
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter') el.click();
  });
});
