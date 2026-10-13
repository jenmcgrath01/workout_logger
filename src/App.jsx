import { useMemo, useState } from 'react'
import { loadEntries, addEntry, addEntries, updateEntry, deleteEntry, swapEntries, todayISO } from './lib/storage'
import { getExerciseCatalog } from './lib/exercises'
import { loadThemes, setDayTheme, getThemeCatalog } from './lib/themes'
import { loadCustom, addCustom } from './lib/customExercises'
import { loadEquipment, saveEquipment } from './lib/equipment'
import { unlockAudio } from './lib/audio'
import { firstUnfinished, needsRestStart, nextLiveIndex, stepIds } from './lib/runner'
import HomeView from './components/HomeView'
import PlanView from './components/PlanView'
import LogExerciseView from './components/LogExerciseView'
import ExerciseForm from './components/ExerciseForm'
import RestForm from './components/RestForm'
import CardioForm from './components/CardioForm'
import RunView from './components/RunView'

function App() {
  const [entries, setEntries] = useState(() => loadEntries())
  const [screen, setScreen] = useState('home')
  const [activeEntryId, setActiveEntryId] = useState(null)
  const [editReturnScreen, setEditReturnScreen] = useState('home')
  const [flyType, setFlyType] = useState('exercise')
  // The guided workout: { ids, index, skipped, startedAt }, or null when not running.
  const [run, setRun] = useState(null)

  const today = useMemo(() => todayISO(), [])
  const [selectedDate, setSelectedDate] = useState(today)
  const catalog = useMemo(() => getExerciseCatalog(entries), [entries])
  const cardioCatalog = useMemo(() => getExerciseCatalog(entries, 'cardio'), [entries])
  const [themes, setThemes] = useState(() => loadThemes())
  const [custom, setCustom] = useState(() => loadCustom())
  const [equipment, setEquipment] = useState(() => loadEquipment())
  const themeCatalog = useMemo(() => getThemeCatalog(themes), [themes])
  const activeEntry = entries.find((e) => e.id === activeEntryId) ?? null

  function handleAdd(entryData) {
    addEntry(entryData)
    setEntries(loadEntries())
  }

  function handleAddRest(entryData) {
    handleAdd({ ...entryData, type: 'rest', status: 'planned', actualSeconds: null, startedAt: null })
  }

  function handleAddMany(drafts) {
    addEntries(drafts)
    setEntries(loadEntries())
  }

  function handleAddCardio(entryData) {
    handleAdd({ ...entryData, type: 'cardio' })
  }

  function handlePersist(id, updates) {
    updateEntry(id, updates)
    setEntries(loadEntries())
  }

  function handleDelete(entry) {
    const label = entry.type === 'rest' ? 'this rest' : entry.exerciseName
    if (!window.confirm(`Delete ${label}?`)) return
    deleteEntry(entry.id)
    setEntries(loadEntries())
    if (activeEntryId === entry.id) {
      setActiveEntryId(null)
      setScreen('home')
    }
  }

  function handleAddCustom(name, info) {
    setCustom({ ...addCustom(name, info) })
  }

  function handleEquipmentChange(list) {
    saveEquipment(list)
    setEquipment(list)
  }

  function handleSaveTheme(date, theme) {
    setThemes({ ...setDayTheme(date, theme) })
  }

  function handleSwap(idA, idB) {
    swapEntries(idA, idB)
    setEntries(loadEntries())
  }

  function handleStartRest(entry) {
    handlePersist(entry.id, { startedAt: Date.now() })
  }

  function handleFinishRest(entry, actualSeconds) {
    handlePersist(entry.id, { status: 'completed', actualSeconds })
  }

  function handleCancelRestTimer(entry) {
    handlePersist(entry.id, { startedAt: null })
  }

  function openLog(entry) {
    setActiveEntryId(entry.id)
    setScreen('log')
  }

  function openEdit(entry, fromScreen) {
    setActiveEntryId(entry.id)
    setEditReturnScreen(fromScreen)
    setScreen('edit')
  }

  function goHome() {
    setActiveEntryId(null)
    setRun(null)
    setScreen('home')
  }

  // ---- Guided workout ("execute the workout") ----

  // Start the timer of a rest that is about to be shown, if it hasn't started.
  function startRestIfNeeded(list, id) {
    const target = list.find((e) => e.id === id)
    if (needsRestStart(target)) handlePersist(target.id, { startedAt: Date.now() })
  }

  function startRun() {
    unlockAudio() // iOS only plays audio started from a tap
    const ids = stepIds(entries, selectedDate)
    const index = firstUnfinished(ids, entries)
    if (index >= ids.length) return
    startRestIfNeeded(entries, ids[index])
    setRun({ ids, index, skipped: [], startedAt: Date.now() })
    setScreen('run')
  }

  function advanceRun(list, skipId) {
    const next = nextLiveIndex(run.ids, list, run.index)
    startRestIfNeeded(list, run.ids[next])
    setRun((r) => ({ ...r, index: next, skipped: skipId ? [...r.skipped, skipId] : r.skipped }))
  }

  // A rest right after the exercise you just finished starts counting now,
  // even if you are still looking at that exercise.
  function startRestAfterCurrent() {
    const list = loadEntries()
    startRestIfNeeded(list, run.ids[nextLiveIndex(run.ids, list, run.index)])
  }

  function handleRunCompleteStrength(entry, updates) {
    handlePersist(entry.id, { ...updates, status: 'completed' })
    startRestAfterCurrent()
  }

  function handleRunCompleteCardio(entry, data) {
    handlePersist(entry.id, { ...data, status: 'completed' })
    startRestAfterCurrent()
  }

  function handleRunFinishRest(entry, actualSeconds) {
    handlePersist(entry.id, { status: 'completed', actualSeconds })
    advanceRun(loadEntries())
  }

  function handleRunSkipRest(entry) {
    handlePersist(entry.id, { startedAt: null })
    advanceRun(loadEntries(), entry.id)
  }

  function handleRunRemove(entry) {
    if (!window.confirm(`Remove ${entry.exerciseName} from the workout?`)) return
    deleteEntry(entry.id)
    setEntries(loadEntries())
    advanceRun(loadEntries())
  }

  let content
  if (screen === 'plan') {
    content = (
      <PlanView
        entries={entries}
        initialDate={selectedDate}
        catalog={catalog}
        custom={custom}
        onAddCustom={handleAddCustom}
        equipment={equipment}
        onEquipmentChange={handleEquipmentChange}
        onAddExercise={handleAdd}
        onAddRest={handleAddRest}
        onAddCardio={handleAddCardio}
        onAddMany={handleAddMany}
        cardioCatalog={cardioCatalog}
        onSwap={handleSwap}
        themes={themes}
        themeCatalog={themeCatalog}
        onSaveTheme={handleSaveTheme}
        onEdit={(entry) => openEdit(entry, 'plan')}
        onDelete={handleDelete}
        onDone={goHome}
      />
    )
  } else if (screen === 'run' && run) {
    content = (
      <RunView
        entries={entries}
        run={run}
        cardioCatalog={cardioCatalog}
        onBack={goHome}
        onPersist={handlePersist}
        onCompleteStrength={handleRunCompleteStrength}
        onCompleteCardio={handleRunCompleteCardio}
        onFinishRest={handleRunFinishRest}
        onSkipRest={handleRunSkipRest}
        onStartRest={handleStartRest}
        onNext={() => advanceRun(loadEntries())}
        onSkip={(entry) => advanceRun(loadEntries(), entry.id)}
        onRemove={handleRunRemove}
        onFinish={goHome}
      />
    )
  } else if (screen === 'log-fly') {
    content = (
      <div className="log-fly-view">
        <button type="button" className="btn btn--link" onClick={goHome}>
          ← Back
        </button>
        <h1 className="page-title">Log on the fly</h1>
        <div className="segmented">
          <button
            type="button"
            className={`segmented__btn ${flyType === 'exercise' ? 'is-active' : ''}`}
            onClick={() => setFlyType('exercise')}
          >
            Exercise
          </button>
          <button
            type="button"
            className={`segmented__btn ${flyType === 'cardio' ? 'is-active' : ''}`}
            onClick={() => setFlyType('cardio')}
          >
            Cardio
          </button>
        </div>
        {flyType === 'cardio' ? (
          <CardioForm
            mode="log"
            date={selectedDate}
            catalog={cardioCatalog}
            onSave={(entryData) => {
              handleAddCardio(entryData)
              goHome()
            }}
            onCancel={goHome}
          />
        ) : (
          <ExerciseForm
            mode="log"
            date={selectedDate}
            entries={entries}
            catalog={catalog}
            custom={custom}
            onAddCustom={handleAddCustom}
            equipment={equipment}
            onSave={(entryData) => {
              handleAdd(entryData)
              goHome()
            }}
            onCancel={goHome}
          />
        )}
      </div>
    )
  } else if (screen === 'log' && activeEntry && activeEntry.type === 'cardio') {
    content = (
      <div className="log-fly-view">
        <button type="button" className="btn btn--link" onClick={goHome}>
          ← Back
        </button>
        <h1 className="page-title">Log cardio</h1>
        <CardioForm
          mode="log"
          entry={activeEntry}
          catalog={cardioCatalog}
          onSave={(entryData) => {
            handlePersist(activeEntry.id, entryData)
            goHome()
          }}
          onCancel={goHome}
        />
      </div>
    )
  } else if (screen === 'log' && activeEntry) {
    content = (
      <LogExerciseView
        entry={activeEntry}
        onPersist={(updates) => handlePersist(activeEntry.id, updates)}
        onComplete={(updates) => {
          handlePersist(activeEntry.id, { ...updates, status: 'completed' })
          goHome()
        }}
        onBack={goHome}
      />
    )
  } else if (screen === 'edit' && activeEntry && activeEntry.type === 'rest') {
    content = (
      <div className="edit-view">
        <button type="button" className="btn btn--link" onClick={() => setScreen(editReturnScreen)}>
          ← Back
        </button>
        <h1 className="page-title">Edit rest</h1>
        <RestForm
          entry={activeEntry}
          onSave={(entryData) => {
            handlePersist(activeEntry.id, entryData)
            setScreen(editReturnScreen)
          }}
          onCancel={() => setScreen(editReturnScreen)}
        />
      </div>
    )
  } else if (screen === 'edit' && activeEntry && activeEntry.type === 'cardio') {
    content = (
      <div className="edit-view">
        <button type="button" className="btn btn--link" onClick={() => setScreen(editReturnScreen)}>
          ← Back
        </button>
        <h1 className="page-title">Edit cardio</h1>
        <CardioForm
          mode="edit"
          entry={activeEntry}
          catalog={cardioCatalog}
          onSave={(entryData) => {
            handlePersist(activeEntry.id, entryData)
            setScreen(editReturnScreen)
          }}
          onCancel={() => setScreen(editReturnScreen)}
        />
      </div>
    )
  } else if (screen === 'edit' && activeEntry) {
    content = (
      <div className="edit-view">
        <button type="button" className="btn btn--link" onClick={() => setScreen(editReturnScreen)}>
          ← Back
        </button>
        <h1 className="page-title">Edit exercise</h1>
        <ExerciseForm
          mode="edit"
          entry={activeEntry}
          date={activeEntry.date}
          catalog={catalog}
          custom={custom}
          onAddCustom={handleAddCustom}
          equipment={equipment}
          onSave={(entryData) => {
            handlePersist(activeEntry.id, entryData)
            setScreen(editReturnScreen)
          }}
          onCancel={() => setScreen(editReturnScreen)}
        />
      </div>
    )
  } else {
    content = (
      <HomeView
        entries={entries}
        today={today}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onStartPlan={() => setScreen('plan')}
        onStartRun={startRun}
        onLogFly={() => {
          setFlyType('exercise')
          setScreen('log-fly')
        }}
        onOpenLog={openLog}
        onEdit={(entry) => openEdit(entry, 'home')}
        onDelete={handleDelete}
        onStartRest={handleStartRest}
        onFinishRest={handleFinishRest}
        onCancelRestTimer={handleCancelRestTimer}
        theme={themes[selectedDate] ?? ''}
        themeCatalog={themeCatalog}
        onSaveTheme={handleSaveTheme}
      />
    )
  }

  return (
    <div className="app">
      <main className="app__content">{content}</main>
    </div>
  )
}

export default App
