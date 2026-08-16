# workout_logger

Simple way to log my workouts on my phone so I can see how much I'm lifting.

A single-page React app for planning workout sessions and logging sets/reps/weight during a workout. No login, no backend — everything is stored locally in the browser (`localStorage`).

## Use it on your phone

Open this on your phone in Safari (iOS) or Chrome (Android):

**https://jenmcgrath01.github.io/workout_logger/**

Then add it to your home screen for an app-like shortcut:

- **iOS**: tap the Share button → **Add to Home Screen**
- **Android**: tap the ⋮ menu → **Add to Home screen**

Your workout data stays in that browser's local storage tied to this URL — it isn't synced anywhere, so use the same device/browser each time.

## Development

Requires Node.js + npm.

```bash
npm install
npm run dev
```

This starts a local Vite dev server with hot reload.

## Build & deploy

The production build compiles everything (JS + CSS) into a single self-contained HTML file — no separate assets, so it also works when copied and opened directly from a phone's filesystem (`file://`).

```bash
npm run build
```

This outputs `dist/workout_logger.html`.

To publish an update to the live GitHub Pages site, copy the build into `docs/` (which is what Pages serves from) and push:

```bash
npm run build
cp dist/workout_logger.html docs/index.html
git add docs/index.html
git commit -m "Deploy update"
git push
```

GitHub Pages is configured to serve from the `main` branch, `/docs` folder.

## Tech stack

- React + Vite (plain JS, no TypeScript)
- [`vite-plugin-singlefile`](https://github.com/richardtallent/vite-plugin-singlefile) to bundle the production build into one HTML file
- `localStorage` for persistence — no backend, no accounts, no sync

See [workout-tracker-spec.md](workout-tracker-spec.md) for the full v1 feature spec.
