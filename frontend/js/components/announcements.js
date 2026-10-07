/**
 * Feature 9: Big Boss Announcements
 * - Trigger and display announcements
 * - Dramatic ticker bar + Full-screen Broadcast Modal
 * - Web Audio API dramatic SFX + Web Speech Synthesis ("Bigg Boss chahte hain...")
 */

export class AnnouncementManager {
  constructor(store) {
    this.store = store;
  }

  // Dramatic Big Boss Sound Synthesizer (No external mp3 required)
  playDramaticSfx() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Deep dramatic bass boom + dissonant gong
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
    } catch (e) {
      console.warn('Audio synthesis not permitted without user gesture yet', e);
    }
  }

  speakAnnouncement(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 0.7; // Authoritative deep pitch
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }

  render(tickerContainer, triggerBtn) {
    const state = this.store.getState();
    const announcements = state.announcements || [];
    const latest = announcements[announcements.length - 1] || {
      message: 'Bigg Boss House Command Center is online. House rules are in effect.',
      priority: 'normal'
    };

    // Render Ticker
    if (tickerContainer) {
      tickerContainer.innerHTML = `
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

      tickerContainer.querySelector('#btn-broadcast-open').addEventListener('click', () => {
        this.openAnnouncementModal();
      });
    }

    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => {
        this.openAnnouncementModal();
      });
    }
  }

  // Full-screen dramatic broadcast modal
  showBroadcastAlert(message, priority = 'critical') {
    this.playDramaticSfx();
    this.speakAnnouncement(message);

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

    modal.querySelector('#btn-dismiss-broadcast').addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  openAnnouncementModal() {
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

    modal.querySelector('#btn-cancel-announcement').addEventListener('click', () => {
      modal.classList.remove('active');
    });

    modal.querySelector('#form-announcement').addEventListener('submit', async (e) => {
      e.preventDefault();
      const message = modal.querySelector('#announcement-msg').value.trim();
      const priority = modal.querySelector('#announcement-priority').value;

      modal.classList.remove('active');
      await this.store.postAnnouncement(message, priority);

      if (priority === 'critical' || priority === 'urgent') {
        this.showBroadcastAlert(message, priority);
      } else {
        this.playDramaticSfx();
      }
    });
  }
}
