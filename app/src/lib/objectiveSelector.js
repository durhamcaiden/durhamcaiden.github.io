// Picks which objective to drill next.
//
// Selection is a weighted random draw across every objective in the loaded
// exam, where the weight is the product of two independent factors:
//
//   weakness  - objectives in domains you're scoring poorly on are weighted
//               higher, so the trainer leans into your weak spots instead of
//               drilling things you've already mastered.
//   urgency   - objectives that have never been attempted, or are overdue
//               per the spaced-repetition schedule, are weighted much higher
//               than objectives that aren't due yet. Not-yet-due objectives
//               keep a small nonzero weight so extra practice is still
//               possible, just rare.
//
// It's a weighted random draw rather than a strict "most overdue wins" sort
// so the trainer doesn't get stuck grinding the same single objective every
// session once it's the most overdue by a wide margin.

import { isDue, daysOverdue } from './spacedRepetition'

const NEUTRAL_SCORE = 3 // assumed domain average before any data exists
const UNSEEN_URGENCY = 5
const NOT_DUE_URGENCY = 0.2

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export function flattenObjectives(domains) {
  const out = []
  for (const domain of domains) {
    for (const objective of domain.objectives) {
      out.push({ domain, objective })
    }
  }
  return out
}

export function findObjective(domains, objectiveId) {
  for (const domain of domains) {
    const objective = domain.objectives.find((o) => o.id === objectiveId)
    if (objective) return { domain, objective }
  }
  return null
}

/** Average lastScore across attempted objectives in a domain, or null if none attempted. */
export function domainAverageScore(domain, progress) {
  const scores = domain.objectives
    .map((o) => progress.objectives[o.id]?.lastScore)
    .filter((s) => typeof s === 'number')
  if (scores.length === 0) return null
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

function weighCandidate({ domain, objective }, progress, now) {
  const avg = domainAverageScore(domain, progress)
  const weaknessMultiplier = clamp(6 - (avg ?? NEUTRAL_SCORE), 1, 5)

  const state = progress.objectives[objective.id]
  let urgencyMultiplier
  if (!state) {
    urgencyMultiplier = UNSEEN_URGENCY
  } else if (isDue(state, now)) {
    urgencyMultiplier = clamp(3 + daysOverdue(state, now) * 0.3, 3, 8)
  } else {
    urgencyMultiplier = NOT_DUE_URGENCY
  }

  return weaknessMultiplier * urgencyMultiplier
}

/**
 * Weighted-random pick of the next objective to drill.
 * Returns { domain, objective }, or null if no objectives are loaded.
 */
export function selectNextObjective(domains, progress, now = Date.now()) {
  const candidates = flattenObjectives(domains)
  if (candidates.length === 0) return null

  const weights = candidates.map((c) => weighCandidate(c, progress, now))
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  let roll = Math.random() * totalWeight
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return candidates[i]
  }
  return candidates[candidates.length - 1] // floating-point rounding fallback
}
