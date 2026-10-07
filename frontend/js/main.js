/**
 * TechBoss — Big Boss Digital Command Center
 * Connects all 12 Mandatory Deliverables to Backend (/api) with local fallback.
 */

(function () {
  'use strict';

  // Seeded contestants (8+ active/evicted contestants)
  const INITIAL_CONTESTANTS = [
    { id: "c1", name: "Arjun Singhania", team: "Cyber Cobras", points: 350, status: "Active", isCaptain: true, isImmune: true, isNominated: false, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Arjun" },
    { id: "c2", name: "Priya Sharma", team: "Neural Ninjas", points: 310, status: "Active", isCaptain: false, isImmune: false, isNominated: false, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Priya" },
    { id: "c3", name: "Kabir Mehra", team: "Byte Brawlers", points: 260, status: "Active", isCaptain: false, isImmune: false, isNominated: true, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Kabir" },
    { id: "c4", name: "Ananya Roy", team: "Neural Ninjas", points: 230, status: "Active", isCaptain: false, isImmune: true, isNominated: false, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Ananya" },
    { id: "c5", name: "Rohan Verma", team: "Cyber Cobras", points: 195, status: "Active", isCaptain: false, isImmune: false, isNominated: true, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rohan" },
    { id: "c6", name: "Tanvi Deshmukh", team: "Byte Brawlers", points: 180, status: "Active", isCaptain: false, isImmune: false, isNominated: false, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Tanvi" },
    { id: "c7", name: "Vikram Rathore", team: "Cyber Cobras", points: 140, status: "Active", isCaptain: false, isImmune: false, isNominated: true, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Vikram" },
    { id: "c8", name: "Sneha Kulkarni", team: "Neural Ninjas", points: 110, status: "Active", isCaptain: false, isImmune: false, isNominated: false, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sneha" },
    { id: "c9", name: "Devansh Joshi", team: "Byte Brawlers", points: 45, status: "Evicted", isCaptain: false, isImmune: false, isNominated: false, avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Devansh" }
  ];

  const INITIAL_TASKS = [
    { id: "t1", title: "Quantum Algorithm Challenge", description: "Optimize the neural net under 60 seconds", assignedTo: "c2", points: 50, status: "In Progress" },
    { id: "t2", title: "Ration Inventory Audit", description: "Catalog food provisions and lock kitchen pantry", assignedTo: "c3", points: 30, status: "Pending" },
    { id: "t3", title: "Secret Room Mystery Puzzle", description: "Decode binary transmission on the main terminal", assignedTo: "c1", points: 80, status: "Completed" }
  ];

  const INITIAL_ANNOUNCEMENTS = [
    { id: "a1", message: "Bigg Boss chahte hain ki sabhi sadasya living area mein ekatrith ho jayein!", priority: "critical", timestamp: "10:00 AM" },
    { id: "a2", message: "Nominations are now OPEN. Immune contestants cannot be nominated.", priority: "urgent", timestamp: "10:12 AM" }
  ];

  class Store {
    constructor() {
      this.listeners = [];
      this.backendOnline = false;
      this.state = this.loadState();
      this.timerInterval = null;

      // Start local timer interval if running
      if (this.state.timer && this.state.timer.status === 'running') {
        this.startLocalTimerInterval();
      }

      // Check backend connection and start 1s polling
      this.checkAndPollBackend();
    }

    loadState() {
      try {
        const saved = localStorage.getItem('techboss_state_app_v3');
        if (saved) return JSON.parse(saved);
      } catch (e) {}

      return {
        contestants: INITIAL_CONTESTANTS,
        tasks: INITIAL_TASKS,
        announcements: INITIAL_ANNOUNCEMENTS,
        timer: { duration: 300, remaining: 300, status: 'paused' }
      };
    }

    saveState() {
      try {
        localStorage.setItem('techboss_state_app_v3', JSON.stringify(this.state));
      } catch (e) {}
    }

    subscribe(fn) {
      this.listeners.push(fn);
    }

    notifySubscribers() {
      this.saveState();
      this.listeners.forEach(fn => fn(this.state));
    }

    getState() {
      return this.state;
    }

    // Polling /api/state
    async checkAndPollBackend() {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          this.backendOnline = true;
          this.applyBackendState(data);
        }
      } catch (e) {
        this.backendOnline = false;
      }

      // Poll every 1s
      setInterval(async () => {
        try {
          const res = await fetch('/api/state');
          if (res.ok) {
            const data = await res.json();
            this.backendOnline = true;
            this.applyBackendState(data);
          }
        } catch (e) {
          this.backendOnline = false;
        }
      }, 1000);
    }

    applyBackendState(data) {
      if (data.contestants) this.state.contestants = data.contestants;
      if (data.tasks) this.state.tasks = data.tasks;
      if (data.announcements) this.state.announcements = data.announcements;
      if (data.timer) this.state.timer = data.timer;
      this.notifySubscribers();
    }

    notify(message, type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast ${type === 'error' ? 'toast-error' : type === 'success' ? 'toast-success' : ''}`;
      toast.innerHTML = `
        <span>${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
        <span>${message}</span>
      `;
      container.appendChild(toast);
      setTimeout(() => toast.remove(), 3500);
    }

    playDramaticSfx() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 1.2);

        gain.gain.setValueAtTime(0.7, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
      } catch (e) {}
    }

    playBuzzer() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } catch (e) {}
    }

    speak(text) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 0.75;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      }
    }

    // Feature 1: Add Contestant
    async addContestant({ name, team, points }) {
      if (this.backendOnline) {
        try {
          await fetch('/api/contestants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, team, points })
          });
        } catch (e) {}
      }

      const newC = {
        id: 'c_' + Date.now(),
        name,
        team,
        points: Number(points) || 0,
        status: 'Active',
        isCaptain: false,
        isImmune: false,
        isNominated: false,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`
      };
      this.state.contestants.push(newC);
      this.notify(`Contestant ${name} inducted into ${team}!`, 'success');
      this.notifySubscribers();
    }

    // Feature 4: Point System
    async updatePoints(contestantId, delta, reason = '') {
      if (this.backendOnline) {
        try {
          await fetch(`/api/contestants/${contestantId}/points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delta, reason })
          });
        } catch (e) {}
      }

      const c = this.state.contestants.find(item => item.id === contestantId);
      if (!c) return;
      c.points += Number(delta);
      const sign = delta >= 0 ? `+${delta}` : `${delta}`;
      this.notify(`${c.name}: ${sign} pts (${reason})`, delta >= 0 ? 'success' : 'error');
      this.notifySubscribers();
    }

    // Feature 5: Captaincy
    async setCaptain(contestantId) {
      if (this.backendOnline) {
        try {
          await fetch(`/api/contestants/${contestantId}/captain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (e) {}
      }

      const target = this.state.contestants.find(c => c.id === contestantId);
      if (!target) return;

      this.state.contestants.forEach(c => {
        if (c.id === contestantId) {
          c.isCaptain = true;
          c.isImmune = true;
          c.isNominated = false;
        } else {
          c.isCaptain = false;
        }
      });

      this.notify(`👑 ${target.name} is now House Captain!`, 'success');
      this.notifySubscribers();
    }

    // Feature 6: Nominations
    async nominate(contestantId) {
      const c = this.state.contestants.find(item => item.id === contestantId);
      if (!c) return;

      // Rule validation: Immune cannot be nominated!
      if (c.isImmune) {
        this.notify(`RULE REJECTION: ${c.name} has IMMUNITY!`, 'error');
        return;
      }
      if (c.isCaptain) {
        this.notify(`RULE REJECTION: ${c.name} is House Captain!`, 'error');
        return;
      }

      if (this.backendOnline) {
        try {
          const res = await fetch(`/api/contestants/${contestantId}/nominate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (!res.ok) {
            const err = await res.json();
            this.notify(`API: ${err.error}`, 'error');
            return;
          }
        } catch (e) {}
      }

      c.isNominated = true;
      this.notify(`⚠️ ${c.name} sent to Danger Zone!`, 'error');
      this.notifySubscribers();
    }

    async clearNomination(contestantId) {
      if (this.backendOnline) {
        try {
          await fetch(`/api/contestants/${contestantId}/nominate`, { method: 'DELETE' });
        } catch (e) {}
      }

      const c = this.state.contestants.find(item => item.id === contestantId);
      if (!c) return;
      c.isNominated = false;
      this.notify(`🛡️ ${c.name} saved from Danger Zone!`, 'success');
      this.notifySubscribers();
    }

    // Feature 7: Immunity
    async setImmunity(contestantId, isImmune) {
      if (this.backendOnline) {
        try {
          await fetch(`/api/contestants/${contestantId}/immunity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ immune: isImmune })
          });
        } catch (e) {}
      }

      const c = this.state.contestants.find(item => item.id === contestantId);
      if (!c) return;
      c.isImmune = isImmune;
      if (isImmune && c.isNominated) {
        c.isNominated = false;
      }
      this.notify(
        isImmune ? `🛡️ Immunity granted to ${c.name}!` : `Immunity revoked from ${c.name}.`,
        isImmune ? 'success' : 'info'
      );
      this.notifySubscribers();
    }

    // Feature 12: Eviction
    async evict(contestantId) {
      if (this.backendOnline) {
        try {
          await fetch(`/api/contestants/${contestantId}/evict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (e) {}
      }

      const c = this.state.contestants.find(item => item.id === contestantId);
      if (!c) return;
      c.status = 'Evicted';
      c.isCaptain = false;
      c.isImmune = false;
      c.isNominated = false;
      this.notify(`☠️ EVICTED: ${c.name} evicted from the House!`, 'error');
      this.notifySubscribers();
    }

    // Feature 3: Tasks
    async addTask({ title, description, assignedTo, points }) {
      if (this.backendOnline) {
        try {
          await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, assignedTo, points })
          });
        } catch (e) {}
      }

      const newTask = {
        id: 't_' + Date.now(),
        title,
        description,
        assignedTo,
        points: Number(points) || 50,
        status: 'In Progress'
      };
      this.state.tasks.push(newTask);
      this.notify(`Task "${title}" created!`, 'success');
      this.notifySubscribers();
    }

    async completeTask(taskId) {
      if (this.backendOnline) {
        try {
          await fetch(`/api/tasks/${taskId}/complete`, { method: 'POST' });
        } catch (e) {}
      }

      const task = this.state.tasks.find(t => t.id === taskId);
      if (!task || task.status === 'Completed') return;

      task.status = 'Completed';
      const assignee = this.state.contestants.find(c => c.id === task.assignedTo);
      if (assignee) {
        assignee.points += task.points;
        this.notify(`Task Done! ${assignee.name} rewarded +${task.points} pts!`, 'success');
      }
      this.notifySubscribers();
    }

    // Feature 9: Announcements
    async postAnnouncement(message, priority = 'normal') {
      if (this.backendOnline) {
        try {
          await fetch('/api/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, priority })
          });
        } catch (e) {}
      }

      const newA = {
        id: 'a_' + Date.now(),
        message,
        priority,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      this.state.announcements.push(newA);
      this.notify(`Broadcast Dispatched!`, 'info');
      this.notifySubscribers();
    }

    // Feature 10: Timer
    async startTimer() {
      if (this.backendOnline) {
        try { await fetch('/api/timer/start', { method: 'POST' }); } catch (e) {}
      }
      this.state.timer.status = 'running';
      this.startLocalTimerInterval();
      this.notifySubscribers();
    }

    async pauseTimer() {
      if (this.backendOnline) {
        try { await fetch('/api/timer/pause', { method: 'POST' }); } catch (e) {}
      }
      this.state.timer.status = 'paused';
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.notifySubscribers();
    }

    async resetTimer() {
      if (this.backendOnline) {
        try { await fetch('/api/timer/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ duration: this.state.timer.duration }) }); } catch (e) {}
      }
      this.state.timer.remaining = this.state.timer.duration;
      this.state.timer.status = 'paused';
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.notifySubscribers();
    }

    async setTimerDuration(seconds) {
      if (this.backendOnline) {
        try { await fetch('/api/timer/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ duration: seconds }) }); } catch (e) {}
      }
      this.state.timer.duration = seconds;
      this.state.timer.remaining = seconds;
      this.state.timer.status = 'paused';
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.notifySubscribers();
    }

    startLocalTimerInterval() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (this.state.timer.status === 'running' && this.state.timer.remaining > 0) {
          this.state.timer.remaining -= 1;
          if (this.state.timer.remaining === 0) {
            this.state.timer.status = 'completed';
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            this.playBuzzer();
            this.notify('⏰ TASK TIME UP! Buzzer sounded!', 'error');
          }
          this.notifySubscribers();
        }
      }, 1000);
    }
  }

  // =========================================================================
  // UI CONTROLLER & VIEW LOGIC
  // =========================================================================
  const store = new Store();

  function renderTimer() {
    const el = document.getElementById('timer-widget-container');
    if (!el) return;
    const timer = store.getState().timer;
    const mins = Math.floor(timer.remaining / 60).toString().padStart(2, '0');
    const secs = (timer.remaining % 60).toString().padStart(2, '0');
    const pct = Math.max(0, Math.min(100, (timer.remaining / timer.duration) * 100));
    const isWarning = timer.remaining <= 30 && timer.remaining > 0;
    const isRunning = timer.status === 'running';

    el.innerHTML = `
      <div class="hud-panel timer-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Task Countdown Timer
          </div>
          <span style="font-size: 0.75rem; color: ${isRunning ? 'var(--accent-success)' : 'var(--text-dim)'}; font-weight: 700;">
            ${isRunning ? '● LIVE' : '○ PAUSED'}
          </span>
        </div>

        <div class="timer-display-box">
          <div class="timer-digital ${isWarning ? 'warning' : ''}">
            ${mins}:${secs}
          </div>
          <div class="timer-progress-bar-wrap">
            <div class="timer-progress-fill" style="width: ${pct}%;"></div>
          </div>
        </div>

        <div class="timer-controls">
          ${isRunning 
            ? `<button class="btn btn-warning" id="btn-timer-pause">❚❚ Pause</button>`
            : `<button class="btn btn-primary" id="btn-timer-start">▶ Start</button>`
          }
          <button class="btn btn-secondary" id="btn-timer-reset">↺ Reset</button>
        </div>

        <div class="timer-presets">
          <button class="preset-btn" data-time="60">1 Min</button>
          <button class="preset-btn" data-time="180">3 Min</button>
          <button class="preset-btn" data-time="300">5 Min</button>
          <button class="preset-btn" data-time="600">10 Min</button>
        </div>
      </div>
    `;

    const startBtn = el.querySelector('#btn-timer-start');
    if (startBtn) startBtn.onclick = () => store.startTimer();
    const pauseBtn = el.querySelector('#btn-timer-pause');
    if (pauseBtn) pauseBtn.onclick = () => store.pauseTimer();
    const resetBtn = el.querySelector('#btn-timer-reset');
    if (resetBtn) resetBtn.onclick = () => store.resetTimer();

    el.querySelectorAll('.preset-btn').forEach(btn => {
      btn.onclick = (e) => store.setTimerDuration(parseInt(e.target.dataset.time, 10));
    });
  }

  function renderNominationsAndDanger() {
    const dangerEl = document.getElementById('danger-zone-container');
    const deskEl = document.getElementById('nominations-desk-container');
    const state = store.getState();
    const active = state.contestants.filter(c => c.status !== 'Evicted');
    const nominees = active.filter(c => c.isNominated);

    if (dangerEl) {
      dangerEl.innerHTML = `
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
            <span class="danger-badge-count">${nominees.length} IN DANGER</span>
          </div>

          <div class="danger-list">
            ${nominees.length === 0 
              ? `<div style="padding: 18px; text-align: center; color: var(--text-dim); font-size: 0.85rem;">No housemates in danger.</div>`
              : nominees.map(c => `
                <div class="danger-item">
                  <div class="danger-info">
                    <img src="${c.avatar}" class="danger-avatar" alt="${c.name}">
                    <div>
                      <div class="danger-name">${c.name}</div>
                      <div class="danger-team">${c.team} • ${c.points} PTS</div>
                    </div>
                  </div>
                  <div class="danger-actions">
                    <button class="btn btn-secondary btn-sm" data-action="save-nom" data-id="${c.id}">Save</button>
                    <button class="btn btn-danger btn-sm" data-action="evict-danger" data-id="${c.id}">Evict</button>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>
      `;

      dangerEl.onclick = (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.action === 'save-nom') {
          store.clearNomination(id);
        } else if (btn.dataset.action === 'evict-danger') {
          const c = state.contestants.find(x => x.id === id);
          if (confirm(`Confirm eviction of ${c ? c.name : 'this contestant'}?`)) {
            store.evict(id);
          }
        }
      };
    }

    if (deskEl) {
      deskEl.innerHTML = `
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
                ${active.map(c => `
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

      const select = deskEl.querySelector('#select-nom-candidate');
      const nomBtn = deskEl.querySelector('#btn-trigger-nominate');
      const immBtn = deskEl.querySelector('#btn-toggle-immunity');

      nomBtn.onclick = () => {
        const id = select.value;
        if (!id) return store.notify('Select a contestant first!', 'error');
        store.nominate(id);
      };

      immBtn.onclick = () => {
        const id = select.value;
        if (!id) return store.notify('Select a contestant first!', 'error');
        const c = state.contestants.find(x => x.id === id);
        if (c) store.setImmunity(id, !c.isImmune);
      };
    }
  }

  function renderContestantsGrid() {
    const el = document.getElementById('contestants-grid-container');
    if (!el) return;
    const state = store.getState();
    const active = state.contestants.filter(c => c.status !== 'Evicted');
    const evicted = state.contestants.filter(c => c.status === 'Evicted');

    el.innerHTML = `
      <div class="hud-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Contestant Roster (${active.length} Active)
          </div>
          <button class="btn btn-primary btn-sm" id="btn-open-add-contestant">
            + Add Housemate
          </button>
        </div>

        <div class="contestants-grid">
          ${active.map(c => `
            <div class="contestant-card ${c.isCaptain ? 'is-captain' : ''} ${c.isNominated ? 'is-danger' : ''}" data-id="${c.id}">
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
                  </div>
                  <div class="contestant-team">${c.team} • <span style="color: var(--accent-success);">${c.status}</span></div>
                  <div class="contestant-points-box">
                    <span class="points-num">${c.points}</span>
                    <span class="points-label">Points</span>
                  </div>
                </div>
              </div>

              <div class="contestant-actions-bar">
                <button class="btn btn-secondary btn-sm" data-action="adjust-points" data-id="${c.id}">
                  +/- Points
                </button>
                <button class="btn ${c.isCaptain ? 'btn-warning' : 'btn-secondary'} btn-sm" data-action="set-captain" data-id="${c.id}" ${c.isCaptain ? 'disabled' : ''}>
                  ${c.isCaptain ? 'Captain' : 'Make Captain'}
                </button>
                <button class="btn btn-danger btn-sm" data-action="evict-c" data-id="${c.id}">
                  Evict
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        ${evicted.length > 0 ? `
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-color);">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; margin-bottom: 10px;">
              Evicted Graveyard (${evicted.length})
            </div>
            <div class="contestants-grid" style="opacity: 0.7;">
              ${evicted.map(c => `
                <div class="contestant-card is-evicted">
                  <div class="contestant-header">
                    <img src="${c.avatar}" class="contestant-avatar" alt="${c.name}">
                    <div class="contestant-info">
                      <div class="contestant-name">
                        ${c.name} <span style="color: var(--accent-danger); font-size: 0.7rem; font-weight: 700;">☠️ EVICTED</span>
                      </div>
                      <div class="contestant-team">${c.team} • ${c.points} PTS</div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    const addBtn = el.querySelector('#btn-open-add-contestant');
    if (addBtn) addBtn.onclick = () => openAddContestantModal();

    el.onclick = (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === 'adjust-points') openPointsModal(id);
      if (action === 'set-captain') store.setCaptain(id);
      if (action === 'evict-c') {
        const c = state.contestants.find(x => x.id === id);
        if (confirm(`Evict ${c ? c.name : 'this housemate'} from the House?`)) store.evict(id);
      }
    };
  }

  let currentTaskFilter = 'all';
  function renderTasks() {
    const el = document.getElementById('tasks-container');
    if (!el) return;
    const state = store.getState();
    const tasks = state.tasks || [];
    const activeContestants = state.contestants.filter(c => c.status !== 'Evicted');
    const filtered = currentTaskFilter === 'all' ? tasks : tasks.filter(t => t.status === currentTaskFilter);

    el.innerHTML = `
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
          <button class="filter-btn ${currentTaskFilter === 'all' ? 'active' : ''}" data-filter="all">All (${tasks.length})</button>
          <button class="filter-btn ${currentTaskFilter === 'In Progress' ? 'active' : ''}" data-filter="In Progress">Active</button>
          <button class="filter-btn ${currentTaskFilter === 'Completed' ? 'active' : ''}" data-filter="Completed">Completed</button>
        </div>

        <div class="tasks-list">
          ${filtered.length === 0 ? `<div style="padding: 24px; text-align: center; color: var(--text-dim); font-size: 0.85rem;">No tasks matching filter.</div>` : ''}
          ${filtered.map(t => {
            const assignee = state.contestants.find(c => c.id === t.assignedTo) || { name: 'Unassigned', avatar: '' };
            const isDone = t.status === 'Completed';

            return `
              <div class="task-card ${isDone ? 'completed' : ''}">
                <div class="task-top">
                  <div class="task-title">${t.title}</div>
                  <div class="task-bounty">+${t.points} PTS</div>
                </div>
                <div class="task-desc">${t.description || 'Complete the assigned objective.'}</div>
                <div class="task-footer">
                  <div class="task-assigned">
                    <img src="${assignee.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=x'}" class="task-assigned-avatar" alt="${assignee.name}">
                    <span>${assignee.name}</span>
                  </div>
                  ${isDone 
                    ? `<span style="color: var(--accent-success); font-size: 0.75rem; font-weight: 700;">✓ COMPLETED</span>`
                    : `<button class="btn-complete-task" data-id="${t.id}">Mark Complete</button>`
                  }
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    el.querySelector('#btn-open-task-modal').onclick = () => openCreateTaskModal(activeContestants);

    el.querySelectorAll('.filter-btn').forEach(btn => {
      btn.onclick = (e) => {
        currentTaskFilter = e.target.dataset.filter;
        renderTasks();
      };
    });

    el.onclick = (e) => {
      if (e.target.classList.contains('btn-complete-task')) {
        store.completeTask(e.target.dataset.id);
      }
    };
  }

  function renderLeaderboard() {
    const el = document.getElementById('leaderboard-container');
    if (!el) return;
    const sorted = store.getState().contestants
      .filter(c => c.status !== 'Evicted')
      .slice()
      .sort((a, b) => b.points - a.points);

    el.innerHTML = `
      <div class="hud-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Live Leaderboard
          </div>
          <span style="font-size: 0.75rem; color: var(--accent-cyan); font-family: var(--font-mono);">
            ${store.backendOnline ? '● SERVER SYNC' : '● LOCAL SYNC'}
          </span>
        </div>

        <div class="leaderboard-table">
          ${sorted.map((c, index) => {
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

  function renderStats() {
    const el = document.getElementById('stats-container');
    if (!el) return;
    const state = store.getState();
    const active = state.contestants.filter(c => c.status !== 'Evicted');
    const evicted = state.contestants.filter(c => c.status === 'Evicted');
    const nominated = active.filter(c => c.isNominated);
    const tasks = state.tasks || [];
    const completedTasks = tasks.filter(t => t.status === 'Completed');

    const sorted = [...active].sort((a, b) => b.points - a.points);
    const highest = sorted[0] || { name: 'None', points: 0 };
    const lowest = sorted[sorted.length - 1] || { name: 'None', points: 0 };
    const captain = active.find(c => c.isCaptain) || { name: 'Vacant' };

    el.innerHTML = `
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

  function renderAnnouncements() {
    const el = document.getElementById('announcement-ticker-container');
    if (!el) return;
    const announcements = store.getState().announcements;
    const latest = announcements[announcements.length - 1] || {
      message: 'Bigg Boss House Command Center active. Monitoring contestants.',
      priority: 'normal'
    };

    el.innerHTML = `
      <div class="ticker-label">
        <span>📢</span> BB BROADCAST
      </div>
      <div class="ticker-content">
        <span class="ticker-text" id="live-ticker-text">${latest.message}</span>
      </div>
      <div class="announcement-actions">
        <button class="btn btn-primary btn-sm" id="btn-broadcast-open">
          + New Announcement
        </button>
      </div>
    `;

    el.querySelector('#btn-broadcast-open').onclick = () => openAnnouncementModal();
  }

  // Modals
  function openPointsModal(contestantId) {
    const contestant = store.getState().contestants.find(c => c.id === contestantId);
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
          Current Score: <strong style="color: #fff;">${contestant.points} PTS</strong>
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
            <input type="text" id="pts-reason-input" class="form-input" placeholder="e.g. Luxury Task Winner, Rule Violation" required />
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
      btn.onclick = (e) => modal.querySelector('#pts-delta-input').value = e.target.dataset.val;
    });

    modal.querySelector('#btn-cancel-pts').onclick = () => modal.classList.remove('active');

    modal.querySelector('#form-points').onsubmit = (e) => {
      e.preventDefault();
      const delta = parseInt(modal.querySelector('#pts-delta-input').value, 10) || 0;
      const reason = modal.querySelector('#pts-reason-input').value.trim() || 'Points adjustment';
      store.updatePoints(contestantId, delta, reason);
      modal.classList.remove('active');
    };
  }

  function openAddContestantModal() {
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
    modal.querySelector('#btn-cancel-add-c').onclick = () => modal.classList.remove('active');

    modal.querySelector('#form-new-contestant').onsubmit = (e) => {
      e.preventDefault();
      const name = modal.querySelector('#contestant-name-input').value.trim();
      const team = modal.querySelector('#contestant-team-input').value;
      const points = parseInt(modal.querySelector('#contestant-points-input').value, 10) || 100;
      store.addContestant({ name, team, points });
      modal.classList.remove('active');
    };
  }

  function openCreateTaskModal(contestants) {
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
    modal.querySelector('#btn-cancel-task').onclick = () => modal.classList.remove('active');

    modal.querySelector('#form-new-task').onsubmit = (e) => {
      e.preventDefault();
      const title = modal.querySelector('#task-input-title').value.trim();
      const description = modal.querySelector('#task-input-desc').value.trim();
      const assignedTo = modal.querySelector('#task-input-assignee').value;
      const points = parseInt(modal.querySelector('#task-input-points').value, 10) || 50;
      store.addTask({ title, description, assignedTo, points });
      modal.classList.remove('active');
    };
  }

  function openAnnouncementModal() {
    let modal = document.getElementById('modal-post-announcement');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-post-announcement';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card">
        <h3 style="color: var(--accent-gold); margin-bottom: 16px; font-size: 1.1rem; text-transform: uppercase;">
          📢 Trigger Big Boss Announcement
        </h3>
        <form id="form-announcement">
          <div class="form-group">
            <label class="form-label">Announcement Message</label>
            <textarea id="announcement-msg" class="form-textarea" rows="3" placeholder="Bigg Boss chahte hain ki..." required></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Broadcast Priority</label>
            <select id="announcement-priority" class="form-select">
              <option value="normal">Standard House Note</option>
              <option value="urgent">Urgent House Notice</option>
              <option value="critical" selected>Critical Command (Full Screen Takeover)</option>
            </select>
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-announcement">Cancel</button>
            <button type="submit" class="btn btn-primary" style="background: linear-gradient(135deg, var(--accent-danger), #ff5e00);">
              Transmit Broadcast
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.add('active');
    modal.querySelector('#btn-cancel-announcement').onclick = () => modal.classList.remove('active');

    modal.querySelector('#form-announcement').onsubmit = (e) => {
      e.preventDefault();
      const message = modal.querySelector('#announcement-msg').value.trim();
      const priority = modal.querySelector('#announcement-priority').value;

      modal.classList.remove('active');
      store.postAnnouncement(message, priority);

      if (priority === 'critical' || priority === 'urgent') {
        showBroadcastAlert(message, priority);
      } else {
        store.playDramaticSfx();
      }
    };
  }

  function showBroadcastAlert(message, priority = 'critical') {
    store.playDramaticSfx();
    store.speak(message);

    let modal = document.getElementById('modal-broadcast-alert');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-broadcast-alert';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card modal-broadcast">
        <div class="broadcast-eye-big">
          <div class="bb-eye-iris"></div>
        </div>
        <div class="broadcast-title">BIGG BOSS BROADCAST</div>
        <div style="font-size: 0.8rem; letter-spacing: 2px; color: var(--accent-danger); text-transform: uppercase; font-weight: 800;">
          [ PRIORITY: ${priority.toUpperCase()} ]
        </div>
        <div class="broadcast-body">
          "${message}"
        </div>
        <button class="btn btn-primary" id="btn-dismiss-broadcast" style="padding: 10px 28px; font-size: 0.9rem;">
          Acknowledge Order
        </button>
      </div>
    `;

    modal.classList.add('active');
    modal.querySelector('#btn-dismiss-broadcast').onclick = () => modal.classList.remove('active');
  }

  function renderAll() {
    renderTimer();
    renderNominationsAndDanger();
    renderContestantsGrid();
    renderTasks();
    renderLeaderboard();
    renderStats();
    renderAnnouncements();
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderAll();
    store.subscribe(() => renderAll());

    const quickBtn = document.getElementById('btn-quick-broadcast');
    if (quickBtn) quickBtn.onclick = () => openAnnouncementModal();
  });

  window.TechBossStore = store;
})();
