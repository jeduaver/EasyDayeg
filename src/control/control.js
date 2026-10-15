const $ = (id) => document.getElementById(id);

const SAMPLE = {
  items: [
    {
      id: 'amazing-grace',
      title: 'Amazing Grace',
      lyrics:
        'Amazing grace! How sweet the sound\nThat saved a wretch like me!\n\nI once was lost, but now am found;\nWas blind, but now I see.\n\n' +
        "'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\n\nHow precious did that grace appear\nThe hour I first believed.\n\n" +
        'Through many dangers, toils and snares,\nI have already come;\n\n' +
        "'Tis grace hath brought me safe thus far,\nAnd grace will lead me home.",
      bg: null,
    },
    {
      id: 'holy-holy-holy',
      title: 'Holy, Holy, Holy',
      lyrics:
        'Holy, holy, holy! Lord God Almighty!\nEarly in the morning our song shall rise to Thee;\n\n' +
        'Holy, holy, holy, merciful and mighty!\nGod in three Persons, blessed Trinity!',
      bg: { type: 'color', color: '#3b1f4a' },
    },
    { id: 'welcome', title: 'Welcome', lyrics: 'Welcome!\n\nWe are glad you are here', bg: { type: 'color', color: '#0f3b2e' } },
  ],
  playlist: ['welcome', 'amazing-grace', 'holy-holy-holy'],
  defaultBg: { type: 'color', color: '#10213f' },
  style: { size: 8, color: '#ffffff', font: '"Helvetica Neue", Arial, sans-serif' },
};

let db;
const ui = {
  selectedId: null, // item shown in the slide grid
  fromPlaylist: -1, // playlist position the selection came from, for auto-advance
  live: null, // { itemId, index, playlistPos }
  showText: true,
  showBg: true,
  black: false,
};

const slidesOf = (item) => (item ? item.lyrics.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean) : []);
const itemById = (id) => db.items.find((i) => i.id === id);
const bgFor = (item) => (item && item.bg) || db.defaultBg;
const bgLabel = (bg) => (!bg ? 'Default' : bg.type === 'color' ? bg.color : bg.name || bg.type);

let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => window.easy.saveLibrary(db), 300);
}

// ---------- Live state ----------

const preview = createRenderer($('pvBg'), $('pvText'), $('pvBlack'));

function pushState() {
  const item = ui.live && itemById(ui.live.itemId);
  const slides = slidesOf(item);
  const text = item ? slides[ui.live.index] || '' : '';
  const nxt = nextPosition();
  let nextText = '';
  if (nxt) nextText = slidesOf(itemById(nxt.itemId))[nxt.index] || '';
  const state = {
    title: item ? item.title : '',
    text,
    next: nextText,
    bg: ui.live ? bgFor(item) : db.defaultBg,
    showText: ui.showText,
    showBg: ui.showBg,
    black: ui.black,
    style: db.style,
  };
  window.easy.sendState(state);
  preview.render(state);
  $('btnBlack').classList.toggle('active', ui.black);
  $('btnClearText').classList.toggle('active', !ui.showText);
  $('btnClearBg').classList.toggle('active', !ui.showBg);
  $('liveStatus').textContent = item ? `${item.title} · slide ${ui.live.index + 1} of ${slides.length}` : 'Nothing live';
  renderSlides();
}

function goLive(itemId, index, playlistPos = ui.fromPlaylist) {
  ui.live = { itemId, index, playlistPos };
  ui.showText = true;
  ui.black = false;
  pushState();
}

// Next slide, rolling into the next playlist item at the end of a song.
function nextPosition() {
  if (!ui.live) return null;
  const item = itemById(ui.live.itemId);
  if (ui.live.index + 1 < slidesOf(item).length) return { ...ui.live, index: ui.live.index + 1 };
  const pos = ui.live.playlistPos;
  for (let p = pos + 1; pos >= 0 && p < db.playlist.length; p++) {
    const nextItem = itemById(db.playlist[p]);
    if (slidesOf(nextItem).length) return { itemId: nextItem.id, index: 0, playlistPos: p };
  }
  return null;
}

function step(dir) {
  if (!ui.live) {
    if (ui.selectedId && slidesOf(itemById(ui.selectedId)).length) goLive(ui.selectedId, 0);
    return;
  }
  if (dir > 0) {
    const n = nextPosition();
    if (!n) return;
    if (n.itemId !== ui.selectedId) select(n.itemId, n.playlistPos);
    goLive(n.itemId, n.index, n.playlistPos);
  } else if (ui.live.index > 0) {
    goLive(ui.live.itemId, ui.live.index - 1, ui.live.playlistPos);
  }
}

// ---------- Rendering ----------

function renderLibrary() {
  const q = $('search').value.trim().toLowerCase();
  const ul = $('library');
  ul.innerHTML = '';
  db.items
    .filter((i) => !q || i.title.toLowerCase().includes(q) || i.lyrics.toLowerCase().includes(q))
    .sort((a, b) => a.title.localeCompare(b.title))
    .forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item.title;
      li.classList.toggle('selected', item.id === ui.selectedId && ui.fromPlaylist < 0);
      li.onclick = () => select(item.id, -1);
      li.ondblclick = () => openEditor(item);
      ul.appendChild(li);
    });
}

function renderPlaylist() {
  const ul = $('playlist');
  ul.innerHTML = '';
  let dragFrom = null;
  db.playlist.forEach((id, pos) => {
    const item = itemById(id);
    if (!item) return;
    const li = document.createElement('li');
    li.draggable = true;
    li.innerHTML = `<span></span><span class="x" title="Remove">✕</span>`;
    li.firstChild.textContent = `${pos + 1}. ${item.title}`;
    li.classList.toggle('selected', ui.fromPlaylist === pos);
    li.onclick = () => select(id, pos);
    li.querySelector('.x').onclick = (e) => {
      e.stopPropagation();
      db.playlist.splice(pos, 1);
      if (ui.fromPlaylist === pos) ui.fromPlaylist = -1;
      save();
      renderPlaylist();
    };
    li.ondragstart = () => (dragFrom = pos);
    li.ondragover = (e) => {
      e.preventDefault();
      li.classList.add('drop-target');
    };
    li.ondragleave = () => li.classList.remove('drop-target');
    li.ondrop = () => {
      if (dragFrom === null || dragFrom === pos) return;
      const [moved] = db.playlist.splice(dragFrom, 1);
      db.playlist.splice(pos, 0, moved);
      ui.fromPlaylist = pos;
      if (ui.live) ui.live.playlistPos = db.playlist.indexOf(ui.live.itemId);
      save();
      renderPlaylist();
    };
    ul.appendChild(li);
  });
  if (!db.playlist.length) ul.innerHTML = '<li class="muted">Select a library item and press + Add</li>';
}

function applyThumbBg(el, bg) {
  el.style.background = '#000';
  if (!bg) return;
  if (bg.type === 'color') el.style.background = bg.color;
  else if (bg.type === 'image') el.style.backgroundImage = `url("${bg.src}")`;
  else if (bg.type === 'video') {
    const v = document.createElement('video');
    Object.assign(v, { src: bg.src, muted: true, preload: 'metadata' });
    v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover';
    el.appendChild(v);
  }
}

function renderSlides() {
  const item = itemById(ui.selectedId);
  $('itemTitle').textContent = item ? item.title : 'Select an item';
  $('btnEdit').disabled = !item;
  const grid = $('slides');
  grid.innerHTML = '';
  if (!item) return;
  const slides = slidesOf(item);
  if (!slides.length) grid.innerHTML = '<div class="empty">This item has no slides yet. Press Edit to add text.</div>';
  slides.forEach((text, i) => {
    const el = document.createElement('div');
    el.className = 'slide';
    applyThumbBg(el, bgFor(item));
    el.insertAdjacentHTML('beforeend', '<div class="t"></div><div class="n"></div>');
    const t = el.querySelector('.t');
    t.textContent = text;
    t.style.color = db.style.color;
    t.style.fontFamily = db.style.font;
    el.querySelector('.n').textContent = i + 1;
    el.classList.toggle('live', !!ui.live && ui.live.itemId === item.id && ui.live.index === i);
    el.onclick = () => goLive(item.id, i);
    grid.appendChild(el);
  });
}

function select(id, playlistPos) {
  ui.selectedId = id;
  ui.fromPlaylist = playlistPos;
  renderLibrary();
  renderPlaylist();
  renderSlides();
}

function renderAll() {
  renderLibrary();
  renderPlaylist();
  renderSlides();
  $('bgName').textContent = db.defaultBg.type === 'color' ? '' : db.defaultBg.name;
  if (db.defaultBg.type === 'color') $('bgColor').value = db.defaultBg.color;
  $('textSize').value = db.style.size;
  $('textColor').value = db.style.color;
  $('textFont').value = db.style.font;
}

// ---------- Editor ----------

let editing = null;
let editingBg = null;

function openEditor(item) {
  editing = item;
  editingBg = item ? item.bg : null;
  $('editorHeading').textContent = item ? 'Edit item' : 'New item';
  $('edTitle').value = item ? item.title : '';
  $('edLyrics').value = item ? item.lyrics : '';
  $('edBgName').textContent = bgLabel(editingBg);
  $('edDelete').style.display = item ? '' : 'none';
  $('editor').showModal();
}

$('editor').addEventListener('close', () => {
  if ($('editor').returnValue !== 'save') return;
  const title = $('edTitle').value.trim() || 'Untitled';
  const lyrics = $('edLyrics').value;
  if (editing) Object.assign(editing, { title, lyrics, bg: editingBg });
  else {
    editing = { id: `item-${Date.now()}`, title, lyrics, bg: editingBg };
    db.items.push(editing);
  }
  save();
  select(editing.id, ui.fromPlaylist);
  if (ui.live && ui.live.itemId === editing.id) pushState();
});

$('edBgPick').onclick = async () => {
  const media = await window.easy.pickMedia();
  if (media) editingBg = media;
  $('edBgName').textContent = bgLabel(editingBg);
};
$('edBgReset').onclick = () => {
  editingBg = null;
  $('edBgName').textContent = bgLabel(editingBg);
};
$('edDelete').onclick = () => {
  if (!editing || !confirm(`Delete "${editing.title}"?`)) return;
  db.items = db.items.filter((i) => i !== editing);
  db.playlist = db.playlist.filter((id) => id !== editing.id);
  if (ui.selectedId === editing.id) ui.selectedId = null;
  if (ui.live && ui.live.itemId === editing.id) ui.live = null;
  $('editor').close('cancel');
  save();
  renderAll();
  pushState();
};

// ---------- Controls ----------

$('btnNew').onclick = () => openEditor(null);
$('btnEdit').onclick = () => openEditor(itemById(ui.selectedId));
$('search').oninput = renderLibrary;
$('btnAddToPlaylist').onclick = () => {
  if (!ui.selectedId) return;
  db.playlist.push(ui.selectedId);
  save();
  renderPlaylist();
};

$('btnClearText').onclick = () => ((ui.showText = !ui.showText), pushState());
$('btnClearBg').onclick = () => ((ui.showBg = !ui.showBg), pushState());
$('btnBlack').onclick = () => ((ui.black = !ui.black), pushState());
$('btnClearAll').onclick = () => {
  ui.live = null;
  ui.black = false;
  ui.showText = true;
  ui.showBg = true;
  pushState();
};
$('btnOutput').onclick = () => window.easy.openWindow('output');
$('btnStage').onclick = () => window.easy.openWindow('stage');

$('bgColor').oninput = (e) => {
  db.defaultBg = { type: 'color', color: e.target.value };
  $('bgName').textContent = '';
  save();
  pushState();
};
$('bgMedia').onclick = async () => {
  const media = await window.easy.pickMedia();
  if (!media) return;
  db.defaultBg = media;
  $('bgName').textContent = media.name;
  save();
  pushState();
};
$('textSize').oninput = (e) => ((db.style.size = +e.target.value), save(), pushState());
$('textColor').oninput = (e) => ((db.style.color = e.target.value), save(), pushState());
$('textFont').onchange = (e) => ((db.style.font = e.target.value), save(), pushState());

document.addEventListener('keydown', (e) => {
  if ($('editor').open || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') step(1);
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') step(-1);
  else if (e.key === 'b' || e.key === 'B') $('btnBlack').click();
  else if (e.key === 'c' || e.key === 'C') $('btnClearText').click();
  else if (e.key === 'Escape') $('btnClearAll').click();
  else return;
  e.preventDefault();
});
window.addEventListener('resize', () => preview.fit());

(async () => {
  db = (await window.easy.loadLibrary()) || structuredClone(SAMPLE);
  db.style = { ...SAMPLE.style, ...db.style };
  renderAll();
  pushState();
})();
