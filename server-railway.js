/**
 * Servidor Railway com PostgreSQL direto
 * Adaptado de server-supabase.js
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./src/config/database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

console.log('🚀 Iniciando servidor Railway PostgreSQL...');

// ==================== HEALTH CHECK ====================
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// ==================== AUTENTICAÇÃO ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, organizationName } = req.body;

    // Verificar se usuário já existe
    const existingUser = await db.single(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criar organização
    const slug = organizationName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-');

    const org = await db.single(
      'INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING *',
      [organizationName, slug]
    );

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário admin
    const user = await db.single(
      `INSERT INTO users (email, password, name, role, organization_id, active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [email, hashedPassword, name, 'ADMIN', org.id, true]
    );

    // Criar token JWT
    const token = jwt.sign(
      { userId: user.id, organizationId: org.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: org.id
      }
    });
  } catch (error) {
    console.error('Erro no register:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.single(
      `SELECT u.*, o.name as organization_name, o.slug as organization_slug
       FROM users u
       JOIN organizations o ON u.organization_id = o.id
       WHERE u.email = $1 AND u.active = true`,
      [email]
    );

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, organizationId: user.organization_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organization_id,
        organization: {
          name: user.organization_name,
          slug: user.organization_slug
        }
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: error.message });
  }
});

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = decoded;
    next();
  });
}

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.single(
      `SELECT u.id, u.email, u.name, u.role, u.organization_id,
              o.name as organization_name, o.slug as organization_slug
       FROM users u
       JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = $1`,
      [req.user.userId]
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organization_id,
      organization: {
        name: user.organization_name,
        slug: user.organization_slug
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== PROJECTS ====================

app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await db.many(
      `SELECT p.*,
              s.name as store_name,
              ws.name as work_status_name, ws.color as work_status_color,
              i.name as integrator_name,
              a.name as assembler_name,
              e.name as electrician_name
       FROM projects p
       LEFT JOIN stores s ON p.store_id = s.id
       LEFT JOIN work_statuses ws ON p.work_status_id = ws.id
       LEFT JOIN integrators i ON p.integrator_id = i.id
       LEFT JOIN assemblers a ON p.assembler_id = a.id
       LEFT JOIN electricians e ON p.electrician_id = e.id
       WHERE p.organization_id = $1 AND p.archived = false
       ORDER BY p.display_order ASC, p.created_at DESC`,
      [req.user.organizationId]
    );

    res.json(projects);
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const project = await db.single(
      `SELECT p.*,
              s.name as store_name,
              ws.name as work_status_name, ws.color as work_status_color,
              i.name as integrator_name,
              a.name as assembler_name,
              e.name as electrician_name
       FROM projects p
       LEFT JOIN stores s ON p.store_id = s.id
       LEFT JOIN work_statuses ws ON p.work_status_id = ws.id
       LEFT JOIN integrators i ON p.integrator_id = i.id
       LEFT JOIN assemblers a ON p.assembler_id = a.id
       LEFT JOIN electricians e ON p.electrician_id = e.id
       WHERE p.id = $1 AND p.organization_id = $2`,
      [req.params.id, req.user.organizationId]
    );

    if (!project) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }

    res.json(project);
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  try {
    const project = await db.single(
      `INSERT INTO projects (name, organization_id, is_current)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [req.body.name, req.user.organizationId, false]
    );

    io.emit('project:created', project);
    res.json(project);
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Construir query dinamicamente
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

    const project = await db.single(
      `UPDATE projects
       SET ${setClause}, updated_at = NOW()
       WHERE id = $${fields.length + 1} AND organization_id = $${fields.length + 2}
       RETURNING *`,
      [...values, id, req.user.organizationId]
    );

    if (!project) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }

    io.emit('project:updated', project);
    res.json(project);
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    // Soft delete
    const project = await db.single(
      `UPDATE projects
       SET archived = true, updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING *`,
      [req.params.id, req.user.organizationId]
    );

    if (!project) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }

    io.emit('project:deleted', { id: req.params.id });
    res.json({ message: 'Projeto arquivado com sucesso' });
  } catch (error) {
    console.error('Erro ao arquivar projeto:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== TASKS ====================

app.get('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await db.many(
      `SELECT t.*
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.project_id = $1 AND p.organization_id = $2
       ORDER BY t.display_order ASC, t.created_at DESC`,
      [req.params.projectId, req.user.organizationId]
    );

    res.json(tasks);
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/projects/:projectId/tasks', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { id, title, status } = req.body;

    const task = await db.single(
      `INSERT INTO tasks (id, title, status, project_id, organization_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, title, status || 'backlog', projectId, req.user.organizationId]
    );

    io.emit('task:created', task);
    res.json(task);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');

    const task = await db.single(
      `UPDATE tasks t
       SET ${setClause}, updated_at = NOW()
       FROM projects p
       WHERE t.id = $${fields.length + 1}
         AND t.project_id = p.id
         AND p.organization_id = $${fields.length + 2}
       RETURNING t.*`,
      [...values, id, req.user.organizationId]
    );

    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    io.emit('task:updated', task);
    res.json(task);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await db.single(
      `DELETE FROM tasks t
       USING projects p
       WHERE t.id = $1
         AND t.project_id = p.id
         AND p.organization_id = $2
       RETURNING t.*`,
      [req.params.id, req.user.organizationId]
    );

    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    io.emit('task:deleted', { id: req.params.id });
    res.json({ message: 'Tarefa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== SETTINGS (Stores, Integrators, etc) ====================

app.get('/api/settings/stores', authenticateToken, async (req, res) => {
  try {
    const stores = await db.many(
      'SELECT * FROM stores WHERE organization_id = $1 AND active = true ORDER BY name',
      [req.user.organizationId]
    );
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/settings/integrators', authenticateToken, async (req, res) => {
  try {
    const integrators = await db.many(
      'SELECT * FROM integrators WHERE organization_id = $1 ORDER BY name',
      [req.user.organizationId]
    );
    res.json(integrators);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/settings/assemblers', authenticateToken, async (req, res) => {
  try {
    const assemblers = await db.many(
      'SELECT * FROM assemblers WHERE organization_id = $1 ORDER BY name',
      [req.user.organizationId]
    );
    res.json(assemblers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/settings/electricians', authenticateToken, async (req, res) => {
  try {
    const electricians = await db.many(
      'SELECT * FROM electricians WHERE organization_id = $1 ORDER BY name',
      [req.user.organizationId]
    );
    res.json(electricians);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/settings/work-statuses', authenticateToken, async (req, res) => {
  try {
    const statuses = await db.many(
      'SELECT * FROM work_statuses WHERE organization_id = $1 AND active = true ORDER BY order_position',
      [req.user.organizationId]
    );
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== DASHBOARD PÚBLICO ====================

app.get('/api/dashboard', async (req, res) => {
  try {
    const projects = await db.many(
      `SELECT p.*,
              s.name as store_name,
              ws.name as work_status_name, ws.color as work_status_color,
              i.name as integrator_name
       FROM projects p
       LEFT JOIN stores s ON p.store_id = s.id
       LEFT JOIN work_statuses ws ON p.work_status_id = ws.id
       LEFT JOIN integrators i ON p.integrator_id = i.id
       WHERE p.archived = false
       ORDER BY p.created_at DESC`
    );

    const stores = await db.many('SELECT * FROM stores WHERE active = true ORDER BY name');
    const integrators = await db.many('SELECT * FROM integrators ORDER BY name');

    res.json({ projects, stores, integrators });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== CALENDÁRIO PÚBLICO ====================

app.get('/api/calendar', async (req, res) => {
  try {
    const projects = await db.many(
      `SELECT p.*,
              s.name as store_name,
              i.name as integrator_name
       FROM projects p
       LEFT JOIN stores s ON p.store_id = s.id
       LEFT JOIN integrators i ON p.integrator_id = i.id
       WHERE p.archived = false`
    );

    // Transformar em eventos
    const events = [];
    const eventTypes = [
      { field: 'start_date', type: 'start_date', label: 'Início da Obra', color: '#22c55e' },
      { field: 'delivery_forecast', type: 'delivery_forecast', label: 'Previsão de Entrega', color: '#3b82f6' },
      { field: 'gsi_forecast_date', type: 'gsi_forecast_date', label: 'Previsão GSI', color: '#f59e0b' },
      { field: 'gsi_actual_date', type: 'gsi_actual_date', label: 'GSI Confirmado', color: '#10b981' }
    ];

    projects.forEach(project => {
      eventTypes.forEach(({ field, type, label, color }) => {
        if (project[field]) {
          events.push({
            id: `${project.id}-${type}`,
            projectId: project.id,
            title: project.name,
            date: project[field],
            type,
            typeLabel: label,
            color,
            store: project.store_name,
            integrator: project.integrator_name,
            category: project.category
          });
        }
      });
    });

    const stores = await db.many('SELECT * FROM stores WHERE active = true ORDER BY name');
    const integrators = await db.many('SELECT * FROM integrators ORDER BY name');

    res.json({ events, stores, integrators, eventTypes });
  } catch (error) {
    console.error('Erro no calendário:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// ==================== INICIAR SERVIDOR ====================

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
  console.log(`💾 Banco: Railway PostgreSQL`);
});
