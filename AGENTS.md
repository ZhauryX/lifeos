# LIFEOS — Agent Instructions

## Project Overview
LIFEOS is a student productivity app: priority engine, focus timer, and risk analysis. No AI, no auth, no database — pure localStorage.

## Architecture
```
src/
├── app/           # Next.js App Router (page.tsx, layout.tsx, globals.css)
├── components/    # React components (Dashboard, TaskList, AddTaskForm, FocusTimer, RiskModal)
├── lib/           # Core logic (scoring.ts, storage.ts)
└── types/         # TypeScript interfaces (index.ts)
```

## Key Files
- **lib/scoring.ts** — Pure functions: `calculateTaskScore`, `calculateRiskIfIgnored`, `scoreTasks`, `getNextMove`, `getRiskLevel`. Deterministic, no side effects.
- **lib/storage.ts** — localStorage wrapper: `getTasks`, `saveTasks`, `addTask`, `deleteTask`, `toggleTask`, `getSettings`, `saveSettings`, `loadDemo`.
- **types/index.ts** — `Task`, `Settings`, `ScoredTask` (extends Task + score, urgency, riskIfIgnored, daysUntilDeadline, reason).

## Priority Algorithm
Score = urgency × 0.5 + importance × 0.35 + efficiency × 0.15
- Urgency: 100 (today), 80 (tomorrow), 60 (2 days), 45 (3 days), 30 (≤5 days), 20 (≤7 days), 10 (later)
- Importance: 15 per level (1-5)
- Efficiency: 20 (≤30min), 15 (≤60min), 10 (≤120min), 5 (>120min)
- Risk if ignored: urgency + timePressure × 0.3 + importanceRisk

## Components
- **Dashboard** — Main orchestrator, state management, refreshScores()
- **TaskList** — Renders pending/completed tasks with risk badges, progress bars, "What if I ignore this?"
- **AddTaskForm** — Expandable form: name, date, minutes, importance slider
- **FocusTimer** — Circular countdown, pause/reset/complete, marks task done
- **RiskModal** — Shows current vs future risk if delayed 1 day

## Data Persistence
localStorage keys: `lifeos_tasks`, `lifeos_settings`. Demo data loads 4 tasks with 120min available.

## Commands
```bash
npm run dev     # Development server
npm run build   # Production build (must pass)
npm run start   # Production server
```

## Modification Rules
1. **Scoring changes** — Edit `lib/scoring.ts` only. Keep functions pure.
2. **Storage changes** — Edit `lib/storage.ts` only. Don't add new keys without updating both get/save.
3. **New fields** — Add to `types/index.ts` first, then update scoring/storage/components.
3. **UI changes** — Components in `components/`. Dashboard orchestrates; keep it as single state source.
4. **No external deps** — No API calls, no auth, no DB. localStorage only.
5. **Dark mode** — Use `dark:` variants in Tailwind. Test both themes.

## Testing Checklist
- [ ] Add task → appears in list, score updates
- [ ] Toggle complete → moves to completed section
- [ ] Delete task → removed, scores recalculate
- [ ] Load Demo → 4 tasks, 120min, correct next move (Physics Exam)
- [ ] Focus Timer → counts down, complete marks task done
- [ ] Risk Modal → shows current vs future risk
- [ ] Settings → changes available time, recalculates
- [ ] Dark mode → all colors work
- [ ] Mobile → responsive layout works