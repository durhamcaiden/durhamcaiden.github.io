// Derived dashboard stats. Everything here is a pure read over
// { domains } + progress — no state of its own.

import { domainAverageScore } from './objectiveSelector'
import { isDue } from './spacedRepetition'

const WEAK_SCORE_THRESHOLD = 3

export function getDomainStats(domains, progress) {
  return domains.map((domain) => ({
    id: domain.id,
    name: domain.name,
    weight: domain.weight,
    total: domain.objectives.length,
    attempted: domain.objectives.filter((o) => progress.objectives[o.id]).length,
    mastery: domainAverageScore(domain, progress), // null until at least one attempt
  }))
}

export function getCoverage(domains, progress) {
  const all = domains.flatMap((d) => d.objectives)
  if (all.length === 0) return 0
  const attempted = all.filter((o) => progress.objectives[o.id]).length
  return Math.round((attempted / all.length) * 100)
}

export function getDueCount(domains, progress, now = Date.now()) {
  const all = domains.flatMap((d) => d.objectives)
  return all.filter((o) => isDue(progress.objectives[o.id], now)).length
}

/** Attempted objectives scoring at or below the weak threshold, worst first. */
export function getWeakObjectives(domains, progress, { limit = 8 } = {}) {
  const rows = []
  for (const domain of domains) {
    for (const objective of domain.objectives) {
      const state = progress.objectives[objective.id]
      if (state && state.lastScore <= WEAK_SCORE_THRESHOLD) {
        rows.push({ domain, objective, lastScore: state.lastScore })
      }
    }
  }
  return rows.sort((a, b) => a.lastScore - b.lastScore).slice(0, limit)
}
