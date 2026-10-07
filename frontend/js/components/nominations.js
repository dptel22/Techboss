/**
 * Feature 6: Nominations
 * Feature 7: Immunity (immune => cannot be nominated)
 * Feature 8: Danger Zone (displays all nominated contestants)
 */

export class NominationsManager {
  constructor(store) {
    this.store = store;
  }

  render(dangerZoneContainer, controlsContainer) {
    const state = this.store.getState();
    const contestants = state.contestants || [];
    const activeContestants = contestants.filter(c => c.status !== 'Evicted');
    const nominatedContestants = activeContestants.filter(c => c.isNominated);

    // 1. Render Danger Zone (Feature 8)
    if (dangerZoneContainer) {
      dangerZoneContainer.innerHTML = `
        <div class="hud-panel danger-zone-panel">
          <div class="panel-header">
            <div class="panel-title" style="color: var(--accent-danger);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Danger Zone
            </div>
            <span class="danger-badge-count" id="danger-count">${nominatedContestants.length} NOMINATED</span>
          </div>

          <div class="danger-list" id="danger-contestants-list">
            ${this.renderDangerList(nominatedContestants)}
          </div>
        </div>
      `;

      this.attachDangerEvents(dangerZoneContainer);
    }

    // 2. Render Nominations & Immunity Quick Trigger Hub
    if (controlsContainer) {
      controlsContainer.innerHTML = `
        <div class="hud-panel">
          <div class="panel-header">
            <div class="panel-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Nomination & Immunity Desk
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Select Active Housemate</label>
              <select id="select-nom-candidate" class="form-select">
                <option value="">-- Choose Contestant --</option>
                ${activeContestants.map(c => `
                  <option value="${c.id}">
                    ${c.name} [${c.team}] ${c.isCaptain ? '(CAPTAIN)' : ''} ${c.isImmune ? '(IMMUNE)' : ''} ${c.isNominated ? '(NOMINATED)' : ''}
                  </option>
                `).join('')}
              </select>
            </div>

            <div style="display: flex; gap: 8px;">
              <button class="btn btn-danger" style="flex: 1;" id="btn-trigger-nominate">
                ⚠️ Nominate
              </button>
              <button class="btn btn-warning" style="flex: 1;" id="btn-toggle-immunity">
                🛡️ Toggle Immunity
              </button>
            </div>
          </div>
        </div>
      `;

      this.attachControlsEvents(controlsContainer);
    }
  }

  renderDangerList(nominees) {
    if (nominees.length === 0) {
      return `
        <div style="padding: 20px; text-align: center; color: var(--text-dim); font-size: 0.85rem;">
          No contestants currently in Danger Zone.
        </div>
      `;
    }

    return nominees.map(c => `
      <div class="danger-item">
        <div class="danger-info">
          <img src="${c.avatar}" class="danger-avatar" alt="${c.name}">
          <div>
            <div class="danger-name">${c.name}</div>
            <div class="danger-team">${c.team} • ${c.points} PTS</div>
          </div>
        </div>
        <div class="danger-actions">
          <button class="btn btn-secondary btn-sm" data-action="save" data-id="${c.id}" title="Save from nomination">
            Save
          </button>
          <button class="btn btn-danger btn-sm" data-action="evict" data-id="${c.id}" title="Evict immediately">
            Evict
          </button>
        </div>
      </div>
    `).join('');
  }

  attachDangerEvents(container) {
    container.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'save') {
        await this.store.clearNomination(id);
      } else if (action === 'evict') {
        const contestant = this.store.getState().contestants.find(c => c.id === id);
        if (confirm(`Confirm immediate eviction of ${contestant ? contestant.name : 'this contestant'} from the Big Boss House?`)) {
          await this.store.evict(id);
        }
      }
    });
  }

  attachControlsEvents(container) {
    const select = container.querySelector('#select-nom-candidate');
    const nominateBtn = container.querySelector('#btn-trigger-nominate');
    const immunityBtn = container.querySelector('#btn-toggle-immunity');

    nominateBtn.addEventListener('click', async () => {
      const id = select.value;
      if (!id) {
        this.store.notify('Please select a contestant first!', 'error');
        return;
      }

      const contestant = this.store.getState().contestants.find(c => c.id === id);
      if (!contestant) return;

      // RULE ENFORCEMENT: Feature 7 - Immune contestants cannot be nominated
      if (contestant.isImmune) {
        this.store.notify(`CANNOT NOMINATE: ${contestant.name} is currently IMMUNE!`, 'error');
        return;
      }

      if (contestant.isCaptain) {
        this.store.notify(`CANNOT NOMINATE: ${contestant.name} is the House Captain!`, 'error');
        return;
      }

      if (contestant.isNominated) {
        this.store.notify(`${contestant.name} is already nominated!`, 'warning');
        return;
      }

      await this.store.nominate(id);
    });

    immunityBtn.addEventListener('click', async () => {
      const id = select.value;
      if (!id) {
        this.store.notify('Please select a contestant first!', 'error');
        return;
      }

      const contestant = this.store.getState().contestants.find(c => c.id === id);
      if (!contestant) return;

      const targetImmunity = !contestant.isImmune;
      await this.store.setImmunity(id, targetImmunity);
    });
  }
}
