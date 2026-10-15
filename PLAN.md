# EasyDayeg: Plan

An offline, cross-platform (macOS + Windows) live presentation app for worship services and events, in the same category as ProPresenter. Everything runs locally: no account, no internet required.

## Who it's for

A volunteer operator at a church or event who needs to put song lyrics, scripture, announcements and media on a projector or TV, follow the service in real time, and show the band or speaker what's coming next on a confidence monitor.

## MVP features

1. **Library**: create, edit, search and delete presentations (songs, sermons, announcements). A song is entered as plain lyrics; a blank line starts a new slide.
2. **Playlist (service order)**: build tonight's running order from library items, reorder by drag, save and reopen playlists.
3. **Operator view**: grid of slide thumbnails for the selected item. Click or arrow keys to send a slide live. Live slide is highlighted.
4. **Audience output**: a separate borderless full-screen window on a chosen display (projector/TV) showing the live slide.
5. **Stage display**: a third window for a confidence monitor showing current slide, next slide and a clock.
6. **Backgrounds**: solid colour, image or looping video behind text; per-item default plus a global fallback.
7. **Layers and clears**: clear text, clear background, clear all (blackout), and a logo/"to black" state.
8. **Text styling**: font, size, colour, shadow/outline, alignment, with one theme applied to many items.
9. **Offline storage**: library, playlists and media references saved locally as JSON in the user's app-data folder; export/import a bundle for backup or moving machines.
10. **Keyboard-first**: Space/Right = next, Left = previous, B = black, C = clear text, Esc = clear all.

## Later (post-MVP)

- Bible module (offline translations such as KJV/WEB that are public domain)
- Import from ProPresenter, PowerPoint, OpenLyrics/CCLI SongSelect files
- Timers/countdowns, announcements loop, props and messages (e.g. "Parent needed in nursery")
- Audio playback and video transport controls
- NDI output and OBS integration, multiple output screens with different looks
- Remote control from a phone on the local network
- Code signing, auto-update, installers

## Recommended stack

| Concern | Choice | Why |
|---|---|---|
| App shell | **Electron** | One codebase for Mac and Windows; multiple windows on multiple displays is built in (`screen` API, `BrowserWindow` per output). Video/image rendering is just Chromium. |
| UI | Plain HTML/CSS/JS for the prototype; move to React + TypeScript once the shape settles | Keeps the prototype readable; React pays off as screens grow. |
| Storage | JSON files in `app.getPath('userData')`, later SQLite (better-sqlite3) when the library gets large | Fully offline, easy backup. |
| Packaging | electron-builder (DMG for Mac, NSIS installer for Windows) | Standard, supports signing and notarisation. |

Tauri is the lighter alternative (smaller installers), but its webviews differ per OS (WebKit on Mac, WebView2 on Windows), which makes video playback and font rendering less consistent across the two. Electron is the safer bet for a media app.

## Milestones

1. **Prototype (done in this folder)**: library, playlist, operator view, audience output on a second display, stage display, backgrounds, clears, keyboard shortcuts, local JSON save.
2. **Usable MVP**: text themes (done), media bin with drag-drop, playlist save/open, export/import, settings screen for display assignment.
3. **Service-ready**: Bible module, timers, messages, stability on long services, crash recovery.
4. **Ship**: installers, code signing, auto-update, user guide.

## Prototype

See [README.md](README.md) in this folder for how to run it.
