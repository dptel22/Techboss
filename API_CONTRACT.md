# Big Boss Command Center — API Contract

Base URL: `/api`  
Content-Type: `application/json`

---

## 1. State Retrieval
### `GET /api/state`
Returns the entire aggregated house state for real-time polling.

**Response (200 OK):**
```json
{
  "contestants": [
    {
      "id": "c1",
      "name": "Arjun Singhania",
      "team": "Cyber Cobras",
      "points": 340,
      "status": "Active",
      "isCaptain": true,
      "isImmune": true,
      "isNominated": false,
      "avatar": "https://api.dicebear.com/7.x/bottts/svg?seed=Arjun"
    }
  ],
  "tasks": [
    {
      "id": "t1",
      "title": "Quantum Algorithm Challenge",
      "description": "Optimize the neural net under 60 seconds",
      "assignedTo": "c1",
      "points": 100,
      "status": "In Progress"
    }
  ],
  "announcements": [
    {
      "id": "a1",
      "message": "Attention Housemates: Today's luxury budget task begins in 5 minutes!",
      "priority": "urgent",
      "timestamp": "10:15 AM"
    }
  ],
  "timer": {
    "duration": 300,
    "remaining": 240,
    "status": "running"
  },
  "stats": {
    "highestScorer": { "name": "Arjun Singhania", "points": 340 },
    "lowestScorer": { "name": "Neha Patel", "points": 90 },
    "totalContestants": 8,
    "activeContestants": 7,
    "evictedCount": 1,
    "nominatedCount": 2,
    "completedTasks": 3,
    "totalTasks": 6
  }
}
```

---

## 2. Contestant & Score Endpoints (Features 1, 4, 5, 12)
- `POST /api/contestants` — `{ name, team, points }`
- `POST /api/contestants/:id/points` — `{ delta: number, reason: string }`
- `POST /api/contestants/:id/captain` — Sets contestant as captain, clears other captains, grants captain immunity.
- `POST /api/contestants/:id/evict` — Sets status to `"Evicted"`, removes from active list and clears nominations.

---

## 3. Tasks Endpoints (Feature 3)
- `POST /api/tasks` — `{ title, description, assignedTo, points }`
- `PATCH /api/tasks/:id/complete` — Sets task status to `"Completed"` and credits `points` to `assignedTo` contestant.

---

## 4. Nominations & Immunity Endpoints (Features 6, 7, 8)
- `POST /api/contestants/:id/nominate`
  - Rejects with `400 Bad Request` if contestant has `isImmune: true` or `isCaptain: true`.
  - Otherwise marks `isNominated: true` (adds to Danger Zone).
- `DELETE /api/contestants/:id/nominate` — Clears nomination.
- `POST /api/contestants/:id/immunity` — `{ immune: true/false }` (cannot nominate if immune).

---

## 5. Announcements Endpoints (Feature 9)
- `POST /api/announcements` — `{ message: string, priority: "normal" | "urgent" | "critical" }`

---

## 6. Timer Endpoints (Feature 10)
- `POST /api/timer/start`
- `POST /api/timer/pause`
- `POST /api/timer/reset` — `{ duration: number }`
