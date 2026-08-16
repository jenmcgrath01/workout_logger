# Workout Tracker — v1 Spec

## Overview
A personal workout logging app for tracking weight-training exercises: sets, reps, and weight. Optimized for fast entry during a workout, on a phone, with zero setup.

**This is v1.** Deliberately scoped small. See "Deferred" section at the bottom for what's intentionally left out — do not build those unless asked.

## Goals
- Let the user plan a workout session before starting (exercises + target sets/reps/weight)
- Let the user log actual weights/reps quickly during the workout, pre-filled from the plan
- Let the user log an unplanned exercise on the fly
- Show workout history, grouped by day
- Allow editing/deleting any entry
- Work entirely offline, no login, no backend

## Non-Goals (for v1)
- No cardio or mobility/stretching tracking (data model should allow adding these later without a schema rewrite — see Data Model)
- No reusable named templates (e.g. "Push Day") — just one-off daily plans for now
- No charts, graphs, or progress trends
- No plan-vs-actual comparison/analytics
- No rest timer
- No cross-device sync, no accounts, no cloud storage
- No export/backup

## Platform & Tech
- Single-page web app: one HTML file with embedded CSS and JS (no build step, no framework required — plain JS is fine unless there's good reason otherwise)
- Must work well as a home-screen web app on a phone (add to home screen, full-width mobile layout, large tap targets — this gets used mid-set)
- Data persisted in the browser's local storage. No server, no network calls, no login.
- Units: pounds (lbs) only for v1.

## Data Model

Every logged/planned exercise is one entry. A "plan" and a "log" are the same object — an entry just moves from `planned` to `completed` status. This avoids a separate template/plan system.

```json
{
  "id": "uuid",
  "date": "2026-08-16",
  "exerciseName": "Bench Press",
  "type": "strength",          // reserved values for future: "cardio", "mobility" — not implemented in v1, but the field must exist now
  "status": "planned",          // "planned" | "completed"
  "sets": [
    { "targetWeight": 135, "targetReps": 10, "actualWeight": null, "actualReps": null },
    { "targetWeight": 135, "targetReps": 10, "actualWeight": null, "actualReps": null }
  ],
  "notes": ""
}
```

Notes on the schema:
- Each set has independent target and actual weight/reps — sets are NOT assumed to be uniform (pyramids, drop sets, etc. must be supported).
- For an unplanned/on-the-fly entry, skip target fields (or set them equal to actual) and set `status: "completed"` directly.
- `exerciseName` values should be collected into an implicit "exercise catalog" (just the distinct set of names already used) to power autocomplete — no separate management screen needed for this in v1.

## Core Features

### 1. Plan a session
- Before starting a workout, user adds one or more exercises to a plan for a given date (defaults to today, but date should be editable/backdatable).
- For each exercise: pick name (autocomplete from previously used exercise names, or type a new one), then add one or more target sets, each with target weight + target reps.
- Saved as entries with `status: "planned"`.

### 2. Work the plan
- User sees their planned exercises for today's session, in the order added.
- Opening a planned exercise shows its sets pre-filled with target weight/reps.
- User confirms or edits actual weight/reps per set, then marks the exercise `completed`.
- Partially-completed sessions must persist if the app is closed mid-workout (nothing is lost).

### 3. Log on the fly
- User can add a new exercise directly as `completed` at any point (not just from a plan) — same entry form, just skips the "planned" stage.

### 4. View history
- List of completed entries, grouped by date, most recent day first.
- Each group shows the exercises done that day, and each exercise shows all its sets (actual weight × reps).

### 5. Edit / delete
- Any entry (planned or completed) can be edited or deleted.
- Editing an entry means editing its exercise name, sets (weight/reps), or notes.

### 6. Notes
- Each entry has an optional free-text notes field (e.g. "felt heavy," "left shoulder tweak").

## UI Flow (suggested, not prescriptive)
1. **Home / Today view** — shows today's planned exercises (if any) and a way to start planning or log something on the fly.
2. **Plan view** — add exercises + target sets for the current session.
3. **Log view** (per exercise) — shows target sets pre-filled, lets user enter actual weight/reps per set, mark complete.
4. **History view** — past days, most recent first, expandable per day to see exercises/sets.

Claude Code has latitude on exact screen layout/navigation as long as the flow above is achievable with minimal taps — entry speed during a workout is the top usability priority.

## Acceptance Criteria
- [ ] Can create a plan for today with 2+ exercises, each with 2+ target sets
- [ ] Can open a planned exercise and log actual weight/reps per set, pre-filled from targets
- [ ] Can log a brand-new exercise on the fly without it being planned first
- [ ] Can edit an existing entry's sets after saving
- [ ] Can delete an entry
- [ ] History view correctly groups completed entries by date, most recent first
- [ ] Exercise name autocomplete suggests previously used names
- [ ] Refreshing the page or closing/reopening the browser does not lose any data
- [ ] Usable one-handed on a phone screen; tap targets are comfortably large

## Deferred to Later Phases (do not build now)
- Reusable named templates (e.g. save "Push Day" and reuse it across sessions)
- Cardio and mobility/stretching logging
- Progress charts and trends over time
- Plan-vs-actual comparison/analytics
- Rest timer between sets
- Cross-device sync / accounts
- Export or backup of data
