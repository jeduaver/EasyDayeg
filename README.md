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
- **Themes** (right panel) hold a reusable look: font, weight, size, colour, alignment, position (top, middle or lower third), shadow, outline, all caps and an optional background. Pick a theme for the selected item from the menu next to **Edit**; items without one use the theme marked ★. **+ New** copies the current theme so you can tweak it. Background order: the item's own background, then its theme's, then the default background.
- Everything saves automatically to `library.json` in the app's data folder (`~/Library/Application Support/EasyDayeg` on Mac, `%APPDATA%\EasyDayeg` on Windows).

## Build installers

Every push to `main` and every pull request builds installers on GitHub's Mac and Windows machines (see `.github/workflows/build.yml`). Download them from the run's **Artifacts** section on the Actions tab:

- `EasyDayeg-macOS`: `.dmg` files for Apple Silicon (`arm64`) and Intel (`x64`) Macs
- `EasyDayeg-Windows`: a `.exe` installer for 64-bit Windows

Pushing a tag like `v0.1.0` also attaches the installers to a GitHub Release.

To build on your own machine instead:

```bash
npm run dist:mac   # on a Mac, writes .dmg files to dist/
npm run dist:win   # on Windows, writes an installer to dist/
```

The builds are not code-signed yet. On a Mac, the first time you open it, right-click the app and choose **Open** (or allow it under System Settings → Privacy & Security). On Windows, SmartScreen may warn; choose **More info → Run anyway**. Signing needs an Apple Developer account and a Windows code-signing certificate.

## Layout

```
src/main.js          windows, displays, saving, file picker
src/preload.js       safe bridge between windows and main process
src/control/         operator UI
src/output/          audience output window
src/stage/           stage display window
src/shared/render.js slide renderer shared by output and live preview
```
