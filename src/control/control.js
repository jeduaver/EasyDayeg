const $ = (id) => document.getElementById(id);
const SANS = '"Helvetica Neue", Arial, sans-serif';

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
      themeId: 'hymn',
    },
    {
      id: 'holy-holy-holy',
      title: 'Holy, Holy, Holy',
      lyrics:
        'Holy, holy, holy! Lord God Almighty!\nEarly in the morning our song shall rise to Thee;\n\n' +
        'Holy, holy, holy, merciful and mighty!\nGod in three Persons, blessed Trinity!',
      bg: { type: 'color', color: '#3b1f4a' },
    },
    {
      id: 'welcome',
      title: 'Welcome',
      lyrics: 'Welcome!\n\nWe are glad you are here',
      bg: { type: 'color', color: '#0f3b2e' },
      themeId: 'bold-caps',
    },
  ],
  playlist: ['welcome', 'amazing-grace', 'holy-holy-holy'],
  defaultBg: { type: 'color', color: '#10213f' },
  // A theme is a reusable text look plus an optional background. Items pick one
  // with themeId; items without one use defaultThemeId.
  themes: [
    { id: 'classic', name: 'Classic', font: SANS, weight: 600, size: 8, color: '#ffffff', align: 'center', valign: 'middle', shadow: true, outline: false, uppercase: false, bg: null },
    { id: 'hymn', name: 'Hymn', font: 'Georgia, "Times New Roman", serif', weight: 400, size: 8, color: '#f6ecd6', align: 'center', valign: 'middle', shadow: true, outline: false, uppercase: false, bg: { type: 'color', color: '#2a1d14' } },
    { id: 'lower-third', name: 'Lower third', font: SANS, weight: 600, size: 5.5, color: '#ffffff', align: 'center', valign: 'bottom', shadow: true, outline: true, uppercase: false, bg: null },
    { id: 'bold-caps', name: 'Bold caps', font: '"Arial Black", Impact, sans-serif', weight: 800, size: 9, color: '#ffffff', align: 'center', valign: 'middle', shadow: false, outline: true, uppercase: true, bg: { type: 'color', color: '#111111' } },
  ],
  defaultThemeId: 'classic',
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
const themeById = (id) => db.themes.find((t) => t.id === id);
const defaultTheme = () => themeById(db.defaultThemeId) || db.themes[0];
const themeFor = (item) => (item && themeById(item.themeId)) || defaultTheme();
// Item background wins, then the item's theme, then the global default.
const bgFor = (item) => (item && item.bg) || themeFor(item).bg || db.defaultBg;
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
    style: themeFor(item),
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
  $('itemTheme').disabled = !item;
  $('itemTheme').value = (item && themeById(item.themeId) && item.themeId) || '';
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
    const theme = themeFor(item);
    applyThemeText(t, theme);
    t.style.fontSize = (theme.size / 8) * 12 + 'px';
    el.querySelector('.n').textContent = i + 1;
    el.classList.toggle('live', !!ui.live && ui.live.itemId === item.id && ui.live.index === i);
    el.onclick = () => goLive(item.id, i);
    grid.appendChild(el);
  });
}

function select(id, playlistPos) {
  ui.selectedId = id;
  ui.fromPlaylist = playlistPos;
  editThemeId = themeFor(itemById(id)).id; // theme panel follows the selected item
  renderThemeOptions();
  renderThemeFields();
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
  renderThemeOptions();
  renderThemeFields();
}

// ---------- Themes ----------

let editThemeId = null;
const editTheme = () => themeById(editThemeId) || defaultTheme();

function renderThemeOptions() {
  const pick = $('thPick');
  const itemSel = $('itemTheme');
  pick.innerHTML = '';
  itemSel.innerHTML = '';
  itemSel.add(new Option(`Default (${defaultTheme().name})`, ''));
  for (const t of db.themes) {
    pick.add(new Option(t.id === db.defaultThemeId ? `${t.name} ★` : t.name, t.id));
    itemSel.add(new Option(t.name, t.id));
  }
  pick.value = editTheme().id;
  const item = itemById(ui.selectedId);
  itemSel.value = (item && themeById(item.themeId) && item.themeId) || '';
}

function renderThemeFields() {
  const t = editTheme();
  $('thName').value = t.name;
  $('thDefault').checked = t.id === db.defaultThemeId;
  $('thDefault').disabled = t.id === db.defaultThemeId;
  $('thFont').value = t.font;
  $('thWeight').value = String(t.weight);
  $('thSize').value = t.size;
  $('thColor').value = t.color;
  $('thAlign').value = t.align;
  $('thValign').value = t.valign;
  $('thShadow').checked = !!t.shadow;
  $('thOutline').checked = !!t.outline;
  $('thUpper').checked = !!t.uppercase;
  if (t.bg && t.bg.type === 'color') $('thBgColor').value = t.bg.color;
  $('thBgName').textContent = !t.bg ? 'Uses the default background' : t.bg.type === 'color' ? '' : t.bg.name;
  $('thDelete').disabled = db.themes.length < 2;
}

function themeChanged() {
  save();
  renderThemeFields();
  pushState();
}

// Field id -> theme property, and how to read the input's value.
const THEME_FIELDS = {
  thFont: ['font', (el) => el.value],
  thWeight: ['weight', (el) => +el.value],
  thSize: ['size', (el) => +el.value],
  thColor: ['color', (el) => el.value],
  thAlign: ['align', (el) => el.value],
  thValign: ['valign', (el) => el.value],
  thShadow: ['shadow', (el) => el.checked],
  thOutline: ['outline', (el) => el.checked],
  thUpper: ['uppercase', (el) => el.checked],
};
for (const [id, [prop, read]] of Object.entries(THEME_FIELDS)) {
  $(id).addEventListener('input', (e) => {
    editTheme()[prop] = read(e.target);
    themeChanged();
  });
}

$('thPick').onchange = (e) => {
  editThemeId = e.target.value;
  renderThemeFields();
};
$('thName').oninput = (e) => {
  editTheme().name = e.target.value || 'Untitled theme';
  save();
  renderThemeOptions();
};
$('thDefault').onchange = (e) => {
  if (e.target.checked) db.defaultThemeId = editTheme().id;
  save();
  renderThemeOptions();
  themeChanged();
};
$('thNew').onclick = () => {
  const copy = { ...structuredClone(editTheme()), id: `theme-${Date.now()}`, name: `${editTheme().name} copy` };
  db.themes.push(copy);
  editThemeId = copy.id;
  save();
  renderThemeOptions();
  renderThemeFields();
  $('thName').select();
};
$('thDelete').onclick = () => {
  const t = editTheme();
  if (db.themes.length < 2 || !confirm(`Delete theme "${t.name}"? Items using it switch to the default theme.`)) return;
  db.themes = db.themes.filter((x) => x !== t);
  for (const item of db.items) if (item.themeId === t.id) item.themeId = null;
  if (db.defaultThemeId === t.id) db.defaultThemeId = db.themes[0].id;
  editThemeId = db.defaultThemeId;
  save();
  renderThemeOptions();
  themeChanged();
};
$('thBgColor').oninput = (e) => {
  editTheme().bg = { type: 'color', color: e.target.value };
  themeChanged();
};
$('thBgMedia').onclick = async () => {
  const media = await window.easy.pickMedia();
  if (!media) return;
  editTheme().bg = media;
  themeChanged();
};
$('thBgNone').onclick = () => {
  editTheme().bg = null;
  themeChanged();
};
$('itemTheme').onchange = (e) => {
  const item = itemById(ui.selectedId);
  if (!item) return;
  item.themeId = e.target.value || null;
  e.target.blur(); // keep arrow keys for slides
  if (item.themeId) {
    editThemeId = item.themeId; // show the chosen theme in the editor
    renderThemeOptions();
    renderThemeFields();
  }
  save();
  pushState();
};

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
  if (!Array.isArray(db.themes) || !db.themes.length) {
    // Libraries saved before themes existed: turn the old global text style into the default theme.
    db.themes = structuredClone(SAMPLE.themes);
    if (db.style) Object.assign(db.themes[0], { font: db.style.font, size: db.style.size, color: db.style.color });
    db.defaultThemeId = db.themes[0].id;
  }
  delete db.style;
  editThemeId = defaultTheme().id;
  renderAll();
  pushState();
})();
