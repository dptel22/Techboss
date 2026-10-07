/**
 * Feature 10: Task Timer Widget
 * - Start, pause, reset countdown
 * - Preset durations (1m, 3m, 5m, 10m)
 * - Visual warning under 30 seconds
 * - Web Audio buzzer alarm upon completion
 */

export class TimerWidget {
  constructor(store) {
    this.store = store;
    this.intervalId = null;
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

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio not available', e);
    }
  }

  render(container) {
    const timer = this.store.getState().timer || {
      duration: 300,
      remaining: 300,
      status: 'paused'
    };

    const mins = Math.floor(timer.remaining / 60).toString().padStart(2, '0');
    const secs = (timer.remaining % 60).toString().padStart(2, '0');
    const pct = Math.max(0, Math.min(100, (timer.remaining / timer.duration) * 100));
    const isWarning = timer.remaining <= 30 && timer.remaining > 0;
    const isRunning = timer.status === 'running';

    container.innerHTML = `
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
          <div class="timer-digital ${isWarning ? 'warning' : ''}" id="timer-display-text">
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

    this.attachEvents(container);
  }

  attachEvents(container) {
    const startBtn = container.querySelector('#btn-timer-start');
    const pauseBtn = container.querySelector('#btn-timer-pause');
    const resetBtn = container.querySelector('#btn-timer-reset');

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.store.startTimer();
      });
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        this.store.pauseTimer();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.store.resetTimer();
      });
    }

    container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const secs = parseInt(e.target.dataset.time, 10);
        this.store.setTimerDuration(secs);
      });
    });
  }
}
