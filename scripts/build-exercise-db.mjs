// Regenerates src/data/exercises.json from the free-exercise-db project
// (https://github.com/yuhonas/free-exercise-db, Unlicense / public domain).
// Run by hand: `node scripts/build-exercise-db.mjs`. The output is committed so
// the app build never needs the network.
import { writeFileSync } from 'node:fs'

const SOURCE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'

const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
const all = await res.json()

// [name, primary muscle, equipment, category] — instructions and images are
// dropped to keep the bundle small (~50 KB instead of ~1 MB).
const slim = all.map((e) => [e.name, e.primaryMuscles?.[0] ?? null, e.equipment ?? null, e.category ?? null])
slim.sort((a, b) => a[0].localeCompare(b[0]))

writeFileSync(new URL('../src/data/exercises.json', import.meta.url), JSON.stringify(slim))
console.log(`Wrote ${slim.length} exercises`)
