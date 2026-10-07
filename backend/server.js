// TechBoss Command Center — Backend Server (Zero External Dependencies)
// Implements API_CONTRACT.md and serves frontend/ on port 4000.
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { createState, getContestant, getTask, stats, derive, avatarFor } = require('./store');

const PORT = process.env.PORT || 4000;
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');
const state = createState();

// Timer ticker loop
setInterval(() => {
  if (state.timer.status === 'running' && state.timer.remaining > 0) {
    state.timer.remaining -= 1;
    if (state.timer.remaining === 0) {
      state.timer.status = 'completed';
    }
  }
}, 1000);

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

// Allowlist of servable files, built from disk at startup. Requested URLs are
// resolved to a normalized relative path and must match an entry exactly — no
// request data ever reaches the filesystem directly.
const staticFiles = new Map(); // normalized rel path (forward slashes) -> absolute path on disk
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else staticFiles.set(path.relative(FRONTEND_DIR, full).split(path.sep).join('/'), full);
  }
})(FRONTEND_DIR);

function serveStatic(req, res, filePath) {
  // Request path is only ever used as a Map lookup key — request data never
  // enters path.join/resolve or reaches the filesystem directly.
  const rel = filePath === '/' ? 'index.html' : String(filePath).replace(/^\/+/, '');
  const resolvedPath = staticFiles.get(rel);
  if (resolvedPath === undefined) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('File Not Found');
  }
  const ext = path.extname(resolvedPath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(resolvedPath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. GET /api/state
  if (req.method === 'GET' && pathname === '/api/state') {
    const derived = derive(state);
    return sendJson(res, 200, {
      contestants: state.contestants,
      tasks: state.tasks,
      announcements: state.announcements,
      timer: state.timer,
      stats: stats(state),
      dangerZone: derived.dangerZone,
      leaderboard: derived.leaderboard,
    });
  }

  // 2. POST /api/contestants (Add Contestant)
  if (req.method === 'POST' && pathname === '/api/contestants') {
    try {
      const data = await parseJsonBody(req);
      const name = String(data.name || '').trim();
      const team = String(data.team || 'Byte Brawlers').trim();
      const points = Number(data.points) || 0;
      if (!name) return sendJson(res, 400, { error: 'Name is required' });

      state.seq.c += 1;
      const newC = {
        id: 'c' + state.seq.c,
        name,
        team,
        points,
        status: 'Active',
        isCaptain: false,
        isImmune: false,
        isNominated: false,
        avatar: avatarFor(name),
      };
      state.contestants.push(newC);
      return sendJson(res, 201, newC);
    } catch (e) {
      return sendJson(res, 400, { error: 'Invalid JSON' });
    }
  }

  // 3. POST /api/contestants/:id/points
  const pointsMatch = pathname.match(/^\/api\/contestants\/([^\/]+)\/points$/);
  if (req.method === 'POST' && pointsMatch) {
    const id = pointsMatch[1];
    const c = getContestant(state, id);
    if (!c) return sendJson(res, 404, { error: 'Contestant not found' });
    const data = await parseJsonBody(req);
    const delta = Number(data.delta) || 0;
    c.points += delta;
    return sendJson(res, 200, c);
  }

  // 4. POST /api/contestants/:id/captain
  const captainMatch = pathname.match(/^\/api\/contestants\/([^\/]+)\/captain$/);
  if (req.method === 'POST' && captainMatch) {
    const id = captainMatch[1];
    const c = getContestant(state, id);
    if (!c) return sendJson(res, 404, { error: 'Contestant not found' });

    state.contestants.forEach(item => {
      if (item.id === id) {
        item.isCaptain = true;
        item.isImmune = true;
        item.isNominated = false;
      } else {
        item.isCaptain = false;
      }
    });
    return sendJson(res, 200, c);
  }

  // 5. POST /api/contestants/:id/nominate
  const nominateMatch = pathname.match(/^\/api\/contestants\/([^\/]+)\/nominate$/);
  if (req.method === 'POST' && nominateMatch) {
    const id = nominateMatch[1];
    const c = getContestant(state, id);
    if (!c) return sendJson(res, 404, { error: 'Contestant not found' });

    // Strict rule validation: Immune or Captain CANNOT be nominated!
    if (c.isImmune) {
      return sendJson(res, 400, { error: 'Immune contestants cannot be nominated' });
    }
    if (c.isCaptain) {
      return sendJson(res, 400, { error: 'House captain cannot be nominated' });
    }

    c.isNominated = true;
    return sendJson(res, 200, c);
  }

  // 6. DELETE /api/contestants/:id/nominate (Save from nomination)
  if (req.method === 'DELETE' && nominateMatch) {
    const id = nominateMatch[1];
    const c = getContestant(state, id);
    if (!c) return sendJson(res, 404, { error: 'Contestant not found' });
    c.isNominated = false;
    return sendJson(res, 200, c);
  }

  // 7. POST /api/contestants/:id/immunity
  const immunityMatch = pathname.match(/^\/api\/contestants\/([^\/]+)\/immunity$/);
  if (req.method === 'POST' && immunityMatch) {
    const id = immunityMatch[1];
    const c = getContestant(state, id);
    if (!c) return sendJson(res, 404, { error: 'Contestant not found' });
    const data = await parseJsonBody(req);
    c.isImmune = Boolean(data.immune);
    if (c.isImmune && c.isNominated) {
      c.isNominated = false;
    }
    return sendJson(res, 200, c);
  }

  // 8. POST /api/contestants/:id/evict
  const evictMatch = pathname.match(/^\/api\/contestants\/([^\/]+)\/evict$/);
  if (req.method === 'POST' && evictMatch) {
    const id = evictMatch[1];
    const c = getContestant(state, id);
    if (!c) return sendJson(res, 404, { error: 'Contestant not found' });
    c.status = 'Evicted';
    c.isCaptain = false;
    c.isImmune = false;
    c.isNominated = false;
    return sendJson(res, 200, c);
  }

  // 9. Tasks: POST /api/tasks
  if (req.method === 'POST' && pathname === '/api/tasks') {
    const data = await parseJsonBody(req);
    state.seq.t += 1;
    const newTask = {
      id: 't' + state.seq.t,
      title: data.title || 'House Task',
      description: data.description || '',
      assignedTo: data.assignedTo || 'c1',
      points: Number(data.points) || 50,
      status: 'In Progress',
    };
    state.tasks.push(newTask);
    return sendJson(res, 201, newTask);
  }

  // 10. PATCH / POST /api/tasks/:id/complete
  const taskCompleteMatch = pathname.match(/^\/api\/tasks\/([^\/]+)\/complete$/);
  if ((req.method === 'PATCH' || req.method === 'POST') && taskCompleteMatch) {
    const id = taskCompleteMatch[1];
    const t = getTask(state, id);
    if (!t) return sendJson(res, 404, { error: 'Task not found' });
    t.status = 'Completed';
    const c = getContestant(state, t.assignedTo);
    if (c) c.points += t.points;
    return sendJson(res, 200, { task: t, contestant: c });
  }

  // 11. Announcements: POST /api/announcements
  if (req.method === 'POST' && pathname === '/api/announcements') {
    const data = await parseJsonBody(req);
    state.seq.a += 1;
    const newA = {
      id: 'a' + state.seq.a,
      message: data.message || '',
      priority: data.priority || 'normal',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    state.announcements.push(newA);
    return sendJson(res, 201, newA);
  }

  // 12. Timer: POST /api/timer/start, pause, reset
  if (req.method === 'POST' && pathname === '/api/timer/start') {
    state.timer.status = 'running';
    return sendJson(res, 200, state.timer);
  }
  if (req.method === 'POST' && pathname === '/api/timer/pause') {
    state.timer.status = 'paused';
    return sendJson(res, 200, state.timer);
  }
  if (req.method === 'POST' && pathname === '/api/timer/reset') {
    const data = await parseJsonBody(req);
    if (data.duration) state.timer.duration = Number(data.duration);
    state.timer.remaining = state.timer.duration;
    state.timer.status = 'paused';
    return sendJson(res, 200, state.timer);
  }

  // Default: Serve frontend static assets
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`⚡ TechBoss Command Center running at http://localhost:${PORT}`);
});
