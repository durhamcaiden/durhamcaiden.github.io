// The core active-recall loop:
//   1. pick an objective (weighted toward weak domains + due reviews)
//   2. ask Claude for an open-ended question covering it
//   3. take a free-text answer — no options to recognize, pure recall
//   4. send the answer to Claude for grading, show the verdict
//   5. hand the score off to the spaced-repetition schedule and repeat

import { useEffect, useRef, useState } from 'react'
import { selectNextObjective, findObjective } from '../lib/objectiveSelector'
import { generateQuestion, gradeAnswer } from '../lib/anthropic'
import GradeResult from './GradeResult'

export default function DrillSession({ objectivesData, progress, onGraded, forcedObjectiveId, onConsumeForcedObjective }) {
  // Latest progress, readable inside effects without retriggering them on every grade.
  const progressRef = useRef(progress)
  progressRef.current = progress

  const [round, setRound] = useState(0) // bump to force a fresh objective pick
  const [picked, setPicked] = useState(null) // { domain, objective }
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [grade, setGrade] = useState(null)
  const [intervalDays, setIntervalDays] = useState(null)
  const [phase, setPhase] = useState('loading-question') // loading-question | answering | grading | result | error
  const [errorStage, setErrorStage] = useState(null) // 'question' | 'grading'
  const [errorMessage, setErrorMessage] = useState('')
  const [fetchAttempt, setFetchAttempt] = useState(0)

  // Step 1: pick which objective to drill — either forced from the dashboard's
  // "drill this" button, or the weighted selector favoring weak/due objectives.
  useEffect(() => {
    const next = forcedObjectiveId
      ? findObjective(objectivesData.domains, forcedObjectiveId)
      : selectNextObjective(objectivesData.domains, progressRef.current)
    setPicked(next)
    setAnswer('')
    setGrade(null)
    setQuestion('')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- progressRef is a ref; intentionally not re-picking on every progress change
  }, [forcedObjectiveId, round, objectivesData])

  // Step 2: fetch a fresh open-ended question whenever the picked objective changes.
  useEffect(() => {
    if (!picked) return
    let cancelled = false

    setPhase('loading-question')
    setErrorMessage('')
    ;(async () => {
      try {
        const q = await generateQuestion({
          exam: objectivesData.exam,
          domain: picked.domain,
          objective: picked.objective,
        })
        if (!cancelled) {
          setQuestion(q)
          setPhase('answering')
        }
      } catch (err) {
        if (!cancelled) {
          setErrorStage('question')
          setErrorMessage(err.message)
          setPhase('error')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [picked, fetchAttempt, objectivesData])

  // Step 4: grade the free-text answer and push the result into the spaced-repetition schedule.
  async function handleSubmit() {
    if (!answer.trim() || phase !== 'answering') return
    setPhase('grading')
    setErrorMessage('')
    try {
      const result = await gradeAnswer({ objective: picked.objective, question, answer })
      const nextState = onGraded(picked.objective.id, result)
      setGrade(result)
      setIntervalDays(nextState.intervalDays)
      setPhase('result')
    } catch (err) {
      setErrorStage('grading')
      setErrorMessage(err.message)
      setPhase('error') // answer text is preserved so the learner doesn't lose their work
    }
  }

  function handleNext() {
    onConsumeForcedObjective()
    setRound((r) => r + 1)
  }

  function handleRetry() {
    if (errorStage === 'question') {
      setFetchAttempt((a) => a + 1) // re-fetch a question for the SAME objective
    } else {
      setPhase('answering') // let them resubmit the same answer without re-asking the question
    }
  }

  if (!picked) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-slate-400">
        No objectives loaded. Add some to <code className="text-indigo-300">src/data/objectives.json</code>.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-400">
          {picked.domain.name} · {picked.objective.id}
        </p>
        <p className="mt-1 text-xs text-slate-500">{picked.objective.text}</p>
      </div>

      {phase === 'loading-question' && (
        <div className="animate-pulse text-slate-400">Generating question…</div>
      )}

      {phase === 'error' && (
        <div className="space-y-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-300">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-md bg-red-500/20 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {(phase === 'answering' || phase === 'grading') && (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed text-slate-100">{question}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={phase === 'grading'}
            rows={8}
            placeholder="Explain it in your own words, step by step. No hand-waving — be precise."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={phase === 'grading' || !answer.trim()}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {phase === 'grading' ? 'Grading…' : 'Submit for grading'}
          </button>
        </div>
      )}

      {phase === 'result' && grade && <GradeResult grade={grade} intervalDays={intervalDays} onNext={handleNext} />}
    </div>
  )
}
