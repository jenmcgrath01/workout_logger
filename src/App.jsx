import { useMemo, useState } from 'react'
import { loadEntries, addEntry, updateEntry, deleteEntry, swapEntries, todayISO } from './lib/storage'
import { getExerciseCatalog } from './lib/exercises'
import { loadThemes, setDayTheme, getThemeCatalog } from './lib/themes'
import HomeView from './components/HomeView'
import PlanView from './components/PlanView'
import LogExerciseView from './components/LogExerciseView'
import ExerciseForm from './components/ExerciseForm'
import RestForm from './components/RestForm'
import CardioForm from './components/CardioForm'

function App() {
  const [entries, setEntries] = useState(() => loadEntries())
  const [screen, setScreen] = useState('home')
  const [activeEntryId, setActiveEntryId] = useState(null)
  const [editReturnScreen, setEditReturnScreen] = useState('home')
  const [flyType, setFlyType] = useState('exercise')

  const today = useMemo(() => todayISO(), [])
  const [selectedDate, setSelectedDate] = useState(today)
  const catalog = useMemo(() => getExerciseCatalog(entries), [entries])
  const cardioCatalog = useMemo(() => getExerciseCatalog(entries, 'cardio'), [entries])
  const [themes, setThemes] = useState(() => loadThemes())
  const themeCatalog = useMemo(() => getThemeCatalog(themes), [themes])
  const activeEntry = entries.find((e) => e.id === activeEntryId) ?? null

  function handleAdd(entryData) {
    addEntry(entryData)
    setEntries(loadEntries())
  }

  function handleAddRest(entryData) {
    handleAdd({ ...entryData, type: 'rest', status: 'planned', actualSeconds: null, startedAt: null })
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
    setScreen('home')
  }

  let content
  if (screen === 'plan') {
    content = (
      <PlanView
        entries={entries}
        initialDate={selectedDate}
        catalog={catalog}
        onAddExercise={handleAdd}
        onAddRest={handleAddRest}
        onAddCardio={handleAddCardio}
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
            catalog={catalog}
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
