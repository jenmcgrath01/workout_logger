import { useMemo, useState } from 'react'
import { loadEntries, addEntry, updateEntry, deleteEntry, todayISO } from './lib/storage'
import { getExerciseCatalog } from './lib/exercises'
import HomeView from './components/HomeView'
import PlanView from './components/PlanView'
import HistoryView from './components/HistoryView'
import LogExerciseView from './components/LogExerciseView'
import ExerciseForm from './components/ExerciseForm'

function App() {
  const [entries, setEntries] = useState(() => loadEntries())
  const [screen, setScreen] = useState('home')
  const [activeEntryId, setActiveEntryId] = useState(null)
  const [editReturnScreen, setEditReturnScreen] = useState('home')

  const today = useMemo(() => todayISO(), [])
  const catalog = useMemo(() => getExerciseCatalog(entries), [entries])
  const activeEntry = entries.find((e) => e.id === activeEntryId) ?? null

  function handleAdd(entryData) {
    addEntry(entryData)
    setEntries(loadEntries())
  }

  function handlePersist(id, updates) {
    updateEntry(id, updates)
    setEntries(loadEntries())
  }

  function handleDelete(entry) {
    if (!window.confirm(`Delete ${entry.exerciseName}?`)) return
    deleteEntry(entry.id)
    setEntries(loadEntries())
    if (activeEntryId === entry.id) {
      setActiveEntryId(null)
      setScreen('home')
    }
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
        today={today}
        catalog={catalog}
        onAddExercise={handleAdd}
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
          date={today}
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
  } else if (screen === 'history') {
    content = (
      <HistoryView entries={entries} onEdit={(entry) => openEdit(entry, 'history')} onDelete={handleDelete} onBack={goHome} />
    )
  } else {
    content = (
      <HomeView
        entries={entries}
        today={today}
        onStartPlan={() => setScreen('plan')}
        onLogFly={() => setScreen('log-fly')}
        onOpenLog={openLog}
        onEdit={(entry) => openEdit(entry, 'home')}
        onDelete={handleDelete}
      />
    )
  }

  const showTabs = screen === 'home' || screen === 'history'

  return (
    <div className="app">
      <main className="app__content">{content}</main>
      {showTabs && (
        <nav className="tab-bar">
          <button type="button" className={`tab-bar__btn ${screen === 'home' ? 'is-active' : ''}`} onClick={goHome}>
            Today
          </button>
          <button
            type="button"
            className={`tab-bar__btn ${screen === 'history' ? 'is-active' : ''}`}
            onClick={() => setScreen('history')}
          >
            History
          </button>
        </nav>
      )}
    </div>
  )
}

export default App
