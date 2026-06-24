/** Clickable list of weak objectives, worst-scoring first, so the learner can jump straight into a drill. */
export default function WeakObjectivesList({ weakObjectives, onDrill }) {
  if (weakObjectives.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No weak spots yet — attempt a few objectives and any that score low will show up here.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {weakObjectives.map(({ domain, objective, lastScore }) => (
        <li
          key={objective.id}
          className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-200">{objective.text}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {domain.name} · {objective.id} · scored {lastScore}/5
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDrill(objective.id)}
            className="shrink-0 rounded-md bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-300 transition hover:bg-indigo-600/30"
          >
            Drill this
          </button>
        </li>
      ))}
    </ul>
  )
}
