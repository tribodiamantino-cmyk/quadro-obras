require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('./src/config/supabase');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Importar rotas
const settingsRoutes = require('./src/routes/settings.routes');

// ==================== AUTENTICAÇÃO ====================

// TEMPORÁRIO: Endpoint para resetar senha
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('email', email)
      .select();

    if (error) throw error;

    res.json({ message: 'Senha atualizada com sucesso!', updated: data.length });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, organizationName } = req.body;

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Criar organização
    const slug = organizationName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-');

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: organizationName, slug })
      .select()
      .single();

    if (orgError) throw orgError;

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        organization_id: org.id
      })
      .select()
      .single();

    if (userError) throw userError;

    // Criar token JWT
    const token = jwt.sign(
      { userId: user.id, organizationId: org.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar se usuário está ativo
    if (user.active === false) {
      return res.status(403).json({ message: 'Usuário desativado. Entre em contato com o administrador.' });
    }

    // Criar token JWT
    const token = jwt.sign(
      { userId: user.id, organizationId: user.organization_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Registrar login no log de auditoria (mas não bloqueia se falhar)
    try {
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        organization_id: user.organization_id,
        action: 'login',
        entity_type: 'user',
        entity_id: user.id,
        entity_name: user.name,
        old_data: null,
        new_data: { email: user.email, name: user.name },
        ip_address: ipAddress,
        user_agent: userAgent
      });
    } catch (logError) {
      console.error('Erro ao registrar login no log:', logError);
    }

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role,
        organizationId: user.organization_id
      } 
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, organization_id')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ user: { ...user, organizationId: user.organization_id } });
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
});

// ==================== PROJETOS E TAREFAS ====================

// Helper para criar log de auditoria
async function createAuditLog(userId, organizationId, action, entityType, entityId, entityName, oldData, newData, req) {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    await supabase.from('audit_logs').insert({
      user_id: userId,
      organization_id: organizationId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      old_data: oldData,
      new_data: newData,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error);
  }
}

// Middleware para verificar autenticação
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Logout (registra no log de auditoria)
app.post('/api/auth/logout', authenticate, async (req, res) => {
  try {
    // Registrar logout no log de auditoria
    await createAuditLog(
      req.user.userId,
      req.user.organizationId,
      'logout',
      'user',
      req.user.userId,
      'Logout',
      null,
      null,
      req
    );

    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro ao registrar logout:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/projects/state', authenticate, async (req, res) => {
  try {
    const { storeId, statusId, category, showArchived, currentProjectId } = req.query;
    
    // Query base de projetos
    let projectsQuery = supabase
      .from('projects')
      .select('*, store:stores(*), work_status:work_statuses(*)')
      .eq('organization_id', req.user.organizationId);
    
    // Filtrar obras arquivadas (apenas se showArchived não for true)
    if (showArchived !== 'true') {
      projectsQuery = projectsQuery.eq('archived', false);
    }
    
    // Filtrar por loja se fornecido
    if (storeId && storeId !== 'all') {
      projectsQuery = projectsQuery.eq('store_id', storeId);
    }
    
    // Filtrar por status se fornecido
    if (statusId && statusId !== 'all') {
      projectsQuery = projectsQuery.eq('work_status_id', statusId);
    }
    
    // Filtrar por categoria se fornecido
    if (category && category !== 'all') {
      projectsQuery = projectsQuery.eq('category', category);
    }
    
    const { data: projects, error: projError } = await projectsQuery
      .order('created_at', { ascending: false });

    if (projError) throw projError;

    // Usar o currentProjectId se fornecido, senão pegar o primeiro projeto
    let currentProject = null;
    if (currentProjectId) {
      currentProject = projects.find(p => p.id === currentProjectId);
    }
    if (!currentProject) {
      currentProject = projects.find(p => p.is_current) || projects[0];
    }
    
    // Se há um projeto atual, buscar com todos os relacionamentos
    if (currentProject) {
      const { data: fullProject } = await supabase
        .from('projects')
        .select(`
          *,
          store:stores(*),
          work_status:work_statuses(*),
          integrator:integrators(*),
          assembler:assemblers(*),
          electrician:electricians(*)
        `)
        .eq('id', currentProject.id)
        .single();
      
      if (fullProject) {
        currentProject = fullProject;
      }
    }

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', currentProject?.id)
      .order('created_at', { ascending: true });

    if (tasksError) throw tasksError;
    
    // Buscar lojas e status para o frontend
    const { data: stores } = await supabase
      .from('stores')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .eq('active', true)
      .order('name', { ascending: true});
      
    const { data: workStatuses } = await supabase
      .from('work_statuses')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .eq('active', true)
      .order('order_position', { ascending: true });
      
    const { data: integrators } = await supabase
      .from('integrators')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .order('name', { ascending: true });
      
    const { data: assemblers } = await supabase
      .from('assemblers')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .order('name', { ascending: true });
      
    const { data: electricians } = await supabase
      .from('electricians')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .order('name', { ascending: true });

    res.json({
      projects: projects || [],
      currentProject: currentProject || null,
      tasks: tasks || [],
      stores: stores || [],
      workStatuses: workStatuses || [],
      integrators: integrators || [],
      assemblers: assemblers || [],
      electricians: electricians || []
    });
  } catch (error) {
    console.error('Erro ao buscar estado:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/projects', authenticate, async (req, res) => {
  try {
    const { 
      name, 
      clientName,
      storeId, 
      workStatusId, 
      integratorId,
      assemblerId,
      electricianId,
      startDate,
      deliveryForecast,
      locationLat,
      locationLng,
      locationAddress,
      priority,
      gsiForecastDate
    } = req.body;

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        client_name: clientName || null,
        store_id: storeId || null,
        work_status_id: workStatusId || null,
        integrator_id: integratorId || null,
        assembler_id: assemblerId || null,
        electrician_id: electricianId || null,
        start_date: startDate || null,
        delivery_forecast: deliveryForecast || null,
        location_lat: locationLat || null,
        location_lng: locationLng || null,
        location_address: locationAddress || null,
        priority: priority || 'medium',
        gsi_forecast_date: gsiForecastDate || null,
        gsi_actual_date: null,
        organization_id: req.user.organizationId,
        is_current: false
      })
      .select()
      .single();

    if (error) throw error;

    // Log de auditoria
    await createAuditLog(
      req.user.id,
      req.user.organizationId,
      'create',
      'project',
      project.id,
      project.name,
      null,
      { name: project.name, client_name: project.client_name },
      req
    );

    io.to(req.user.organizationId).emit('projectCreated', project);
    res.json(project);
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ message: error.message });
  }
});

// Endpoint otimizado: buscar apenas detalhes de um projeto específico
app.get('/api/projects/:id/details', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar projeto com todos os relacionamentos
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        store:stores(*),
        work_status:work_statuses(*),
        integrator:integrators(*),
        assembler:assemblers(*),
        electrician:electricians(*)
      `)
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .single();

    if (projectError) throw projectError;

    // Buscar tarefas do projeto
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true });

    if (tasksError) throw tasksError;

    res.json({ project, tasks });
  } catch (error) {
    console.error('Erro ao buscar detalhes do projeto:', error);
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select()
      .single();

    if (error) throw error;

    io.to(req.user.organizationId).emit('projectUpdated', project);
    res.json(project);
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({ message: error.message });
  }
});

// Atualizar obra completa (PUT)
app.put('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      clientName, 
      storeId, 
      workStatusId, 
      integratorId, 
      assemblerId, 
      electricianId,
      startDate,
      deliveryForecast,
      locationAddress,
      gsiForecastDate
    } = req.body;

    // Buscar dados antigos para log
    const { data: oldProject } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .single();

    const updates = {
      name,
      client_name: clientName,
      store_id: storeId,
      work_status_id: workStatusId,
      integrator_id: integratorId || null,
      assembler_id: assemblerId || null,
      electrician_id: electricianId || null,
      start_date: startDate || null,
      delivery_forecast: deliveryForecast || null,
      location_address: locationAddress || null,
      gsi_forecast_date: gsiForecastDate || null
    };

    const { data: project, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select(`
        *,
        store:stores(*),
        work_status:work_statuses(*),
        integrator:integrators(*),
        assembler:assemblers(*),
        electrician:electricians(*)
      `)
      .single();

    if (error) throw error;

    // Log de auditoria
    if (oldProject) {
      await createAuditLog(
        req.user.id,
        req.user.organizationId,
        'update',
        'project',
        project.id,
        project.name,
        { name: oldProject.name, client_name: oldProject.client_name },
        { name: project.name, client_name: project.client_name },
        req
      );
    }

    io.to(req.user.organizationId).emit('projectUpdated', project);
    res.json(project);
  } catch (error) {
    console.error('Erro ao atualizar obra:', error);
    res.status(500).json({ message: error.message });
  }
});

// Arquivar obra (PATCH)
app.patch('/api/projects/:id/archive', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { archived } = req.body;

    const { data: project, error } = await supabase
      .from('projects')
      .update({ archived: archived === true })
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select()
      .single();

    if (error) throw error;

    // Log de auditoria
    await createAuditLog(
      req.user.id,
      req.user.organizationId,
      archived ? 'archive' : 'restore',
      'project',
      project.id,
      project.name,
      { archived: !archived },
      { archived: archived },
      req
    );

    io.to(req.user.organizationId).emit('projectArchived', project);
    res.json(project);
  } catch (error) {
    console.error('Erro ao arquivar obra:', error);
    res.status(500).json({ message: error.message });
  }
});

// Excluir obra definitivamente (DELETE)
app.delete('/api/projects/:id/permanent', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a obra está arquivada e buscar dados para log
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!project.archived) {
      return res.status(400).json({ 
        message: 'Apenas obras arquivadas podem ser excluídas definitivamente' 
      });
    }
    
    // Excluir tarefas relacionadas primeiro
    const { error: tasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', id);
    
    if (tasksError) throw tasksError;
    
    // Excluir projeto
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('organization_id', req.user.organizationId);
    
    if (deleteError) throw deleteError;

    // Log de auditoria
    await createAuditLog(
      req.user.id,
      req.user.organizationId,
      'delete',
      'project',
      id,
      project.name,
      { name: project.name, client_name: project.client_name },
      null,
      req
    );
    
    io.to(req.user.organizationId).emit('projectDeleted', { id });
    res.json({ message: 'Obra excluída definitivamente' });
  } catch (error) {
    console.error('Erro ao excluir obra:', error);
    res.status(500).json({ message: error.message });
  }
});

// Validar entrega GSI (marcar data efetiva)
app.post('/api/projects/:id/validate-gsi', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data: project, error } = await supabase
      .from('projects')
      .update({ 
        gsi_actual_date: currentDate 
      })
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select()
      .single();

    if (error) throw error;

    io.to(req.user.organizationId).emit('projectUpdated', project);
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

app.post('/api/tasks', authenticate, async (req, res) => {
  try {
    const { title, status, projectId } = req.body;

    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        id: taskId,
        title,
        status,
        project_id: projectId,
        organization_id: req.user.organizationId,
        dates: {},
        history: []
      })
      .select()
      .single();

    if (error) throw error;

    io.to(req.user.organizationId).emit('taskCreated', task);
    res.json(task);
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ message: error.message });
  }
});

app.patch('/api/tasks/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select()
      .single();

    if (error) throw error;

    io.to(req.user.organizationId).emit('taskUpdated', task);
    res.json(task);
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/tasks/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('organization_id', req.user.organizationId);

    if (error) throw error;

    io.to(req.user.organizationId).emit('taskDeleted', { id });
    res.json({ message: 'Tarefa excluída' });
  } catch (error) {
    console.error('Erro ao excluir tarefa:', error);
    res.status(500).json({ message: error.message });
  }
});

// Mover tarefa para próxima/anterior coluna
app.patch('/api/tasks/:id/move', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body; // 'next' ou 'prev'
    
    // Buscar tarefa atual
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .single();
    
    if (fetchError) throw fetchError;
    
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
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    io.to(req.user.organizationId).emit('taskUpdated', updatedTask);
    res.json(updatedTask);
  } catch (error) {
    console.error('Erro ao mover tarefa:', error);
    res.status(500).json({ message: error.message });
  }
});

// Criar pendência (desdobramento de tarefa)
app.post('/api/tasks/:id/create-pending', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar tarefa original
    const { data: originalTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Validar que a tarefa está em "Em separação"
    if (originalTask.status !== 'Em separação') {
      return res.status(400).json({ message: 'Tarefa deve estar em "Em Separação"' });
    }
    
    // Mover tarefa original para "Em romaneio"
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ status: 'Em romaneio' })
      .eq('id', id)
      .eq('organization_id', req.user.organizationId);
    
    if (updateError) throw updateError;
    
    // Criar cópia como pendência com UUID
    const pendingId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { data: pendingTask, error: createError } = await supabase
      .from('tasks')
      .insert({
        id: pendingId,
        title: `Pendencia ${originalTask.title}`,
        status: 'Pendencia',
        project_id: originalTask.project_id,
        organization_id: req.user.organizationId
      })
      .select()
      .single();
    
    if (createError) throw createError;
    
    io.to(req.user.organizationId).emit('taskUpdated', { id });
    io.to(req.user.organizationId).emit('taskCreated', pendingTask);
    
    res.json({ 
      original: { id, status: 'done' },
      pending: pendingTask 
    });
  } catch (error) {
    console.error('Erro ao criar pendência:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== SETTINGS ROUTES ====================
app.use('/api/settings', settingsRoutes);

// ==================== MIGRAÇÃO GSI (TEMPORÁRIO) ====================
app.post('/api/apply-gsi-migration', async (req, res) => {
  try {
    console.log('🚀 Aplicando migração GSI...');
    
    // Tentar adicionar as colunas usando uma query SQL direta
    // Isso funciona criando um registro dummy que força o Supabase a aceitar os campos
    const dummyData = {
      name: 'MIGRATION_TEST_DELETE_ME',
      client_name: 'MIGRATION_TEST',
      organization_id: '00000000-0000-0000-0000-000000000000',
      gsi_forecast_date: '2024-01-01',
      gsi_actual_date: '2024-01-01'
    };
    
    const { data, error } = await supabase
      .from('projects')
      .insert(dummyData)
      .select()
      .single();
    
    if (error) {
      if (error.message.includes('column "gsi_forecast_date" does not exist')) {
        res.status(400).json({ 
          message: 'Campos GSI não existem. Execute no SQL Editor do Supabase:\nALTER TABLE projects ADD COLUMN IF NOT EXISTS gsi_forecast_date DATE, ADD COLUMN IF NOT EXISTS gsi_actual_date DATE;' 
        });
        return;
      }
      throw error;
    }
    
    // Se chegou aqui, os campos existem. Remover o registro dummy
    await supabase
      .from('projects')
      .delete()
      .eq('id', data.id);
    
    console.log('✅ Migração GSI aplicada com sucesso!');
    res.json({ 
      message: 'Migração GSI aplicada com sucesso! Os campos gsi_forecast_date e gsi_actual_date estão prontos.' 
    });
    
  } catch (error) {
    console.error('❌ Erro na migração GSI:', error);
    res.status(500).json({ 
      message: `Erro na migração: ${error.message}. Execute manualmente no Supabase SQL Editor.` 
    });
  }
});

// ==================== AUDITORIA (LOGS) ====================

// Listar logs de auditoria (com filtros e paginação)
app.get('/api/audit-logs', authenticate, async (req, res) => {
  try {
    const { userId, action, entityType, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        users!audit_logs_user_id_fkey(name, email)
      `, { count: 'exact' })
      .eq('organization_id', req.user.organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) query = query.eq('user_id', userId);
    if (action) query = query.eq('action', action);
    if (entityType) query = query.eq('entity_type', entityType);

    const { data: logs, error, count } = await query;

    if (error) throw error;

    res.json({
      logs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== GESTÃO DE USUÁRIOS ====================

// Criar novo usuário (apenas admins)
app.post('/api/users', authenticate, async (req, res) => {
  try {
    // Verificar se é admin (aceita maiúsculo e minúsculo)
    if (req.user.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ message: 'Apenas administradores podem criar usuários' });
    }

    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    // Validar role (aceita maiúsculo e minúsculo)
    const roleUpper = role.toUpperCase();
    if (!['ADMIN', 'MEMBER', 'VIEWER'].includes(roleUpper)) {
      return res.status(400).json({ message: 'Permissão inválida' });
    }

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: roleUpper, // Usar role em maiúsculo
        organization_id: req.user.organizationId,
        active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Log de auditoria
    await createAuditLog(
      req.user.id,
      req.user.organizationId,
      'create',
      'user',
      user.id,
      user.name,
      null,
      { name: user.name, email: user.email, role: user.role },
      req
    );

    // Remover senha do retorno
    delete user.password;

    io.to(req.user.organizationId).emit('userCreated', user);
    res.json(user);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: error.message });
  }
});

// Atualizar usuário (apenas admins ou próprio usuário)
app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, active } = req.body;

    // Verificar permissões
    const isSelf = id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: 'Sem permissão para editar este usuário' });
    }

    // Apenas admin pode mudar role e active
    if (!isAdmin && (role !== undefined || active !== undefined)) {
      return res.status(403).json({ message: 'Apenas administradores podem alterar permissões' });
    }

    // Buscar usuário atual
    const { data: oldUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .single();

    if (!oldUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Preparar dados para atualização
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (role && isAdmin) updateData.role = role;
    if (active !== undefined && isAdmin) updateData.active = active;

    // Atualizar
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select()
      .single();

    if (error) throw error;

    // Log de auditoria
    await createAuditLog(
      req.user.id,
      req.user.organizationId,
      'update',
      'user',
      user.id,
      user.name,
      { name: oldUser.name, email: oldUser.email, role: oldUser.role, active: oldUser.active },
      { name: user.name, email: user.email, role: user.role, active: user.active },
      req
    );

    delete user.password;

    io.to(req.user.organizationId).emit('userUpdated', user);
    res.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: error.message });
  }
});

// Deletar usuário (apenas admins)
app.delete('/api/users/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se é admin
    if (req.user.role?.toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ message: 'Apenas administradores podem excluir usuários' });
    }

    // Não pode deletar a si mesmo
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Você não pode excluir sua própria conta' });
    }

    // Buscar usuário antes de deletar (para log)
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .single();

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Deletar usuário
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .eq('organization_id', req.user.organizationId);

    if (error) throw error;

    // Log de auditoria
    await createAuditLog(
      req.user.id,
      req.user.organizationId,
      'delete',
      'user',
      user.id,
      user.name,
      { name: user.name, email: user.email, role: user.role },
      null,
      req
    );

    io.to(req.user.organizationId).emit('userDeleted', { id });
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ message: error.message });
  }
});

// Listar usuários da organização
app.get('/api/users', authenticate, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, active, created_at')
      .eq('organization_id', req.user.organizationId)
      .order('name');

    if (error) throw error;

    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== SOCKET.IO ====================

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('joinOrganization', (organizationId) => {
    socket.join(organizationId);
    console.log(`Socket ${socket.id} entrou na organização ${organizationId}`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// ==================== INICIAR SERVIDOR ====================

// ==================== ENDPOINT VERSÃO ====================
app.get('/api/version', (req, res) => {
  const packageJson = require('./package.json');
  const fs = require('fs');
  const path = require('path');
  
  // Pegar data de modificação do package.json como referência
  const packagePath = path.join(__dirname, 'package.json');
  const stats = fs.statSync(packagePath);
  const buildDate = stats.mtime;
  
  res.json({
    version: packageJson.version,
    buildDate: buildDate.toISOString(),
    name: packageJson.name
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
});
