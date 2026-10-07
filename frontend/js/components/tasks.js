/**
 * Feature 3: Task Management
 * - Assign tasks to contestants with point bounties
 * - View tasks filtered by status (All, In Progress, Pending, Completed)
 * - Mark tasks complete -> automatically credits points to assigned contestant
 */

export class TaskManager {
  constructor(store) {
    this.store = store;
  }

  render(container) {
    const state = this.store.getState();
    const tasks = state.tasks || [];
    const activeContestants = state.contestants.filter(c => c.status !== 'Evicted');

    container.innerHTML = `
      <div class="hud-panel tasks-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            Task Operations
          </div>
          <button class="btn btn-primary btn-sm" id="btn-open-task-modal">
            + Assign Task
          </button>
        </div>

        <div class="task-filter-bar">
          <button class="filter-btn active" data-filter="all">All (${tasks.length})</button>
          <button class="filter-btn" data-filter="In Progress">Active</button>
          <button class="filter-btn" data-filter="Completed">Completed</button>
        </div>

        <div class="tasks-list" id="tasks-list-container">
          ${this.renderTaskList(tasks, activeContestants)}
        </div>
      </div>
    `;

    this.attachEvents(container, activeContestants);
  }

  renderTaskList(tasks, contestants, filter = 'all') {
    const filtered = filter === 'all' 
      ? tasks 
      : tasks.filter(t => t.status === filter);

    if (filtered.length === 0) {
      return `<div style="padding: 24px; text-align: center; color: var(--text-dim); font-size: 0.85rem;">No tasks in this view</div>`;
    }

    return filtered.map(task => {
      const assignee = contestants.find(c => c.id === task.assignedTo) || { name: 'Unassigned', avatar: '' };
      const isDone = task.status === 'Completed';

      return `
        <div class="task-card ${isDone ? 'completed' : ''}" data-task-id="${task.id}">
          <div class="task-top">
            <div class="task-title">${task.title}</div>
            <div class="task-bounty">+${task.points} PTS</div>
          </div>
          <div class="task-desc">${task.description || 'Complete the assigned objective within the deadline.'}</div>
          <div class="task-footer">
            <div class="task-assigned">
              <img src="${assignee.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=bb'}" class="task-assigned-avatar" alt="${assignee.name}">
              <span>${assignee.name}</span>
            </div>
            ${isDone 
              ? `<span style="color: var(--accent-success); font-size: 0.75rem; font-weight: 700;">✓ COMPLETED</span>`
              : `<button class="btn-complete-task" data-id="${task.id}">Mark Complete</button>`
            }
          </div>
        </div>
      `;
    }).join('');
  }

  attachEvents(container, contestants) {
    // Filter click
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const filter = e.target.dataset.filter;
        const listEl = container.querySelector('#tasks-list-container');
        listEl.innerHTML = this.renderTaskList(this.store.getState().tasks, contestants, filter);
      });
    });

    // Complete task click
    container.addEventListener('click', async (e) => {
      if (e.target.classList.contains('btn-complete-task')) {
        const taskId = e.target.dataset.id;
        await this.store.completeTask(taskId);
      }
    });

    // Modal open
    const modalBtn = container.querySelector('#btn-open-task-modal');
    if (modalBtn) {
      modalBtn.addEventListener('click', () => {
        this.openCreateTaskModal(contestants);
      });
    }
  }

  openCreateTaskModal(contestants) {
    let modal = document.getElementById('modal-create-task');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-create-task';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card">
        <h3 style="color: var(--accent-cyan); margin-bottom: 16px; font-size: 1.1rem; text-transform: uppercase;">
          ⚡ Assign House Task
        </h3>
        <form id="form-new-task">
          <div class="form-group">
            <label class="form-label">Task Title</label>
            <input type="text" id="task-input-title" class="form-input" placeholder="e.g. Secret Room Cipher" required />
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea id="task-input-desc" class="form-textarea" rows="2" placeholder="Task briefing..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Assignee</label>
            <select id="task-input-assignee" class="form-select" required>
              ${contestants.map(c => `<option value="${c.id}">${c.name} (${c.team})</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Bounty Points</label>
            <input type="number" id="task-input-points" class="form-input" value="50" min="10" step="5" required />
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-task">Cancel</button>
            <button type="submit" class="btn btn-primary">Deploy Task</button>
          </div>
        </form>
      </div>
    `;

    modal.classList.add('active');

    modal.querySelector('#btn-cancel-task').addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.querySelector('#form-new-task').addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = modal.querySelector('#task-input-title').value.trim();
      const description = modal.querySelector('#task-input-desc').value.trim();
      const assignedTo = modal.querySelector('#task-input-assignee').value;
      const points = parseInt(modal.querySelector('#task-input-points').value, 10) || 50;

      await this.store.addTask({ title, description, assignedTo, points });
      modal.classList.remove('active');
    });
  }
}
