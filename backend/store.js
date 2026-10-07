// TechBoss backend — in-memory state matching API_CONTRACT.md exactly.
'use strict';

const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const avatarFor = name => `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

function createState() {
  const state = {
    seq: { c: 9, t: 3, a: 2 },
    contestants: [],
    tasks: [],
    announcements: [],
    timer: { duration: 300, remaining: 300, status: 'paused' },
  };

  const seedC = [
    ['c1', 'Arjun Singhania', 'Cyber Cobras', 350, true, true, false],
    ['c2', 'Priya Sharma', 'Neural Ninjas', 310, false, false, false],
    ['c3', 'Kabir Mehra', 'Byte Brawlers', 260, false, false, true],
    ['c4', 'Ananya Roy', 'Neural Ninjas', 230, false, true, false],
    ['c5', 'Rohan Verma', 'Cyber Cobras', 195, false, false, true],
    ['c6', 'Tanvi Deshmukh', 'Byte Brawlers', 180, false, false, false],
    ['c7', 'Vikram Rathore', 'Cyber Cobras', 140, false, false, true],
    ['c8', 'Sneha Kulkarni', 'Neural Ninjas', 110, false, false, false],
    ['c9', 'Devansh Joshi', 'Byte Brawlers', 45, false, false, false, 'Evicted'],
  ];
  for (const [id, name, team, points, isCaptain, isImmune, isNominated, status] of seedC) {
    state.contestants.push({
      id, name, team, points,
      status: status || 'Active',
      isCaptain, isImmune, isNominated,
      avatar: avatarFor(name),
    });
  }

  state.tasks = [
    { id: 't1', title: 'Quantum Algorithm Challenge', description: 'Optimize the neural net under 60 seconds', assignedTo: 'c2', points: 50, status: 'In Progress' },
    { id: 't2', title: 'Ration Inventory Audit', description: 'Catalog food provisions and lock kitchen pantry', assignedTo: 'c3', points: 30, status: 'Pending' },
    { id: 't3', title: 'Secret Room Mystery Puzzle', description: 'Decode binary transmission on the main terminal', assignedTo: 'c1', points: 80, status: 'Completed' },
  ];

  state.announcements = [
    { id: 'a1', message: 'Bigg Boss chahte hain ki sabhi sadasya living area mein ekatrith ho jayein!', priority: 'critical', timestamp: '10:00 AM' },
    { id: 'a2', message: 'Nominations are now OPEN. Immune contestants cannot be nominated.', priority: 'urgent', timestamp: '10:12 AM' },
  ];

  state.logs = [
    {
      id: 'l1',
      timestamp: '14:00:45',
      timeAgo: '9m ago',
      category: 'AUTH',
      severity: 'info',
      actor: 'Security Engine',
      action: 'Role-Based Access Control Initialized',
      details: 'RBAC security layer active. Dual role permissions verified.',
      target: 'System Gateway',
    },
    {
      id: 'l2',
      timestamp: '13:54:12',
      timeAgo: '15m ago',
      category: 'POINTS',
      severity: 'success',
      actor: 'Big Boss Director',
      action: 'Points Awarded',
      details: '+30 points awarded to Arjun Singhania (Cyber Cobras).',
      target: 'Arjun Singhania',
    },
    {
      id: 'l3',
      timestamp: '13:42:00',
      timeAgo: '27m ago',
      category: 'CAPTAIN',
      severity: 'success',
      actor: 'Big Boss Director',
      action: 'House Captain Appointed',
      details: 'Arjun Singhania crowned House Captain with immunity.',
      target: 'Arjun Singhania',
    },
    {
      id: 'l4',
      timestamp: '13:30:18',
      timeAgo: '39m ago',
      category: 'NOMINATION',
      severity: 'warning',
      actor: 'Big Boss Director',
      action: 'Danger Zone Nomination',
      details: 'Kabir Mehra nominated to the Danger Zone.',
      target: 'Kabir Mehra',
    },
  ];

  return state;
}

function addLog(state, entry) {
  const logItem = {
    id: 'l' + (Date.now()),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    timeAgo: 'Just now',
    category: entry.category || 'SYSTEM',
    severity: entry.severity || 'info',
    actor: entry.actor || 'Big Boss Director',
    action: entry.action || 'Admin Action',
    details: entry.details || '',
    target: entry.target || '',
  };
  state.logs.unshift(logItem);
  if (state.logs.length > 100) state.logs.pop();
  return logItem;
}

const getContestant = (state, id) => state.contestants.find(c => c.id === id);
const getTask = (state, id) => state.tasks.find(t => t.id === id);

function stats(state) {
  const active = state.contestants.filter(c => c.status !== 'Evicted');
  const sorted = [...active].sort((a, b) => b.points - a.points);
  const top = sorted[0] || null;
  const low = sorted[sorted.length - 1] || null;
  return {
    highestScorer: top && { name: top.name, points: top.points },
    lowestScorer: low && { name: low.name, points: low.points },
    totalContestants: state.contestants.length,
    activeContestants: active.length,
    evictedCount: state.contestants.length - active.length,
    nominatedCount: state.contestants.filter(c => c.isNominated).length,
    completedTasks: state.tasks.filter(t => t.status === 'Completed').length,
    totalTasks: state.tasks.length,
  };
}

// Derived views for features 2 (leaderboard) and 8 (danger zone).
function derive(state) {
  const active = state.contestants.filter(c => c.status !== 'Evicted');
  return {
    leaderboard: [...active]
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .map((c, i) => ({ rank: i + 1, id: c.id, name: c.name, team: c.team, points: c.points, isCaptain: c.isCaptain, isImmune: c.isImmune })),
    dangerZone: state.contestants.filter(c => c.isNominated && c.status !== 'Evicted')
      .map(c => ({ id: c.id, name: c.name, team: c.team, points: c.points })),
  };
}

module.exports = { createState, getContestant, getTask, stats, derive, esc, avatarFor, addLog };
