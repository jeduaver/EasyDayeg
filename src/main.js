const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const dataFile = () => path.join(app.getPath('userData'), 'library.json');
let control, output, stage;
let lastState = null;

function pickDisplays() {
  const primary = screen.getPrimaryDisplay();
  const others = screen.getAllDisplays().filter((d) => d.id !== primary.id);
  return { primary, outputDisplay: others[0], stageDisplay: others[1] };
}

function createControl() {
  control = new BrowserWindow({
    width: 1400,
    height: 860,
    title: 'EasyDayeg',
    backgroundColor: '#1b1d22',
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  control.loadFile(path.join(__dirname, 'control', 'index.html'));
  control.on('closed', () => app.quit());
}

function createScreenWindow(kind, display) {
  const opts = {
    title: kind === 'output' ? 'EasyDayeg Output' : 'EasyDayeg Stage',
    backgroundColor: '#000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  };
  if (display) {
    // A real second/third screen: borderless and fullscreen on it.
    Object.assign(opts, { ...display.bounds, frame: false, fullscreen: true });
  } else {
    // Only one screen (e.g. a laptop): show a resizable preview window instead.
    Object.assign(opts, { width: 640, height: 360 });
  }
  const win = new BrowserWindow(opts);
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, kind, 'index.html'));
  win.webContents.on('did-finish-load', () => lastState && win.webContents.send('state', lastState));
  return win;
}

function openOutput() {
  if (output && !output.isDestroyed()) return output.focus();
  output = createScreenWindow('output', pickDisplays().outputDisplay);
}

function openStage() {
  if (stage && !stage.isDestroyed()) return stage.focus();
  stage = createScreenWindow('stage', pickDisplays().stageDisplay);
}

ipcMain.on('state', (_e, state) => {
  lastState = state;
  for (const w of [output, stage]) if (w && !w.isDestroyed()) w.webContents.send('state', state);
});

ipcMain.on('open-window', (_e, kind) => (kind === 'output' ? openOutput() : openStage()));

ipcMain.handle('load-library', () => {
  try {
    return JSON.parse(fs.readFileSync(dataFile(), 'utf8'));
  } catch {
    return null;
  }
});

ipcMain.handle('save-library', (_e, data) => {
  fs.mkdirSync(path.dirname(dataFile()), { recursive: true });
  fs.writeFileSync(dataFile(), JSON.stringify(data, null, 2));
  return true;
});

ipcMain.handle('pick-media', async () => {
  const res = await dialog.showOpenDialog(control, {
    properties: ['openFile'],
    filters: [{ name: 'Images and video', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm', 'm4v'] }],
  });
  if (res.canceled || !res.filePaths[0]) return null;
  const file = res.filePaths[0];
  const isVideo = /\.(mp4|mov|webm|m4v)$/i.test(file);
  return { type: isVideo ? 'video' : 'image', src: pathToFileURL(file).href, name: path.basename(file) };
});

app.whenReady().then(() => {
  createControl();
  openOutput();
  openStage();
});

app.on('window-all-closed', () => app.quit());
