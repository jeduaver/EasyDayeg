// Draws one slide (background + text + blackout) into the given elements.
// Used by the audience output window and the operator's live preview.
function createRenderer(bgEl, textEl, blackEl) {
  let currentBgKey = null;
  let lastState = null;

  function setBackground(bg) {
    const key = bg ? `${bg.type}:${bg.src || bg.color}` : 'none';
    if (key === currentBgKey) return; // keep videos playing between slides
    currentBgKey = key;
    bgEl.innerHTML = '';
    bgEl.style.background = '#000';
    if (!bg) return;
    if (bg.type === 'color') {
      bgEl.style.background = bg.color;
    } else if (bg.type === 'image') {
      const img = document.createElement('img');
      img.src = bg.src;
      bgEl.appendChild(img);
    } else if (bg.type === 'video') {
      const v = document.createElement('video');
      // Backgrounds loop silently.
      Object.assign(v, { src: bg.src, autoplay: true, loop: true, muted: true, playsInline: true });
      bgEl.appendChild(v);
    }
  }

  // Shrink text until it fits the box, starting from the theme size.
  function fit() {
    if (!lastState) return;
    const base = (lastState.style && lastState.style.size) || 8; // percent of output height
    const h = textEl.parentElement.clientHeight;
    let size = (base / 100) * h;
    textEl.style.fontSize = size + 'px';
    while (size > 8 && (textEl.scrollHeight > textEl.clientHeight || textEl.scrollWidth > textEl.clientWidth)) {
      size *= 0.92;
      textEl.style.fontSize = size + 'px';
    }
  }

  function render(s) {
    lastState = s;
    setBackground(s.bg);
    bgEl.classList.toggle('hidden', !s.showBg);
    textEl.textContent = s.text || '';
    textEl.style.color = (s.style && s.style.color) || '#fff';
    textEl.style.fontFamily = (s.style && s.style.font) || '';
    textEl.classList.toggle('hidden', !s.showText);
    blackEl.classList.toggle('on', !!s.black);
    fit();
  }

  return { render, fit };
}
