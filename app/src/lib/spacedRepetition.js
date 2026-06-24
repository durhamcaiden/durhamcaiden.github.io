// Spaced-repetition scheduling.
//
// Each objective moves along a fixed ladder of review intervals. A strong
// grade advances the objective one rung up the ladder (review less often);
// a weak grade drops it back to the first rung (review again tomorrow). This
// is a deliberately simplified relative of SM-2 — good enough to keep weak
// objectives in heavy rotation without the complexity of a full ease-factor
// model, which would be overkill for a single learner drilling exam content.

export const REVIEW_INTERVALS_DAYS = [1, 3, 7, 16, 35]

const DAY_MS = 24 * 60 * 60 * 1000

// A grade of 4-5 means "knew it" -> move up the ladder.
// A grade of 3 means "partial credit" -> hold at the current rung.
// A grade of 1-2 (or anything unparseable) means "didn't know it" -> back to rung 0.
const ADVANCE_THRESHOLD = 4
const HOLD_THRESHOLD = 3

/**
 * Compute the next review state for an objective after it's been graded.
 *
 * @param {{ repetitionIndex: number } | null} prevState - existing review
 *   state for this objective, or null if it has never been attempted.
 * @param {number} score - 1-5 grade just returned by the grader.
 * @param {number} now - ms timestamp, injectable for testing.
 * @returns {{ repetitionIndex: number, dueAt: number, intervalDays: number }}
 */
export function scheduleNextReview(prevState, score, now = Date.now()) {
  const prevIndex = prevState ? prevState.repetitionIndex : -1
  const lastRung = REVIEW_INTERVALS_DAYS.length - 1

  let nextIndex
  if (score >= ADVANCE_THRESHOLD) {
    nextIndex = Math.min(prevIndex + 1, lastRung)
  } else if (score === HOLD_THRESHOLD) {
    nextIndex = Math.max(prevIndex, 0)
  } else {
    nextIndex = 0
  }

  const intervalDays = REVIEW_INTERVALS_DAYS[nextIndex]
  return {
    repetitionIndex: nextIndex,
    dueAt: now + intervalDays * DAY_MS,
    intervalDays,
  }
}

/** An objective with no review state has never been attempted, so it's always due. */
export function isDue(state, now = Date.now()) {
  if (!state) return true
  return state.dueAt <= now
}

/** How many days overdue (0 if not yet due, Infinity if never attempted). */
export function daysOverdue(state, now = Date.now()) {
  if (!state) return Infinity
  return Math.max(0, (now - state.dueAt) / DAY_MS)
}

/** Human-readable "next review" label for the result screen. */
export function describeNextReview(intervalDays) {
  if (intervalDays === 1) return 'tomorrow'
  return `in ${intervalDays} days`
}
