require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');
const os = require('os');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'db.json');

let state = { projects: [], currentProjectId: null };

// NOVO STATUS substituindo "Para separação"
const STATUSES = ['Criado','Em separação','Pendencia','Em romaneio','Entregue'];

function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(raw || '{}');
      state.projects = Array.isArray(data.projects) ? data.projects : [];

      // Atualiza tarefas antigas com status antigo
      state.projects.forEach(p => {
        (p.tasks || []).forEach(t => {
          if (t.status === 'Para separação') t.status = 'Criado';
          if (t.dates?.['Para separação']) {
            t.dates['Criado'] = t.dates['Para separação'];
            delete t.dates['Para separação'];
          }
        });
      });

      state.currentProjectId = data.currentProjectId || (state.projects[0]?.id ?? null);
    } else {
      const id = nanoid(8);
      state.projects = [{ id, name: 'Obra 1', tasks: [] }];
      state.currentProjectId = id;
      save();
    }
  } catch (e) {
    console.error('Erro ao carregar db.json:', e);
    state = { projects: [], currentProjectId: null };
  }
}
function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function nowBRTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function stampAndMove(task, toStatus, method='api') {
  if (!toStatus || task.status === toStatus) return;
  task.dates = task.dates || {};
  const stamp = new Date().toLocaleDateString('pt-BR') + ' ' + nowBRTime();
  task.dates[toStatus] = stamp;
  const toIdx = STATUSES.indexOf(toStatus);
  STATUSES.forEach((s,i)=>{ if (i > toIdx) delete task.dates[s]; });
  const from = task.status;
  task.status = toStatus;
  task.history = task.history || [];
  task.history.push({ at: stamp, from, to: toStatus, method });
}
const findProject = id => state.projects.find(p => p.id === id);
const findTask = (p, tid) => (p?.tasks || []).find(t => t.id === tid);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('/index.html')) {
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API
app.get('/api/state', (req, res) => res.json(state));

app.post('/api/project', (req, res) => {
  const name = String(req.body?.name || '').trim() || `Obra ${state.projects.length+1}`;
  const id = nanoid(8);
  state.projects.push({ id, name, tasks: [] });
  state.currentProjectId = id;
  save(); io.emit('state', state);
  res.json({ ok: true, projectId: id });
});

app.patch('/api/project/:id', (req, res) => {
  const p = findProject(req.params.id);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  const { name, current, details } = req.body || {};
if (typeof name === 'string' && name.trim()) p.name = name.trim();
if (typeof details === 'string') p.details = details; // <-- aceita salvar detalhes
if (current === true) state.currentProjectId = p.id;
  save(); io.emit('state', state);
  res.json({ ok: true });
});

app.delete('/api/project/:id', (req, res) => {
  const id = req.params.id;
  state.projects = state.projects.filter(p => p.id !== id);
  if (!state.projects.length) {
    const nid = nanoid(8);
    state.projects = [{ id: nid, name: 'Obra 1', tasks: [] }];
    state.currentProjectId = nid;
  } else if (state.currentProjectId === id) {
    state.currentProjectId = state.projects[0].id;
  }
  save(); io.emit('state', state);
  res.json({ ok: true });
});

app.post('/api/task', (req, res) => {
  const { projectId, title } = req.body || {};
  const p = findProject(projectId);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  const now = new Date().toLocaleDateString('pt-BR') + ' ' + nowBRTime();
  const t = {
    id: nanoid(8),
    title: String(title || 'Tarefa').trim(),
    status: 'Criado',
    created: now,
    dates: { 'Criado': now }
  };
  p.tasks.push(t);
  save(); io.emit('state', state);
  res.json({ ok: true, taskId: t.id });
});

app.patch('/api/task/:id', (req, res) => {
  const { projectId, title, toStatus } = req.body || {};
  const p = findProject(projectId);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  const t = findTask(p, req.params.id);
  if (!t) return res.status(404).json({ error: 'Tarefa não encontrada' });
  if (typeof title === 'string') t.title = title;
  if (toStatus) stampAndMove(t, toStatus, 'api');
  save(); io.emit('state', state);
  res.json({ ok: true });
});

app.delete('/api/task/:id', (req, res) => {
  const { projectId } = req.body || {};
  const p = findProject(projectId);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  p.tasks = (p.tasks || []).filter(t => t.id !== req.params.id);
  save(); io.emit('state', state);
  res.json({ ok: true });
});

app.post('/api/task/:id/duplicate-pending', (req, res) => {
  const { projectId, name } = req.body || {};
  const p = findProject(projectId);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  const t = findTask(p, req.params.id);
  if (!t) return res.status(404).json({ error: 'Tarefa não encontrada' });
  const now = new Date().toLocaleDateString('pt-BR') + ' ' + nowBRTime();
  t.hasPending = true;
  const copy = {
    id: nanoid(8),
    title: String(name || `${t.title} — Pendência`).trim(),
    status: 'Pendencia',
    created: now,
    dates: { 'Pendencia': now },
    parentId: t.id
  };
  p.tasks.push(copy);
  save(); io.emit('state', state);
  res.json({ ok: true, taskId: copy.id });
});

app.post('/api/task/:id/advance-with-pending', (req, res) => {
  const { projectId } = req.body || {};
  const p = findProject(projectId);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  const t = findTask(p, req.params.id);
  if (!t) return res.status(404).json({ error: 'Tarefa não encontrada' });

  // Marcar original
  t.hasPending = true;
  stampAndMove(t, 'Em romaneio', '→P');

  // Criar pendência
  const now = new Date().toLocaleDateString('pt-BR') + ' ' + nowBRTime();
  const copy = {
    id: nanoid(8),
    title: `${t.title} — Pendência`,
    status: 'Pendencia',
    created: now,
    dates: { 'Pendencia': now },
    parentId: t.id
  };
  p.tasks.push(copy);

  save(); io.emit('state', state);
  res.json({ ok: true, taskId: copy.id });
});

app.post('/api/task/:id/copy-to/:targetProjectId', (req, res) => {
  const { id, targetProjectId } = req.params;
  const sourceProject = state.projects.find(p => p.tasks.some(t => t.id === id));
  if (!sourceProject) return res.status(404).json({ error: 'Projeto de origem não encontrado' });
  const task = sourceProject.tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

  const targetProject = findProject(targetProjectId);
  if (!targetProject) return res.status(404).json({ error: 'Projeto de destino não encontrado' });

  const now = new Date().toLocaleDateString('pt-BR') + ' ' + nowBRTime();
  const clone = {
    id: nanoid(8),
    title: `${task.title}`,
    status: 'Criado',
    created: now,
    dates: { 'Criado': now }
  };
  targetProject.tasks.push(clone);

  save(); io.emit('state', state);
  res.json({ ok: true, taskId: clone.id });
});

// === LOTE: COPIAR ===
app.post('/api/tasks/batch-copy', (req, res) => {
  const { sourceProjectId, targetProjectId, taskIds } = req.body || {};
  const src = findProject(sourceProjectId);
  const dst = findProject(targetProjectId);
  if (!src || !dst) return res.status(404).json({ error: 'Projeto inválido' });
  if (!Array.isArray(taskIds) || !taskIds.length) return res.status(400).json({ error: 'taskIds vazio' });

  const now = new Date().toLocaleDateString('pt-BR') + ' ' + nowBRTime();
  const created = [];
  taskIds.forEach(id => {
    const t = (src.tasks || []).find(x => x.id === id);
    if (!t) return;
    const clone = {
      id: nanoid(8),
      title: `${t.title}`,
      status: 'Criado',
      created: now,
      dates: { 'Criado': now }
    };
    dst.tasks.push(clone);
    created.push(clone.id);
  });

  save(); io.emit('state', state);
  res.json({ ok: true, created });
});

// === LOTE: EXCLUIR ===
app.post('/api/tasks/batch-delete', (req, res) => {
  const { projectId, taskIds } = req.body || {};
  const p = findProject(projectId);
  if (!p) return res.status(404).json({ error: 'Projeto não encontrado' });
  if (!Array.isArray(taskIds) || !taskIds.length) return res.status(400).json({ error: 'taskIds vazio' });

  const set = new Set(taskIds);
  p.tasks = (p.tasks || []).filter(t => !set.has(t.id));

  save(); io.emit('state', state);
  res.json({ ok: true });
});

io.on('connection', (socket) => {
  socket.emit('state', state);
});

load();
server.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  const urls = [];
  Object.values(nets).flat().forEach(n => {
    if (n && n.family === 'IPv4' && !n.internal) {
      urls.push(`http://${n.address}:${PORT}`);
    }
  });
  console.log('✅ Servidor no ar:');
  console.log(`   • Local:     http://localhost:${PORT}`);
  urls.forEach(u => console.log(`   • Na rede:  ${u}`));
});
