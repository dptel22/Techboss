/**
 * TechBossStore — Central Reactive State Store
 * Manages all 12 Big Boss features with local fallback & live sync
 */

const INITIAL_CONTESTANTS = [
  {
    id: "c1",
    name: "Arjun Singhania",
    team: "Cyber Cobras",
    points: 350,
    status: "Active",
    isCaptain: true,
    isImmune: true,
    isNominated: false,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Arjun"
  },
  {
    id: "c2",
    name: "Priya Sharma",
    team: "Neural Ninjas",
    points: 310,
    status: "Active",
    isCaptain: false,
    isImmune: false,
    isNominated: false,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Priya"
  },
  {
    id: "c3",
    name: "Kabir Mehra",
    team: "Byte Brawlers",
    points: 260,
    status: "Active",
    isCaptain: false,
    isImmune: false,
    isNominated: true,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Kabir"
  },
  {
    id: "c4",
    name: "Ananya Roy",
    team: "Neural Ninjas",
    points: 230,
    status: "Active",
    isCaptain: false,
    isImmune: true,
    isNominated: false,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Ananya"
  },
  {
    id: "c5",
    name: "Rohan Verma",
    team: "Cyber Cobras",
    points: 195,
    status: "Active",
    isCaptain: false,
    isImmune: false,
    isNominated: true,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Rohan"
  },
  {
    id: "c6",
    name: "Tanvi Deshmukh",
    team: "Byte Brawlers",
    points: 180,
    status: "Active",
    isCaptain: false,
    isImmune: false,
    isNominated: false,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Tanvi"
  },
  {
    id: "c7",
    name: "Vikram Rathore",
    team: "Cyber Cobras",
    points: 140,
    status: "Active",
    isCaptain: false,
    isImmune: false,
    isNominated: true,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Vikram"
  },
  {
    id: "c8",
    name: "Sneha Kulkarni",
    team: "Neural Ninjas",
    points: 110,
    status: "Active",
    isCaptain: false,
    isImmune: false,
    isNominated: false,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Sneha"
  },
  {
    id: "c9",
    name: "Devansh Joshi",
    team: "Byte Brawlers",
    points: 45,
    status: "Evicted",
    isCaptain: false,
    isImmune: false,
    isNominated: false,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=Devansh"
  }
];

const INITIAL_TASKS = [
  {
    id: "t1",
    title: "Quantum Algorithm Challenge",
    description: "Optimize the neural net under 60 seconds",
    assignedTo: "c2",
    points: 50,
    status: "In Progress"
  },
  {
    id: "t2",
    title: "Ration Inventory Audit",
    description: "Catalog food provisions and lock kitchen pantry",
    assignedTo: "c3",
    points: 30,
    status: "Pending"
  },
  {
    id: "t3",
    title: "Secret Room Mystery Puzzle",
    description: "Decode binary transmission on the main terminal",
    assignedTo: "c1",
    points: 80,
    status: "Completed"
  }
];

const INITIAL_ANNOUNCEMENTS = [
  {
    id: "a1",
    message: "Bigg Boss chahte hain ki sabhi sadasya living area mein ekatrith ho jayein!",
    priority: "critical",
    timestamp: "10:00 AM"
  },
  {
    id: "a2",
    message: "Nominations are now OPEN. Immune contestants cannot be nominated.",
    priority: "urgent",
    timestamp: "10:12 AM"
  }
];

export class TechBossStore {
  constructor() {
    this.listeners = [];
    this.state = this.loadState();
    this.timerInterval = null;

    if (this.state.timer.status === 'running') {
      this.startTimerInterval();
    }
  }

  loadState() {
    try {
      const saved = localStorage.getItem('techboss_state_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('LocalStorage load error', e);
    }

    return {
      contestants: INITIAL_CONTESTANTS,
      tasks: INITIAL_TASKS,
      announcements: INITIAL_ANNOUNCEMENTS,
      timer: {
        duration: 300,
        remaining: 300,
        status: 'paused'
      }
    };
  }

  saveState() {
    try {
      localStorage.setItem('techboss_state_v1', JSON.stringify(this.state));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifySubscribers() {
    this.saveState();
    this.listeners.forEach(fn => fn(this.state));
  }

  getState() {
    return this.state;
  }

  notify(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : type === 'success' ? 'toast-success' : ''}`;
    toast.innerHTML = `
      <span>${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3500);
  }

  // Feature 1: Add Contestant
  async addContestant({ name, team, points }) {
    const newContestant = {
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

    this.state.contestants.push(newContestant);
    this.notify(`Contestant ${name} inducted into ${team}!`, 'success');
    this.notifySubscribers();
  }

  // Feature 4: Point System
  async updatePoints(contestantId, delta, reason = '') {
    const c = this.state.contestants.find(item => item.id === contestantId);
    if (!c) return;

    c.points += Number(delta);
    const sign = delta >= 0 ? `+${delta}` : `${delta}`;
    this.notify(`${c.name}: ${sign} pts (${reason})`, delta >= 0 ? 'success' : 'error');
    this.notifySubscribers();
  }

  // Feature 5: Captaincy
  async setCaptain(contestantId) {
    const target = this.state.contestants.find(c => c.id === contestantId);
    if (!target) return;

    this.state.contestants.forEach(c => {
      if (c.id === contestantId) {
        c.isCaptain = true;
        c.isImmune = true; // Captain gets immunity!
        c.isNominated = false; // Captain cannot remain nominated
      } else {
        c.isCaptain = false;
      }
    });

    this.notify(`👑 ${target.name} has been appointed House Captain!`, 'success');
    this.notifySubscribers();
  }

  // Feature 6: Nominations
  async nominate(contestantId) {
    const c = this.state.contestants.find(item => item.id === contestantId);
    if (!c) return;

    // Rule validation: Immune cannot be nominated!
    if (c.isImmune) {
      this.notify(`RULE REJECTION: ${c.name} has immunity and CANNOT be nominated!`, 'error');
      return;
    }

    if (c.isCaptain) {
      this.notify(`RULE REJECTION: House Captain ${c.name} is immune from nomination!`, 'error');
      return;
    }

    c.isNominated = true;
    this.notify(`⚠️ ${c.name} has been put in the DANGER ZONE!`, 'error');
    this.notifySubscribers();
  }

  async clearNomination(contestantId) {
    const c = this.state.contestants.find(item => item.id === contestantId);
    if (!c) return;

    c.isNominated = false;
    this.notify(`🛡️ ${c.name} has been saved from nomination!`, 'success');
    this.notifySubscribers();
  }

  // Feature 7: Immunity
  async setImmunity(contestantId, isImmune) {
    const c = this.state.contestants.find(item => item.id === contestantId);
    if (!c) return;

    c.isImmune = isImmune;
    if (isImmune && c.isNominated) {
      c.isNominated = false; // Immunity saves from danger zone
    }

    this.notify(
      isImmune ? `🛡️ Immunity granted to ${c.name}!` : `Immunity revoked from ${c.name}.`,
      isImmune ? 'success' : 'info'
    );
    this.notifySubscribers();
  }

  // Feature 12: Eviction
  async evict(contestantId) {
    const c = this.state.contestants.find(item => item.id === contestantId);
    if (!c) return;

    c.status = 'Evicted';
    c.isCaptain = false;
    c.isImmune = false;
    c.isNominated = false;

    this.notify(`☠️ EVICTED: ${c.name} has been removed from the Big Boss House!`, 'error');
    this.notifySubscribers();
  }

  // Feature 3: Tasks
  async addTask({ title, description, assignedTo, points }) {
    const newTask = {
      id: 't_' + Date.now(),
      title,
      description,
      assignedTo,
      points: Number(points) || 50,
      status: 'In Progress'
    };

    this.state.tasks.push(newTask);
    this.notify(`Task "${title}" deployed!`, 'success');
    this.notifySubscribers();
  }

  async completeTask(taskId) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task || task.status === 'Completed') return;

    task.status = 'Completed';

    // Credit bounty points to assignee
    const assignee = this.state.contestants.find(c => c.id === task.assignedTo);
    if (assignee) {
      assignee.points += task.points;
      this.notify(`Task Completed! ${assignee.name} earned +${task.points} pts!`, 'success');
    }

    this.notifySubscribers();
  }

  // Feature 9: Announcements
  async postAnnouncement(message, priority = 'normal') {
    const newAnnouncement = {
      id: 'a_' + Date.now(),
      message,
      priority,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.state.announcements.push(newAnnouncement);
    this.notify(`Big Boss Announcement Broadcasted!`, 'info');
    this.notifySubscribers();
  }

  // Feature 10: Timer
  startTimer() {
    this.state.timer.status = 'running';
    this.startTimerInterval();
    this.notifySubscribers();
  }

  pauseTimer() {
    this.state.timer.status = 'paused';
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.notifySubscribers();
  }

  resetTimer() {
    this.state.timer.remaining = this.state.timer.duration;
    this.state.timer.status = 'paused';
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.notifySubscribers();
  }

  setTimerDuration(seconds) {
    this.state.timer.duration = seconds;
    this.state.timer.remaining = seconds;
    this.state.timer.status = 'paused';
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.notifySubscribers();
  }

  startTimerInterval() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.state.timer.status === 'running' && this.state.timer.remaining > 0) {
        this.state.timer.remaining -= 1;
        if (this.state.timer.remaining === 0) {
          this.state.timer.status = 'completed';
          clearInterval(this.timerInterval);
          this.timerInterval = null;
          this.notify('⏰ TASK TIME UP! Buzzer sounding!', 'error');
        }
        this.notifySubscribers();
      }
    }, 1000);
  }
}
