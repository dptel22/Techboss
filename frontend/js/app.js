/**
 * TechBoss Application Entry Point
 * Orchestrates all 12 modules and synchronizes with TechBossStore
 */

import { TechBossStore } from './store.js';
import { TaskManager } from './components/tasks.js';
import { NominationsManager } from './components/nominations.js';
import { AnnouncementManager } from './components/announcements.js';
import { TimerWidget } from './components/timer.js';
import { ContestantsManager } from './components/contestants.js';

document.addEventListener('DOMContentLoaded', () => {
  const store = new TechBossStore();

  const taskManager = new TaskManager(store);
  const nominationsManager = new NominationsManager(store);
  const announcementManager = new AnnouncementManager(store);
  const timerWidget = new TimerWidget(store);
  const contestantsManager = new ContestantsManager(store);

  // Containers
  const timerContainer = document.getElementById('timer-widget-container');
  const dangerZoneContainer = document.getElementById('danger-zone-container');
  const nominationsDeskContainer = document.getElementById('nominations-desk-container');
  const contestantsContainer = document.getElementById('contestants-grid-container');
  const tasksContainer = document.getElementById('tasks-container');
  const leaderboardContainer = document.getElementById('leaderboard-container');
  const statsContainer = document.getElementById('stats-container');
  const tickerContainer = document.getElementById('announcement-ticker-container');
  const quickBroadcastBtn = document.getElementById('btn-quick-broadcast');

  function renderAll() {
    timerWidget.render(timerContainer);
    nominationsManager.render(dangerZoneContainer, nominationsDeskContainer);
    contestantsManager.renderGrid(contestantsContainer);
    taskManager.render(tasksContainer);
    contestantsManager.renderLeaderboard(leaderboardContainer);
    contestantsManager.renderStats(statsContainer);
    announcementManager.render(tickerContainer, quickBroadcastBtn);
  }

  // Initial render
  renderAll();

  // Subscribe to reactive store changes
  store.subscribe((state) => {
    renderAll();
  });

  console.log('⚡ TechBoss Command Center initialized with all 12 features active.');
});
