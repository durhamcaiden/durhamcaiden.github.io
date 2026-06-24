import { useState } from 'react'
import objectivesData from './data/objectives.json'
import { hasApiKey } from './lib/anthropic'
import { useProgress } from './hooks/useProgress'
import DrillSession from './components/DrillSession'
import Dashboard from './components/Dashboard'

function NavButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
        active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function SetupGuard() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-xl font-bold">RecallRange needs an API key</h1>
        <p className="text-sm leading-relaxed text-slate-400">
          Copy <code className="text-indigo-300">.env.example</code> to <code className="text-indigo-300">.env</code>{' '}
          in the <code className="text-indigo-300">recallrange/</code> folder, set{' '}
          <code className="text-indigo-300">VITE_ANTHROPIC_API_KEY</code>, then restart the dev server.
        </p>
      </div>
    </div>
  )
}

function App() {
  const { progress, gradeObjective } = useProgress()
  const [view, setView] = useState('dashboard') // 'dashboard' | 'drill'
  const [forcedObjectiveId, setForcedObjectiveId] = useState(null)

  if (!hasApiKey()) {
    return <SetupGuard />
  }

  function handleDrillObjective(objectiveId) {
    setForcedObjectiveId(objectiveId)
    setView('drill')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-bold tracking-tight">
            Recall<span className="text-indigo-400">Range</span>
          </h1>
          <nav className="flex gap-1">
            <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')}>
              Dashboard
            </NavButton>
            <NavButton active={view === 'drill'} onClick={() => setView('drill')}>
              Drill
            </NavButton>
          </nav>
        </div>
      </header>

      <main>
        {view === 'dashboard' ? (
          <Dashboard objectivesData={objectivesData} progress={progress} onDrillObjective={handleDrillObjective} />
        ) : (
          <DrillSession
            objectivesData={objectivesData}
            progress={progress}
            onGraded={gradeObjective}
            forcedObjectiveId={forcedObjectiveId}
            onConsumeForcedObjective={() => setForcedObjectiveId(null)}
          />
        )}
      </main>
    </div>
  )
}

export default App
