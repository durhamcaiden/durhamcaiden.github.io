# RecallRange

An active-recall trainer for CompTIA certification prep. It is **not** a
flashcard app — there's nothing to recognize. Every drill forces you to type
a free-text explanation of a concept from memory, and an LLM grades whether
your mental model is actually correct.

The loop:

1. Pick an exam objective, weighted toward domains you're scoring low on and
   objectives that are due for review.
2. Ask Claude for one open-ended question covering that objective (never
   multiple-choice).
3. You write the answer from memory — no options to recognize.
4. Claude grades it 1–5 against the objective: what you got right, what's
   wrong or missing, and the corrected mental model.
5. The score updates a spaced-repetition schedule for that objective, and the
   loop repeats.

Everything is local: state lives in `localStorage`, there's no backend, no
accounts, no analytics.

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set `VITE_ANTHROPIC_API_KEY` to a real key from
[console.anthropic.com](https://console.anthropic.com/settings/keys).
`.env` is gitignored — your key is never committed.

```bash
npm run dev
```

## Loading real exam content

`src/data/objectives.json` ships with a handful of example CompTIA A+
objectives so the app runs out of the box. Replace it with the real
objectives for whatever exam you're studying:

1. Download the official objectives list from [comptia.org](https://www.comptia.org/).
2. Transcribe it into the same shape:

```json
{
  "exam": "Exam name",
  "domains": [
    {
      "id": "1.0",
      "name": "Domain name",
      "weight": 15,
      "objectives": [{ "id": "1.1", "text": "Objective text" }]
    }
  ]
}
```

`weight` is the domain's percentage of the exam (from the official
objectives doc) — it's only used to label the mastery heatmap, not to bias
question selection.

## How it's built

| File | Responsibility |
|---|---|
| `src/lib/anthropic.js` | The only file that talks to the network. Generates questions, grades answers, retries transient failures with backoff. |
| `src/lib/spacedRepetition.js` | Fixed-interval review ladder (1 / 3 / 7 / 16 / 35 days). Advances on a good score, holds on a mediocre one, resets to day 1 on a bad one. |
| `src/lib/objectiveSelector.js` | Weighted-random pick of the next objective: weak domains and overdue/unseen objectives get pulled more often. |
| `src/lib/progressStore.js` | `localStorage` persistence for per-objective history and the daily streak. |
| `src/lib/stats.js` | Pure derived dashboard metrics (coverage, due count, domain mastery, weak objectives) read from progress. |
| `src/hooks/useProgress.js` | React hook wrapping the progress store. |
| `src/components/DrillSession.jsx` | The core loop UI: question → free-text answer → grade → next. |
| `src/components/Dashboard.jsx` | Stats, mastery heatmap, and a weak-objectives list you can drill directly from. |

API key missing? The app shows a setup screen instead of crashing.
Network/API errors during a drill show a Retry button and preserve your
in-progress answer.

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build
npm run lint     # oxlint
npm run preview  # preview the production build
```
