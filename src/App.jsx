import { useMemo, useState } from 'react'
import { loadEntries, addEntry, updateEntry, deleteEntry, todayISO } from './lib/storage'
import { getExerciseCatalog } from './lib/exercises'
import HomeView from './components/HomeView'
import PlanView from './components/PlanView'
import LogExerciseView from './components/LogExerciseView'
import ExerciseForm from './components/ExerciseForm'
import RestForm from './components/RestForm'

function App() {
  const [entries, setEntries] = useState(() => loadEntries())
  const [screen, setScreen] = useState('home')
  const [activeEntryId, setActiveEntryId] = useState(null)
  const [editReturnScreen, setEditReturnScreen] = useState('home')

  const today = useMemo(() => todayISO(), [])
  const [selectedDate, setSelectedDate] = useState(today)
  const catalog = useMemo(() => getExerciseCatalog(entries), [entries])
  const activeEntry = entries.find((e) => e.id === activeEntryId) ?? null

  function handleAdd(entryData) {
    addEntry(entryData)
    setEntries(loadEntries())
  }

  function handleAddRest(entryData) {
    handleAdd({ ...entryData, type: 'rest', status: 'planned', actualSeconds: null, startedAt: null })
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
        <h1 className="page-title">Log exercise</h1>
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
        onLogFly={() => setScreen('log-fly')}
        onOpenLog={openLog}
        onEdit={(entry) => openEdit(entry, 'home')}
        onDelete={handleDelete}
        onStartRest={handleStartRest}
        onFinishRest={handleFinishRest}
        onCancelRestTimer={handleCancelRestTimer}
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
