/**
 * Features 1, 2, 4, 5, 11, 12:
 * - Feature 1: Contestant Management (8+ contestants, Add contestant, status)
 * - Feature 2: Live Leaderboard (sorted rankings with points)
 * - Feature 4: Point System (add/deduct points with reason)
 * - Feature 5: Captaincy (assign/change House Captain)
 * - Feature 11: House Statistics (live analytics)
 * - Feature 12: Eviction (evict contestant, remove from active leaderboard)
 */

export class ContestantsManager {
  constructor(store) {
    this.store = store;
  }

  // Feature 1: Contestant Roster Grid
  renderGrid(container) {
    const state = this.store.getState();
    const contestants = state.contestants || [];
    const activeContestants = contestants.filter(c => c.status !== 'Evicted');
    const evictedContestants = contestants.filter(c => c.status === 'Evicted');

    container.innerHTML = `
      <div class="hud-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Housemates Roster (${activeContestants.length} Active)
          </div>
          <button class="btn btn-primary btn-sm" id="btn-open-add-contestant">
            + Add Housemate
          </button>
        </div>

        <div class="contestants-grid" id="contestants-cards-list">
          ${activeContestants.map(c => this.renderContestantCard(c)).join('')}
        </div>

        ${evictedContestants.length > 0 ? `
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color);">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 10px;">
              Evicted Graveyard (${evictedContestants.length})
            </div>
            <div class="contestants-grid" style="opacity: 0.7;">
              ${evictedContestants.map(c => this.renderContestantCard(c, true)).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.attachGridEvents(container);
  }

  renderContestantCard(c, isEvicted = false) {
    return `
      <div class="contestant-card ${c.isCaptain ? 'is-captain' : ''} ${c.isNominated ? 'is-danger' : ''} ${isEvicted ? 'is-evicted' : ''}" data-id="${c.id}">
        <div class="contestant-header">
          <div class="contestant-avatar-wrap">
            <img src="${c.avatar}" class="contestant-avatar" alt="${c.name}">
          </div>
          <div class="contestant-info">
            <div class="contestant-name">
              ${c.name}
              ${c.isCaptain ? `<span class="captain-badge">👑 CAPTAIN</span>` : ''}
              ${c.isImmune ? `<span class="immunity-badge">🛡️ IMMUNE</span>` : ''}
              ${c.isNominated ? `<span class="nominated-badge">⚠️ DANGER</span>` : ''}
              ${isEvicted ? `<span style="color: var(--accent-danger); font-size: 0.7rem; font-weight: 700;">☠️ EVICTED</span>` : ''}
            </div>
            <div class="contestant-team">${c.team} • <span style="color: ${c.status === 'Active' ? 'var(--accent-success)' : 'var(--text-dim)'}">${c.status}</span></div>
            <div class="contestant-points-box">
              <span class="points-num">${c.points}</span>
              <span class="points-label">Points</span>
            </div>
          </div>
        </div>

        ${!isEvicted ? `
          <div class="contestant-actions-bar">
            <button class="btn btn-secondary btn-sm" data-action="adjust-points" data-id="${c.id}">
              +/- Points
            </button>
            <button class="btn ${c.isCaptain ? 'btn-warning' : 'btn-secondary'} btn-sm" data-action="set-captain" data-id="${c.id}" ${c.isCaptain ? 'disabled' : ''}>
              ${c.isCaptain ? 'Captain' : 'Make Captain'}
            </button>
            <button class="btn btn-danger btn-sm" data-action="evict" data-id="${c.id}">
              Evict
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Feature 2: Live Leaderboard
  renderLeaderboard(container) {
    const state = this.store.getState();
    const contestants = (state.contestants || [])
      .filter(c => c.status !== 'Evicted')
      .slice()
      .sort((a, b) => b.points - a.points);

    container.innerHTML = `
      <div class="hud-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Live Leaderboard
          </div>
          <span style="font-size: 0.75rem; color: var(--accent-cyan); font-family: var(--font-mono);">
            LIVE SYNC
          </span>
        </div>

        <div class="leaderboard-table">
          ${contestants.map((c, index) => {
            const rank = index + 1;
            const rankClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';
            const rankBadge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

            return `
              <div class="leaderboard-row">
                <div class="leaderboard-rank ${rankClass}">${rankBadge}</div>
                <div class="leaderboard-user">
                  <img src="${c.avatar}" style="width: 24px; height: 24px; border-radius: 50%;" alt="${c.name}">
                  <span style="font-weight: 600; font-size: 0.85rem; color: #fff;">${c.name}</span>
                  ${c.isCaptain ? '<span style="font-size: 0.7rem;">👑</span>' : ''}
                  ${c.isImmune ? '<span style="font-size: 0.7rem;">🛡️</span>' : ''}
                </div>
                <div class="leaderboard-pts">${c.points} PTS</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Feature 11: House Statistics
  renderStats(container) {
    const state = this.store.getState();
    const contestants = state.contestants || [];
    const active = contestants.filter(c => c.status !== 'Evicted');
    const evicted = contestants.filter(c => c.status === 'Evicted');
    const nominated = active.filter(c => c.isNominated);
    const tasks = state.tasks || [];
    const completedTasks = tasks.filter(t => t.status === 'Completed');

    // Sort active by points
    const sorted = [...active].sort((a, b) => b.points - a.points);
    const highest = sorted[0] || { name: 'None', points: 0 };
    const lowest = sorted[sorted.length - 1] || { name: 'None', points: 0 };
    const captain = active.find(c => c.isCaptain) || { name: 'Vacant' };

    container.innerHTML = `
      <div class="hud-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            House Statistics
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">House Captain</div>
            <div class="stat-value" style="color: var(--accent-gold); font-size: 1rem;">${captain.name}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">In Danger Zone</div>
            <div class="stat-value" style="color: var(--accent-danger);">${nominated.length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Highest Scorer</div>
            <div class="stat-value" style="color: var(--accent-success); font-size: 0.95rem;">${highest.name} (${highest.points})</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Lowest Scorer</div>
            <div class="stat-value" style="color: var(--accent-cyan); font-size: 0.95rem;">${lowest.name} (${lowest.points})</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Tasks Finished</div>
            <div class="stat-value">${completedTasks.length} / ${tasks.length}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Active vs Evicted</div>
            <div class="stat-value">${active.length} / ${evicted.length}</div>
          </div>
        </div>
      </div>
    `;
  }

  attachGridEvents(container) {
    // Add Contestant
    const addBtn = container.querySelector('#btn-open-add-contestant');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openAddContestantModal();
      });
    }

    // Card buttons
    container.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'adjust-points') {
        this.openPointsModal(id);
      } else if (action === 'set-captain') {
        await this.store.setCaptain(id);
      } else if (action === 'evict') {
        const contestant = this.store.getState().contestants.find(c => c.id === id);
        if (confirm(`Are you sure you want to evict ${contestant ? contestant.name : 'this housemate'}?`)) {
          await this.store.evict(id);
        }
      }
    });
  }

  // Feature 4: Point Adjustment Modal
  openPointsModal(contestantId) {
    const contestant = this.store.getState().contestants.find(c => c.id === contestantId);
    if (!contestant) return;

    let modal = document.getElementById('modal-adjust-points');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-adjust-points';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card">
        <h3 style="color: var(--accent-gold); margin-bottom: 8px; font-size: 1.1rem; text-transform: uppercase;">
          ⚡ Adjust Points: ${contestant.name}
        </h3>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px;">
          Current Points: <strong style="color: #fff;">${contestant.points}</strong>
        </p>

        <form id="form-points">
          <div style="display: flex; gap: 8px; margin-bottom: 14px;">
            <button type="button" class="btn btn-secondary quick-pts" data-val="10">+10</button>
            <button type="button" class="btn btn-secondary quick-pts" data-val="50">+50</button>
            <button type="button" class="btn btn-secondary quick-pts" data-val="-20">-20</button>
            <button type="button" class="btn btn-secondary quick-pts" data-val="-50">-50</button>
          </div>

          <div class="form-group">
            <label class="form-label">Point Delta (+/-)</label>
            <input type="number" id="pts-delta-input" class="form-input" value="10" required />
          </div>

          <div class="form-group">
            <label class="form-label">Reason / Infraction</label>
            <input type="text" id="pts-reason-input" class="form-input" placeholder="e.g. Broken house rule, Star performance" required />
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-pts">Cancel</button>
            <button type="submit" class="btn btn-primary">Apply Points</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.add('active');

    modal.querySelectorAll('.quick-pts').forEach(btn => {
      btn.addEventListener('click', (e) => {
        modal.querySelector('#pts-delta-input').value = e.target.dataset.val;
      });
    });

    modal.querySelector('#btn-cancel-pts').addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.querySelector('#form-points').addEventListener('submit', async (e) => {
      e.preventDefault();
      const delta = parseInt(modal.querySelector('#pts-delta-input').value, 10) || 0;
      const reason = modal.querySelector('#pts-reason-input').value.trim() || 'Command Center Action';

      await this.store.updatePoints(contestantId, delta, reason);
      modal.classList.remove('active');
    });
  }

  // Feature 1: Add Contestant Modal
  openAddContestantModal() {
    let modal = document.getElementById('modal-add-contestant');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-add-contestant';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card">
        <h3 style="color: var(--accent-cyan); margin-bottom: 16px; font-size: 1.1rem; text-transform: uppercase;">
          👤 Induct New Housemate
        </h3>
        <form id="form-new-contestant">
          <div class="form-group">
            <label class="form-label">Contestant Full Name</label>
            <input type="text" id="contestant-name-input" class="form-input" placeholder="e.g. Siddharth Shukla" required />
          </div>
          <div class="form-group">
            <label class="form-label">Team Assignment</label>
            <select id="contestant-team-input" class="form-select" required>
              <option value="Cyber Cobras">Cyber Cobras</option>
              <option value="Neural Ninjas">Neural Ninjas</option>
              <option value="Byte Brawlers">Byte Brawlers</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Starting Points</label>
            <input type="number" id="contestant-points-input" class="form-input" value="100" min="0" required />
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-add-c">Cancel</button>
            <button type="submit" class="btn btn-primary">Induct Contestant</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.add('active');

    modal.querySelector('#btn-cancel-add-c').addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.querySelector('#form-new-contestant').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = modal.querySelector('#contestant-name-input').value.trim();
      const team = modal.querySelector('#contestant-team-input').value;
      const points = parseInt(modal.querySelector('#contestant-points-input').value, 10) || 100;

      await this.store.addContestant({ name, team, points });
      modal.classList.remove('active');
    });
  }
}
