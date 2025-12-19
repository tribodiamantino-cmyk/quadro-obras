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

// ==================== VERSION ====================
app.get('/api/version', (req, res) => {
  res.json({ version: 'v1.0.9', server: 'Railway PostgreSQL' });
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

// IMPORTANTE: /api/projects/state DEVE vir ANTES de /api/projects/:id
// para evitar que "state" seja tratado como um UUID

app.get('/api/projects/state', authenticateToken, async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const currentProjectId = req.query.currentProjectId;
    const includeArchived = req.query.includeArchived === 'true';
    
    // Buscar todos os projetos (incluindo arquivados se solicitado)
    // Otimização: Uma única query com todos os JOINs
    const projects = await db.many(
      `SELECT p.id, p.name, p.details_checklist, p.details_text, p.observations, 
              p.is_current, p.archived, p.category, p.client_name,
              p.integrator_id, p.assembler_id, p.electrician_id,
              p.start_date, p.delivery_forecast, 
              p.gsi_forecast_date, p.gsi_actual_date, p.gsi_delivery_confirmed_at,
              p.location_lat, p.location_lng, p.location_address,
              p.organization_id, p.created_at, p.updated_at,
              p.store_id, p.work_status_id, p.priority, p.display_order,
              s.name as store_name, s.code as store_code, s.color as store_color,
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
       WHERE p.organization_id = $1 ${includeArchived ? '' : 'AND p.archived = false'}
       ORDER BY p.display_order, p.created_at DESC`,
      [orgId]
    );

    // Buscar tarefas para todos os projetos
    const allTasks = await db.many(
      `SELECT t.* FROM tasks t
       INNER JOIN projects p ON t.project_id = p.id
       WHERE p.organization_id = $1
       ORDER BY t.created_at`,
      [orgId]
    );

    // Organizar tarefas por projeto
    const tasksByProject = {};
    allTasks.forEach(task => {
      if (!tasksByProject[task.project_id]) {
        tasksByProject[task.project_id] = [];
      }
      tasksByProject[task.project_id].push(task);
    });

    // Adicionar tarefas aos projetos
    projects.forEach(project => {
      project.tasks = tasksByProject[project.id] || [];
    });

    // Buscar projeto atual se especificado
    let currentProject = null;
    if (currentProjectId) {
      currentProject = projects.find(p => p.id === currentProjectId);
    } else if (projects.length > 0) {
      // Se não especificado, pegar o primeiro projeto "atual" ou o primeiro da lista
      currentProject = projects.find(p => p.is_current) || projects[0];
    }

    const stores = await db.many(
      'SELECT * FROM stores WHERE organization_id = $1 AND active = true ORDER BY name',
      [orgId]
    );
    const integrators = await db.many(
      'SELECT * FROM integrators WHERE organization_id = $1 ORDER BY name',
      [orgId]
    );
    const assemblers = await db.many(
      'SELECT * FROM assemblers WHERE organization_id = $1 ORDER BY name',
      [orgId]
    );
    const electricians = await db.many(
      'SELECT * FROM electricians WHERE organization_id = $1 ORDER BY name',
      [orgId]
    );
    const workStatuses = await db.many(
      'SELECT * FROM work_statuses WHERE organization_id = $1 ORDER BY created_at',
      [orgId]
    );

    res.json({ 
      projects,
      currentProject,
      currentProjectId: currentProject?.id || null,
      stores, 
      integrators, 
      assemblers, 
      electricians, 
      workStatuses
    });
  } catch (error) {
    console.error('Erro ao buscar projects/state:', error);
    res.status(500).json({ message: error.message });
  }
});

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

// PATCH para atualização parcial de projeto
app.patch('/api/projects/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

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

// Buscar detalhes completos de um projeto específico
app.get('/api/projects/:id/details', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await db.single(
      `SELECT p.*,
              s.name as store_name, s.code as store_code, s.color as store_color,
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
      [id, req.user.organizationId]
    );

    if (!project) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }

    const tasks = await db.many(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at',
      [id]
    );

    res.json({ project, tasks });
  } catch (error) {
    console.error('Erro ao buscar detalhes do projeto:', error);
    res.status(500).json({ message: error.message });
  }
});

// Arquivar/Desarquivar obra
app.patch('/api/projects/:id/archive', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { archived } = req.body;

    const project = await db.single(
      `UPDATE projects
       SET archived = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [archived === true, id, req.user.organizationId]
    );

    if (!project) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }

    io.emit('project:archived', project);
    res.json(project);
  } catch (error) {
    console.error('Erro ao arquivar obra:', error);
    res.status(500).json({ message: error.message });
  }
});

// Excluir obra definitivamente
app.delete('/api/projects/:id/permanent', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a obra está arquivada
    const project = await db.single(
      'SELECT * FROM projects WHERE id = $1 AND organization_id = $2',
      [id, req.user.organizationId]
    );
    
    if (!project) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }
    
    if (!project.archived) {
      return res.status(400).json({ 
        message: 'Apenas obras arquivadas podem ser excluídas definitivamente' 
      });
    }
    
    // Excluir tarefas relacionadas primeiro
    await db.query('DELETE FROM tasks WHERE project_id = $1', [id]);
    
    // Excluir projeto
    await db.query(
      'DELETE FROM projects WHERE id = $1 AND organization_id = $2',
      [id, req.user.organizationId]
    );
    
    io.emit('project:deleted', { id });
    res.json({ message: 'Obra excluída definitivamente' });
  } catch (error) {
    console.error('Erro ao excluir obra:', error);
    res.status(500).json({ message: error.message });
  }
});

// Validar entrega GSI
app.post('/api/projects/:id/validate-gsi', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const currentDate = new Date().toISOString().split('T')[0];

    const project = await db.single(
      `UPDATE projects
       SET gsi_actual_date = $1, updated_at = NOW()
       WHERE id = $2 AND organization_id = $3
       RETURNING *`,
      [currentDate, id, req.user.organizationId]
    );

    if (!project) {
      return res.status(404).json({ message: 'Projeto não encontrado' });
    }

    io.emit('project:updated', project);
    res.json({ 
      message: 'Data efetiva de entrega GSI validada com sucesso!',
      project,
      actualDate: currentDate
    });
  } catch (error) {
    console.error('Erro ao validar entrega GSI:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reordenar projetos (drag & drop)
app.post('/api/projects/reorder', authenticateToken, async (req, res) => {
  try {
    const { projectIds } = req.body;

    if (!Array.isArray(projectIds)) {
      return res.status(400).json({ message: 'projectIds deve ser um array' });
    }

    // Atualizar ordem de cada projeto
    for (let i = 0; i < projectIds.length; i++) {
      await db.query(
        `UPDATE projects
         SET display_order = $1, updated_at = NOW()
         WHERE id = $2 AND organization_id = $3`,
        [i, projectIds[i], req.user.organizationId]
      );
    }

    io.emit('projects:reordered', { projectIds });
    res.json({ message: 'Ordem atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao reordenar projetos:', error);
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

// Criar tarefa (rota genérica)
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { title, status, projectId } = req.body;

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const task = await db.single(
      `INSERT INTO tasks (id, title, status, project_id, organization_id, dates, history)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [taskId, title, status || 'Criado', projectId, req.user.organizationId, '{}', '[]']
    );

    io.emit('task:created', task);
    res.json(task);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ message: error.message });
  }
});

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

// PATCH para atualização parcial de tarefa
app.patch('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log(`📝 Atualizando tarefa ${id}:`, updates);

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
      console.error(`❌ Tarefa ${id} não encontrada ou não pertence à organização`);
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    console.log(`✅ Tarefa ${id} atualizada com sucesso`);
    io.emit('task:updated', task);
    res.json(task);
  } catch (error) {
    console.error('❌ Erro ao atualizar tarefa:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mover tarefa para próxima/anterior coluna
app.patch('/api/tasks/:id/move', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;
    
    // Buscar tarefa atual
    const task = await db.single(
      `SELECT t.* FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1 AND p.organization_id = $2`,
      [id, req.user.organizationId]
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }
    
    // Mapeamento de fluxo de status
    const statusFlow = {
      'backlog': { next: 'doing', prev: null },
      'doing': { next: 'done', prev: 'backlog' },
      'done': { next: null, prev: 'doing' }
    };
    
    const newStatus = statusFlow[task.status]?.[direction];
    
    if (!newStatus) {
      return res.status(400).json({ message: 'Movimento inválido' });
    }
    
    // Atualizar status
    const updatedTask = await db.single(
      `UPDATE tasks t
       SET status = $1, updated_at = NOW()
       FROM projects p
       WHERE t.id = $2 AND t.project_id = p.id AND p.organization_id = $3
       RETURNING t.*`,
      [newStatus, id, req.user.organizationId]
    );
    
    io.emit('task:updated', updatedTask);
    res.json(updatedTask);
  } catch (error) {
    console.error('Erro ao mover tarefa:', error);
    res.status(500).json({ message: error.message });
  }
});

// Criar pendência (desdobramento de tarefa)
app.post('/api/tasks/:id/create-pending', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar tarefa original
    const originalTask = await db.single(
      `SELECT t.* FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1 AND p.organization_id = $2`,
      [id, req.user.organizationId]
    );
    
    if (!originalTask) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }
    
    // Validar que a tarefa está em "Em separação"
    if (originalTask.status !== 'Em separação') {
      return res.status(400).json({ message: 'Tarefa deve estar em "Em Separação"' });
    }
    
    // Mover tarefa original para "Em romaneio"
    await db.query(
      `UPDATE tasks t
       SET status = 'Em romaneio', updated_at = NOW()
       FROM projects p
       WHERE t.id = $1 AND t.project_id = p.id AND p.organization_id = $2`,
      [id, req.user.organizationId]
    );
    
    // Criar cópia como pendência
    const pendingId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pendingTask = await db.single(
      `INSERT INTO tasks (id, title, status, project_id, organization_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [pendingId, `Pendencia ${originalTask.title}`, 'Pendencia', originalTask.project_id, req.user.organizationId]
    );
    
    io.emit('task:updated', { id, status: 'Em romaneio' });
    io.emit('task:created', pendingTask);
    
    res.json({ 
      original: { id, status: 'Em romaneio' },
      pending: pendingTask 
    });
  } catch (error) {
    console.error('Erro ao criar pendência:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reordenar tarefas
app.post('/api/tasks/reorder', authenticateToken, async (req, res) => {
  try {
    const { taskIds, projectId } = req.body;

    if (!Array.isArray(taskIds)) {
      return res.status(400).json({ message: 'taskIds deve ser um array' });
    }

    for (let i = 0; i < taskIds.length; i++) {
      await db.query(
        `UPDATE tasks t
         SET display_order = $1, updated_at = NOW()
         FROM projects p
         WHERE t.id = $2 AND t.project_id = p.id AND p.organization_id = $3`,
        [i, taskIds[i], req.user.organizationId]
      );
    }

    io.emit('tasks:reordered', { taskIds, projectId });
    res.json({ message: 'Ordem das tarefas atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao reordenar tarefas:', error);
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
      'SELECT * FROM work_statuses WHERE organization_id = $1 ORDER BY created_at',
      [req.user.organizationId]
    );
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== STATE (usado pelo app.js) ====================

app.get('/api/state', authenticateToken, async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    
    // Retorna todos os projetos com suas tarefas e dados relacionados
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
       WHERE p.archived = false AND p.organization_id = $1
       ORDER BY p.display_order, p.created_at DESC`,
      [orgId]
    );

    // Buscar tarefas para cada projeto
    for (const project of projects) {
      const tasks = await db.many(
        `SELECT * FROM tasks 
         WHERE project_id = $1 
         ORDER BY created_at`,
        [project.id]
      );
      project.tasks = tasks;
    }

    const stores = await db.many(
      'SELECT * FROM stores WHERE organization_id = $1 AND active = true ORDER BY name',
      [orgId]
    );
    const integrators = await db.many(
      'SELECT * FROM integrators WHERE organization_id = $1 ORDER BY name',
      [orgId]
    );
    const assemblers = await db.many(
      'SELECT * FROM assemblers WHERE organization_id = $1 ORDER BY name',
      [orgId]
    );
    const electricians = await db.many(
      'SELECT * FROM electricians WHERE organization_id = $1 ORDER BY name',
      [orgId]
    );
    const workStatuses = await db.many(
      'SELECT * FROM work_statuses WHERE organization_id = $1 ORDER BY created_at',
      [orgId]
    );

    res.json({ 
      projects, 
      stores, 
      integrators, 
      assemblers, 
      electricians, 
      workStatuses,
      currentProjectId: null 
    });
  } catch (error) {
    console.error('Erro ao buscar state:', error);
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
      { field: 'start_date', type: 'start_date', label: 'Início da Obra', color: '#22c55e', icon: '🚀' },
      { field: 'delivery_forecast', type: 'delivery_forecast', label: 'Previsão de Entrega', color: '#3b82f6', icon: '📦' },
      { field: 'gsi_forecast_date', type: 'gsi_forecast_date', label: 'Previsão GSI', color: '#f59e0b', icon: '📅' },
      { field: 'gsi_actual_date', type: 'gsi_actual_date', label: 'GSI Confirmado', color: '#10b981', icon: '✅' }
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
            category: project.category,
            project: {
              id: project.id,
              name: project.name,
              archived: project.archived,
              category: project.category,
              store: { id: project.store_id, name: project.store_name },
              integrator: project.integrator_id ? { id: project.integrator_id, name: project.integrator_name } : null
            }
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
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
  console.log(`💾 Banco: Railway PostgreSQL`);
});
