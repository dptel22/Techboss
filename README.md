# TechBoss — Big Boss House Command Center

Real-time web app for Big Boss to manage contestants, tasks, scores, nominations, immunity, and evictions.
**Mission clock: 45 minutes.** Every verified feature = 100 pts. Speed bonus up to 50 pts.

## Team & Work Split

Two people, two isolated workspaces. **Nobody touches the other side's folder.**

| Side | People / Agents | Owns (files) | Mission |
|---|---|---|---|
| **FRONTEND** | Claude Code + Gemini | `frontend/` | The entire visible dashboard — all 12 features rendered as UI, polling `/api/state` every ~1s |
| **BACKEND** | Codex + ZCode | `backend/`, `docs/`, this README, `API_CONTRACT.md` | State + REST API implementing all 12 features' logic, exactly per `API_CONTRACT.md` |

### Feature ownership

| # | Feature | Backend (logic) | Frontend (UI) |
|---|---|---|---|
| 1 | Contestant management (8+ seeded: name, team, points, status) | Codex | Claude Code |
| 2 | Live leaderboard (rankings update with points) | (derived from `/api/state`) | Claude Code |
| 3 | Task management (assign + mark complete) | ZCode | Gemini |
| 4 | Point system (add/deduct) | Codex | Claude Code |
| 5 | Captaincy (assign/change House Captain) | Codex | Claude Code |
| 6 | Nominations | Codex | Gemini |
| 7 | Immunity (immune ⇒ cannot be nominated; API rejects it) | Codex | Gemini |
| 8 | Danger Zone (all nominated contestants) | (derived from `/api/state`) | Gemini |
| 9 | Big Boss Announcement (trigger/display) | ZCode | Gemini |
| 10 | Task timer (start / pause / reset) | ZCode | Gemini |
| 11 | House statistics (highest scorer, tasks done, nominees…) | (derived from `/api/state`) | Claude Code |
| 12 | Eviction (remove from active house/leaderboard) | Codex | Claude Code |

### Sub-split within each side

**Frontend (Claude Code + Gemini)**
- **Claude Code** — app shell, polling loop, contestant grid, leaderboard, stats panel, point +/− controls, captain + evict controls (features 1, 2, 4, 5, 11, 12 UI).
- **Gemini** — task board, nominations + Danger Zone, immunity badges, announcement bar, timer widget, all CSS/animations (features 3, 6, 7, 8, 9, 10 UI).

**Backend (Codex + ZCode)**
- **Codex** — state model + persistence; contestant, points, captaincy, nomination, immunity, eviction endpoints (features 1, 4, 5, 6, 7, 12 logic).
- **ZCode** — API contract keeper; tasks, announcements, timer endpoints; `/api/state` aggregation; smoke tests; repo merges (features 3, 9, 10, 11 + glue).

## The boundary (read this first)

`API_CONTRACT.md` is the **single source of truth** for what the frontend calls and the backend implements.
Frontend must build against `docs/sample-state.json` (a full `/api/state` response) so they are never blocked waiting for the backend.

## Rules of engagement

1. **Frontend never edits `backend/`, backend never edits `frontend/`.** Ever.
2. Contract change? The backend side edits `API_CONTRACT.md` and logs it in `AGENT_LOG.md` first; frontend adapts.
3. Push often. Pull before push. Keep commits small: `feat(frontend): ...` / `feat(backend): ...`.
4. **`AGENT_LOG.md` is mandatory** — every agent appends one entry per work session (top of file): what you did, what you're doing next. Never delete another agent's entry.

## Run

```bash
# Serves API on :4000 and the frontend/ folder at http://localhost:4000
python backend/server.py 
# OR
node backend/server.js
```

## Submit

Repo: https://github.com/dptel22/Techboss — push to `main`, then submit for manual verification.
