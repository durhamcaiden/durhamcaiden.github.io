const TONE_CLASS = {
  unattempted: 'border-slate-700 bg-slate-800/40 text-slate-500',
  weak: 'border-red-500/40 bg-red-500/10 text-red-400',
  shaky: 'border-orange-500/40 bg-orange-500/10 text-orange-400',
  ok: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  strong: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
}

function masteryTone(mastery) {
  if (mastery === null) return 'unattempted'
  if (mastery < 2) return 'weak'
  if (mastery < 3) return 'shaky'
  if (mastery < 4) return 'ok'
  return 'strong'
}

/** Grid of per-domain cards, colored by mastery so weak domains stand out at a glance. */
export default function MasteryHeatmap({ domainStats }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {domainStats.map((domain) => (
        <div key={domain.id} className={`rounded-lg border p-4 ${TONE_CLASS[masteryTone(domain.mastery)]}`}>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-100">{domain.name}</h3>
            <span className="shrink-0 text-xs text-slate-500">{domain.weight}% of exam</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{domain.mastery === null ? '—' : domain.mastery.toFixed(1)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {domain.attempted}/{domain.total} attempted
          </p>
        </div>
      ))}
    </div>
  )
}
