import { getCoverage, getDomainStats, getDueCount, getWeakObjectives } from '../lib/stats'
import MasteryHeatmap from './MasteryHeatmap'
import WeakObjectivesList from './WeakObjectivesList'

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-center">
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  )
}

export default function Dashboard({ objectivesData, progress, onDrillObjective }) {
  const { domains } = objectivesData
  const domainStats = getDomainStats(domains, progress)
  const coverage = getCoverage(domains, progress)
  const dueCount = getDueCount(domains, progress)
  const weakObjectives = getWeakObjectives(domains, progress)

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Due today" value={dueCount} />
        <StatCard label="Streak" value={progress.streak.current} />
        <StatCard label="Coverage" value={`${coverage}%`} />
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Mastery by domain</h2>
        <MasteryHeatmap domainStats={domainStats} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Weak objectives</h2>
        <WeakObjectivesList weakObjectives={weakObjectives} onDrill={onDrillObjective} />
      </section>
    </div>
  )
}
