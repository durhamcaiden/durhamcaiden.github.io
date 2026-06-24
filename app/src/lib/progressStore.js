// localStorage-backed progress state. This is the only persistence layer in
// the app — there's no backend, so everything a learner cares about
// (per-objective review schedule, score history, streak) lives in one JSON
// blob under a single key.

import { scheduleNextReview } from './spacedRepetition'

const STORAGE_KEY = 'recallrange.progress.v1'
const MAX_HISTORY_PER_OBJECTIVE = 20
const DAY_MS = 24 * 60 * 60 * 1000

export function createEmptyProgress() {
  return {
    version: 1,
    objectives: {}, // objectiveId -> { repetitionIndex, dueAt, lastScore, history, lastResult }
    streak: { current: 0, longest: 0, lastStudyDate: null },
  }
}

/** Reads progress from localStorage, falling back to an empty state if it's missing, corrupt, or unavailable. */
export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyProgress()

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.objectives !== 'object' || typeof parsed.streak !== 'object') {
      return createEmptyProgress()
    }
    return { ...createEmptyProgress(), ...parsed }
  } catch (err) {
    console.error('RecallRange: failed to load saved progress, starting fresh.', err)
    return createEmptyProgress()
  }
}

/** Persists progress to localStorage. Swallows errors (e.g. quota exceeded, private browsing) rather than crashing. */
export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch (err) {
    console.error('RecallRange: failed to save progress.', err)
  }
}

/** Local calendar-day key (YYYY-MM-DD) for streak comparisons. en-CA locale conveniently formats as ISO order. */
function dateKey(ms) {
  return new Date(ms).toLocaleDateString('en-CA')
}

function updateStreak(streak, now) {
  const today = dateKey(now)
  if (streak.lastStudyDate === today) return streak // already counted today

  const yesterday = dateKey(now - DAY_MS)
  const current = streak.lastStudyDate === yesterday ? streak.current + 1 : 1

  return {
    current,
    longest: Math.max(streak.longest, current),
    lastStudyDate: today,
  }
}

/**
 * Records a graded attempt and returns a NEW progress object (immutable
 * update, so React state updates and re-renders correctly).
 *
 * @param {object} progress - current progress state.
 * @param {{ objectiveId: string, score: number, correct: string[], gaps: string[], correctedModel: string }} attempt
 * @param {number} now - ms timestamp, injectable for testing.
 */
export function recordAttempt(progress, { objectiveId, score, correct, gaps, correctedModel }, now = Date.now()) {
  const prevState = progress.objectives[objectiveId] ?? null
  const { repetitionIndex, dueAt, intervalDays } = scheduleNextReview(prevState, score, now)

  const history = [...(prevState?.history ?? []), { date: now, score }].slice(-MAX_HISTORY_PER_OBJECTIVE)

  const nextObjectiveState = {
    repetitionIndex,
    dueAt,
    intervalDays,
    lastScore: score,
    lastResult: { correct, gaps, correctedModel },
    history,
  }

  return {
    ...progress,
    objectives: { ...progress.objectives, [objectiveId]: nextObjectiveState },
    streak: updateStreak(progress.streak, now),
  }
}
