// Anthropic API integration. This is the only file in the app that talks to
// the network, with two operations:
//
//   generateQuestion - ask Claude for one open-ended recall question for an objective.
//   gradeAnswer      - ask Claude to grade a free-text answer against that objective,
//                      returning strict JSON: { score, correct[], gaps[], corrected_model }.
//
// The API key is read from VITE_ANTHROPIC_API_KEY (see .env.example) and is
// never hardcoded. Vite inlines VITE_-prefixed env vars into the client
// bundle at build/dev time, which is acceptable here only because this is a
// local-only tool — you run it on your own machine with your own key, and
// .env is gitignored so the key is never committed. Don't deploy this build
// publicly with a real key baked in.

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 1000
const MAX_RETRIES = 2 // total attempts = MAX_RETRIES + 1
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 529]) // rate limit, server error, overloaded

export class MissingApiKeyError extends Error {
  constructor() {
    super('VITE_ANTHROPIC_API_KEY is not set. Add it to a .env file (see .env.example) and restart the dev server.')
    this.name = 'MissingApiKeyError'
  }
}

export function hasApiKey() {
  return Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY)
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Low-level call to the Messages API with retry + exponential backoff on transient failures. */
async function callClaude({ system, userMessage }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) throw new MissingApiKeyError()

  let lastError
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          // Required by Anthropic to allow calling the API directly from a browser context.
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system,
          messages: [{ role: 'user', content: userMessage }],
        }),
      })

      if (!response.ok) {
        const body = await response.text()
        const error = new Error(`Anthropic API error ${response.status}: ${body}`)
        error.status = response.status
        throw error
      }

      const data = await response.json()
      return data.content?.[0]?.text ?? ''
    } catch (err) {
      lastError = err
      const retryable = !err.status || RETRYABLE_STATUSES.has(err.status)
      if (!retryable || attempt === MAX_RETRIES) break
      await sleep(2 ** attempt * 500) // 500ms, then 1000ms
    }
  }
  throw lastError
}

const QUESTION_SYSTEM_PROMPT = `You are an exam-prep tutor writing active-recall drills for a CompTIA certification. Given one exam objective, write exactly one open-ended question that forces the learner to explain the underlying concept in their own words from memory. Never write multiple-choice, true/false, or fill-in-the-blank questions. Never reveal or hint at the answer. Respond with ONLY the question text — no preamble, numbering, or quotation marks.`

/** Asks Claude for one open-ended free-recall question covering the given objective. */
export async function generateQuestion({ exam, domain, objective }) {
  const userMessage = `Exam: ${exam}\nDomain: ${domain.name}\nObjective: ${objective.text}\n\nWrite one open-ended free-recall question for this objective.`
  const text = await callClaude({ system: QUESTION_SYSTEM_PROMPT, userMessage })
  return text.trim()
}

const GRADER_SYSTEM_PROMPT = `You are a strict, expert CompTIA exam grader. You evaluate a learner's free-text explanation against one specific exam objective. Be rigorous: reward precise, technically correct explanations, and penalize vague hand-waving, hedging, and surface-level pattern matching even when it "sounds right." A correct conclusion reached through faulty reasoning should score low.

Respond with ONLY valid JSON — no markdown code fences, no commentary before or after — matching exactly this shape:
{"score": <integer 1-5>, "correct": [<short strings, what they got right>], "gaps": [<short strings, what's wrong or missing>], "corrected_model": "<a short, correct explanation the learner should internalize>"}

Scoring guide: 1 = no real understanding, 3 = partially correct with real gaps, 5 = complete and precise understanding.`

/** Asks Claude to grade a free-text answer against the objective, returning a normalized { score, correct, gaps, correctedModel }. */
export async function gradeAnswer({ objective, question, answer }) {
  const userMessage = `Exam objective: ${objective.text}\nQuestion asked: ${question}\nLearner's answer: ${answer}\n\nGrade this now. Return ONLY the JSON object described in your instructions.`
  const raw = await callClaude({ system: GRADER_SYSTEM_PROMPT, userMessage })
  return parseGrade(raw)
}

/** Strips markdown code fences and parses the grader's JSON, with a forgiving fallback for near-miss output. */
function parseGrade(raw) {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()

  try {
    return normalizeGrade(JSON.parse(cleaned))
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return normalizeGrade(JSON.parse(match[0]))
      } catch {
        // fall through to the error below
      }
    }
    throw new Error('Could not parse the grader response as JSON.')
  }
}

function normalizeGrade(parsed) {
  return {
    score: clampScore(parsed.score),
    correct: Array.isArray(parsed.correct) ? parsed.correct.map(String) : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
    correctedModel: typeof parsed.corrected_model === 'string' ? parsed.corrected_model : '',
  }
}

function clampScore(value) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return 3
  return Math.min(5, Math.max(1, n))
}
