const { PrismaClient } = require('@prisma/client');
const { nanoid } = require('nanoid');

const prisma = new PrismaClient();

// Status disponíveis
const STATUSES = ['Criado','Em separação','Pendencia','Em romaneio','Entregue'];

/**
 * Helper: Data/hora no formato BR
 */
function nowBRTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Helper: Formata timestamp e atualiza status
 */
function stampAndMove(task, toStatus, method='api') {
  if (!toStatus || task.status === toStatus) return task;
  
  const dates = task.dates || {};
  const stamp = new Date().toLocaleDateString('pt-BR') + ' ' + nowBRTime();
  dates[toStatus] = stamp;
  
  const toIdx = STATUSES.indexOf(toStatus);
  STATUSES.forEach((s, i) => { 
    if (i > toIdx) delete dates[s]; 
  });
  
  const history = task.history || [];
  history.push({ 
    at: stamp, 
    from: task.status, 
    to: toStatus, 
    method 
  });
  
  return {
    ...task,
    status: toStatus,
    dates,
    history
  };
}

/**
 * GET /api/state
 * Retorna estado completo da organização do usuário
 */
async function getState(req, res) {
  try {
    const organizationId = req.user.organizationId;

    // Busca todos os projetos com tarefas
    const projects = await prisma.project.findMany({
      where: { organizationId },
      include: {
        tasks: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Busca projeto atual
    const currentProject = projects.find(p => p.isCurrent);
    const currentProjectId = currentProject?.id || projects[0]?.id || null;

    res.json({
      projects,
      currentProjectId
    });

  } catch (error) {
    console.error('Erro ao buscar estado:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar dados',
      details: error.message 
    });
  }
}

/**
 * POST /api/project
 * Cria novo projeto
 */
async function createProject(req, res) {
  try {
    const { name } = req.body;
    const organizationId = req.user.organizationId;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome do projeto é obrigatório' });
    }

    // Desmarca todos como current
    await prisma.project.updateMany({
      where: { organizationId },
      data: { isCurrent: false }
    });

    // Cria novo projeto como current
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        isCurrent: true,
        organizationId,
        detailsChecklist: [{ text: '', checked: false }],
        detailsText: ''
      }
    });

    res.json({ ok: true, projectId: project.id });

  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    res.status(500).json({ 
      error: 'Erro ao criar projeto',
      details: error.message 
    });
  }
}

/**
 * PATCH /api/project/:id
 * Atualiza projeto
 */
async function updateProject(req, res) {
  try {
    const { id } = req.params;
    const { name, current, detailsChecklist, detailsText } = req.body;
    const organizationId = req.user.organizationId;

    // Verifica se projeto pertence à organização
    const project = await prisma.project.findFirst({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const updateData = {};
    
    if (typeof name === 'string' && name.trim()) {
      updateData.name = name.trim();
    }
    
    if (detailsChecklist !== undefined) {
      updateData.detailsChecklist = detailsChecklist;
    }
    
    if (detailsText !== undefined) {
      updateData.detailsText = detailsText;
    }

    // Se marcado como current
    if (current === true) {
      await prisma.project.updateMany({
        where: { organizationId },
        data: { isCurrent: false }
      });
      updateData.isCurrent = true;
    }

    await prisma.project.update({
      where: { id },
      data: updateData
    });

    res.json({ ok: true });

  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar projeto',
      details: error.message 
    });
  }
}

/**
 * DELETE /api/project/:id
 * Remove projeto
 */
async function deleteProject(req, res) {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Verifica se pertence à organização
    const project = await prisma.project.findFirst({
      where: { id, organizationId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    await prisma.project.delete({ where: { id } });

    // Se não sobrou nenhum, cria um novo
    const remaining = await prisma.project.count({ 
      where: { organizationId } 
    });

    if (remaining === 0) {
      await prisma.project.create({
        data: {
          name: 'Obra 1',
          isCurrent: true,
          organizationId,
          detailsChecklist: [{ text: '', checked: false }],
          detailsText: ''
        }
      });
    } else if (project.isCurrent) {
      // Marca o primeiro como current
      const first = await prisma.project.findFirst({
        where: { organizationId },
        orderBy: { createdAt: 'asc' }
      });
      if (first) {
        await prisma.project.update({
          where: { id: first.id },
          data: { isCurrent: true }
        });
      }
    }

    res.json({ ok: true });

  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar projeto',
      details: error.message 
    });
  }
}

/**
 * POST /api/task
 * Cria nova tarefa
 */
async function createTask(req, res) {
  try {
    const { projectId, title } = req.body;
    const organizationId = req.user.organizationId;

    if (!projectId || !title) {
      return res.status(400).json({ 
        error: 'projectId e title são obrigatórios' 
      });
    }

    // Verifica se projeto existe e pertence à organização
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const now = new Date().toLocaleDateString('pt-BR') + ' ' + nowBRTime();

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        status: 'Criado',
        created: now,
        dates: { 'Criado': now },
        history: [],
        projectId
      }
    });

    res.json({ ok: true, taskId: task.id });

  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    res.status(500).json({ 
      error: 'Erro ao criar tarefa',
      details: error.message 
    });
  }
}

/**
 * PATCH /api/task/:id
 * Atualiza tarefa
 */
async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const { projectId, title, toStatus } = req.body;
    const organizationId = req.user.organizationId;

    // Busca tarefa com projeto
    const task = await prisma.task.findFirst({
      where: { id },
      include: { project: true }
    });

    if (!task || task.project.organizationId !== organizationId) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const updateData = {};

    if (typeof title === 'string') {
      updateData.title = title;
    }

    if (toStatus) {
      const updated = stampAndMove(task, toStatus, 'api');
      updateData.status = updated.status;
      updateData.dates = updated.dates;
      updateData.history = updated.history;
    }

    await prisma.task.update({
      where: { id },
      data: updateData
    });

    res.json({ ok: true });

  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar tarefa',
      details: error.message 
    });
  }
}

/**
 * DELETE /api/task/:id
 * Remove tarefa
 */
async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const task = await prisma.task.findFirst({
      where: { id },
      include: { project: true }
    });

    if (!task || task.project.organizationId !== organizationId) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    await prisma.task.delete({ where: { id } });

    res.json({ ok: true });

  } catch (error) {
    console.error('Erro ao deletar tarefa:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar tarefa',
      details: error.message 
    });
  }
}

/**
 * POST /api/task/:id/duplicate-pending
 * Duplica tarefa como pendência
 */
async function duplicatePending(req, res) {
  try {
    const { id } = req.params;
    const { projectId, name } = req.body;
    const organizationId = req.user.organizationId;

    const task = await prisma.task.findFirst({
      where: { id },
      include: { project: true }
    });

    if (!task || task.project.organizationId !== organizationId) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const now = new Date().toLocaleDateString('pt-BR') + ' ' + nowBRTime();

    // Marca original como tendo pendência
    await prisma.task.update({
      where: { id },
      data: { hasPending: true }
    });

    // Cria cópia como pendência
    const copy = await prisma.task.create({
      data: {
        title: name || `${task.title} — Pendência`,
        status: 'Pendencia',
        created: now,
        dates: { 'Pendencia': now },
        history: [],
        parentId: id,
        projectId: task.projectId
      }
    });

    res.json({ ok: true, taskId: copy.id });

  } catch (error) {
    console.error('Erro ao duplicar pendência:', error);
    res.status(500).json({ 
      error: 'Erro ao duplicar pendência',
      details: error.message 
    });
  }
}

/**
 * POST /api/task/:id/advance-with-pending
 * Avança tarefa e cria pendência
 */
async function advanceWithPending(req, res) {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const task = await prisma.task.findFirst({
      where: { id },
      include: { project: true }
    });

    if (!task || task.project.organizationId !== organizationId) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    const now = new Date().toLocaleDateString('pt-BR') + ' ' + nowBRTime();
    
    // Avança original para "Em romaneio"
    const updated = stampAndMove(task, 'Em romaneio', '→P');
    await prisma.task.update({
      where: { id },
      data: {
        status: updated.status,
        dates: updated.dates,
        history: updated.history,
        hasPending: true
      }
    });

    // Cria pendência
    const copy = await prisma.task.create({
      data: {
        title: `${task.title} — Pendência`,
        status: 'Pendencia',
        created: now,
        dates: { 'Pendencia': now },
        history: [],
        parentId: id,
        projectId: task.projectId
      }
    });

    res.json({ ok: true, taskId: copy.id });

  } catch (error) {
    console.error('Erro ao avançar com pendência:', error);
    res.status(500).json({ 
      error: 'Erro ao avançar com pendência',
      details: error.message 
    });
  }
}

/**
 * POST /api/tasks/batch-copy
 * Copia múltiplas tarefas para outro projeto
 */
async function batchCopy(req, res) {
  try {
    const { sourceProjectId, targetProjectId, taskIds } = req.body;
    const organizationId = req.user.organizationId;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds deve ser array não-vazio' });
    }

    // Verifica projetos
    const [sourceProject, targetProject] = await Promise.all([
      prisma.project.findFirst({ 
        where: { id: sourceProjectId, organizationId } 
      }),
      prisma.project.findFirst({ 
        where: { id: targetProjectId, organizationId } 
      })
    ]);

    if (!sourceProject || !targetProject) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    const now = new Date().toLocaleDateString('pt-BR') + ' ' + nowBRTime();
    const created = [];

    // Busca tarefas originais
    const tasks = await prisma.task.findMany({
      where: { 
        id: { in: taskIds },
        projectId: sourceProjectId
      }
    });

    // Cria cópias
    for (const task of tasks) {
      const copy = await prisma.task.create({
        data: {
          title: task.title,
          status: 'Criado',
          created: now,
          dates: { 'Criado': now },
          history: [],
          projectId: targetProjectId
        }
      });
      created.push(copy.id);
    }

    res.json({ ok: true, created });

  } catch (error) {
    console.error('Erro em batch-copy:', error);
    res.status(500).json({ 
      error: 'Erro ao copiar tarefas',
      details: error.message 
    });
  }
}

/**
 * POST /api/tasks/batch-delete
 * Remove múltiplas tarefas
 */
async function batchDelete(req, res) {
  try {
    const { projectId, taskIds } = req.body;
    const organizationId = req.user.organizationId;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds deve ser array não-vazio' });
    }

    // Verifica projeto
    const project = await prisma.project.findFirst({
      where: { id: projectId, organizationId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }

    // Deleta tarefas
    await prisma.task.deleteMany({
      where: {
        id: { in: taskIds },
        projectId
      }
    });

    res.json({ ok: true });

  } catch (error) {
    console.error('Erro em batch-delete:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar tarefas',
      details: error.message 
    });
  }
}

module.exports = {
  getState,
  createProject,
  updateProject,
  deleteProject,
  createTask,
  updateTask,
  deleteTask,
  duplicatePending,
  advanceWithPending,
  batchCopy,
  batchDelete
};
