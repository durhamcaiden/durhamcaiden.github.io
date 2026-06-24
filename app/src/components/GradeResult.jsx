import { describeNextReview } from '../lib/spacedRepetition'

const SCORE_BADGE = {
  1: 'border-red-500/40 bg-red-500/10 text-red-400',
  2: 'border-red-500/40 bg-red-500/10 text-red-400',
  3: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
  4: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  5: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
}

function BulletSection({ title, items, toneClass }) {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className={`text-sm font-semibold mb-1.5 ${toneClass}`}>{title}</h3>
      <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default function GradeResult({ grade, intervalDays, onNext }) {
  const { score, correct, gaps, correctedModel } = grade

  return (
    <div className="space-y-5">
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${SCORE_BADGE[score]}`}
      >
        Score: {score} / 5
      </div>

      <BulletSection title="What you got right" items={correct} toneClass="text-emerald-400" />
      <BulletSection title="Wrong or missing" items={gaps} toneClass="text-red-400" />

      {correctedModel && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-1.5">Corrected mental model</h3>
          <p className="text-sm leading-relaxed text-slate-200">{correctedModel}</p>
        </div>
      )}

      {intervalDays && <p className="text-sm text-slate-500">Next review {describeNextReview(intervalDays)}.</p>}

      <button
        type="button"
        onClick={onNext}
        className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500"
      >
        Next question
      </button>
    </div>
  )
}
