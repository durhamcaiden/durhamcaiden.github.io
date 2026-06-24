// Thin React binding over the localStorage progress store: loads once on
// mount, persists on every change, and exposes a single mutator so
// components never touch localStorage directly.

import { useCallback, useEffect, useRef, useState } from 'react'
import { loadProgress, saveProgress, recordAttempt } from '../lib/progressStore'

export function useProgress() {
  const [progress, setProgress] = useState(loadProgress) // lazy initializer: reads localStorage once

  // Kept in sync on every render (not via useEffect) so gradeObjective always
  // sees the latest progress without needing it in its dependency array.
  const progressRef = useRef(progress)
  progressRef.current = progress

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  // Returns the freshly-scheduled objective state synchronously, so callers
  // can show "next review in N days" immediately without waiting on a render.
  const gradeObjective = useCallback((objectiveId, gradeResult) => {
    const next = recordAttempt(progressRef.current, { objectiveId, ...gradeResult })
    setProgress(next)
    return next.objectives[objectiveId]
  }, [])

  return { progress, gradeObjective }
}
