# EasyDayeg (prototype)

Offline presentation software for worship and events, for macOS and Windows. See [PLAN.md](PLAN.md) for the MVP scope and roadmap.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer.

```bash
cd easydayeg
npm install
npm start
```

Three windows open:

- **Control**: the operator screen (library, playlist, slide grid, live preview, clears).
- **Output**: what the audience sees. With a second display connected it goes full screen there; otherwise it's a small preview window.
- **Stage**: confidence monitor with current slide, next slide and a clock. Uses a third display if there is one.

## Using it

- Click a library or playlist item to see its slides; click a slide to send it live.
- `→` / `Space` next slide (rolls into the next playlist item), `←` previous, `B` black, `C` clear text, `Esc` clear all.
- **+ New** or double-click an item to edit. A blank line in the lyrics starts a new slide. Each item can have its own image, video or colour background.
- Drag playlist entries to reorder.
- Everything saves automatically to `library.json` in the app's data folder (`~/Library/Application Support/EasyDayeg` on Mac, `%APPDATA%\EasyDayeg` on Windows).

## Build installers

```bash
npm run dist:mac   # on a Mac, produces a .dmg in dist/
npm run dist:win   # on Windows, produces an installer in dist/
```

## Layout

```
src/main.js          windows, displays, saving, file picker
src/preload.js       safe bridge between windows and main process
src/control/         operator UI
src/output/          audience output window
src/stage/           stage display window
src/shared/render.js slide renderer shared by output and live preview
```
