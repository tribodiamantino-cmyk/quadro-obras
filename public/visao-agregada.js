// Visão Agregada - Todas as Tarefas
// Sistema de Kanban Global

let allProjects = [];
let allTasks = [];
let workStatuses = [];
let stores = [];
let integrators = [];
let assemblers = [];
let electricians = [];
let selectedTask = null;
let selectedProjectId = null;

// Filtros
let filters = {
  store: '',
  integrator: '',
  type: '',
  assembler: '',
  electrician: '',
  client: '',
  dateFrom: '',
  dateTo: ''
};

// Inicializar
async function init() {
  try {
    await Promise.all([
      loadProjects(),
      loadWorkStatuses(),
      loadStores(),
      loadIntegrators(),
      loadAssemblers(),
      loadElectricians()
    ]);
    
    extractAllTasks();
    populateFilters();
    renderBoard();
    setupFilterListeners();
    setupSocketListeners();
  } catch (error) {
    console.error('Erro ao inicializar:', error);
    showError();
  }
}

// Carregar dados
async function loadProjects() {
  const response = await api('/api/projects');
  allProjects = await response.json();
}

async function loadWorkStatuses() {
  const response = await api('/api/settings/work-statuses');
  workStatuses = await response.json();
  workStatuses.sort((a, b) => a.order_position - b.order_position);
}

async function loadStores() {
  const response = await api('/api/settings/stores');
  stores = await response.json();
}

async function loadIntegrators() {
  const response = await api('/api/settings/integrators');
  integrators = await response.json();
}

async function loadAssemblers() {
  const response = await api('/api/settings/assemblers');
  assemblers = await response.json();
}

async function loadElectricians() {
  const response = await api('/api/settings/electricians');
  electricians = await response.json();
}

// Extrair todas as tarefas de todos os projetos
function extractAllTasks() {
  allTasks = [];
  
  allProjects.forEach(project => {
    if (project.tasks && Array.isArray(project.tasks)) {
      project.tasks.forEach(task => {
        allTasks.push({
          ...task,
          project: {
            id: project.id,
            code: project.code,
            client_name: project.client_name,
            category: project.category,
            store_id: project.store_id,
            store: project.store,
            integrator_id: project.integrator_id,
            integrator: project.integrator,
            assembler_id: project.assembler_id,
            assembler: project.assembler,
            electrician_id: project.electrician_id,
            electrician: project.electrician,
            forecast_start: project.forecast_start,
            forecast_end: project.forecast_end
          }
        });
      });
    }
  });
  
  console.log(`✅ Extraídas ${allTasks.length} tarefas de ${allProjects.length} obras`);
}

// Popular filtros
function populateFilters() {
  // Lojas
  const storeSelect = document.getElementById('filter-store');
  storeSelect.innerHTML = '<option value="">Todas as lojas</option>' +
    stores.map(s => `<option value="${s.id}">${s.code} - ${s.name}</option>`).join('');
  
  // Integradoras
  const integratorSelect = document.getElementById('filter-integrator');
  integratorSelect.innerHTML = '<option value="">Todas as integradoras</option>' +
    integrators.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
  
  // Montadores
  const assemblerSelect = document.getElementById('filter-assembler');
  assemblerSelect.innerHTML = '<option value="">Todos os montadores</option>' +
    assemblers.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  
  // Eletricistas
  const electricianSelect = document.getElementById('filter-electrician');
  electricianSelect.innerHTML = '<option value="">Todos os eletricistas</option>' +
    electricians.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
}

// Filtrar tarefas
function getFilteredTasks() {
  return allTasks.filter(task => {
    const project = task.project;
    
    // Filtro por loja
    if (filters.store && project.store_id !== filters.store) {
      return false;
    }
    
    // Filtro por integradora
    if (filters.integrator && project.integrator_id !== filters.integrator) {
      return false;
    }
    
    // Filtro por tipo de obra
    if (filters.type && project.category !== filters.type) {
      return false;
    }
    
    // Filtro por montador
    if (filters.assembler && project.assembler_id !== filters.assembler) {
      return false;
    }
    
    // Filtro por eletricista
    if (filters.electrician && project.electrician_id !== filters.electrician) {
      return false;
    }
    
    // Filtro por cliente (busca parcial)
    if (filters.client) {
      const searchTerm = filters.client.toLowerCase();
      const clientName = (project.client_name || '').toLowerCase();
      if (!clientName.includes(searchTerm)) {
        return false;
      }
    }
    
    // Filtro por data de início
    if (filters.dateFrom && project.forecast_start) {
      if (new Date(project.forecast_start) < new Date(filters.dateFrom)) {
        return false;
      }
    }
    
    if (filters.dateTo && project.forecast_start) {
      if (new Date(project.forecast_start) > new Date(filters.dateTo)) {
        return false;
      }
    }
    
    return true;
  });
}

// Renderizar quadro
function renderBoard() {
  const boardEl = document.getElementById('board');
  const filteredTasks = getFilteredTasks();
  
  // Atualizar estatísticas
  updateStats(filteredTasks);
  
  // Renderizar colunas
  const columns = workStatuses.filter(s => s.active).map(status => {
    const tasksInColumn = filteredTasks.filter(t => t.work_status_id === status.id);
    
    return `
      <div class="column" data-status-id="${status.id}" ondrop="drop(event)" ondragover="allowDrop(event)" ondragleave="dragLeave(event)">
        <div class="column-header" style="border-color: ${status.color}">
          <div class="column-title">
            <span>${getStatusEmoji(status.name)}</span>
            <span>${status.name}</span>
          </div>
          <div class="column-count" style="color: ${status.color}">${tasksInColumn.length}</div>
        </div>
        <div class="column-tasks">
          ${tasksInColumn.length > 0 ? 
            tasksInColumn.map(task => renderTaskCard(task, status.color)).join('') :
            `<div class="empty-column">
              <div class="empty-column-icon">📭</div>
              <div>Nenhuma tarefa</div>
            </div>`
          }
        </div>
      </div>
    `;
  }).join('');
  
  boardEl.innerHTML = columns;
}

// Renderizar card de tarefa
function renderTaskCard(task, statusColor) {
  const project = task.project;
  const storeCode = project.store?.code || '?';
  const storeName = project.store?.name || 'Sem loja';
  const integratorName = project.integrator?.name || 'Sem integradora';
  const clientName = project.client_name || 'Sem cliente';
  const typeIcon = project.category === 'reforma' ? '🔧' : '🏗️';
  
  // Definir responsável baseado no tipo de tarefa
  let responsible = '';
  const taskNameLower = task.name.toLowerCase();
  if (taskNameLower.includes('montag') || taskNameLower.includes('instalação')) {
    responsible = project.assembler?.name || '';
  } else if (taskNameLower.includes('elétric') || taskNameLower.includes('eletric')) {
    responsible = project.electrician?.name || '';
  }
  
  return `
    <div class="task-card" 
         draggable="true" 
         ondragstart="drag(event)"
         onclick="openTaskModal('${task.id}', '${project.id}')"
         data-task-id="${task.id}"
         data-project-id="${project.id}"
         style="border-left-color: ${statusColor}">
      
      <div class="task-header">
        <div class="task-name">${task.name}</div>
        ${typeIcon && `<div class="task-tag">${typeIcon}</div>`}
      </div>
      
      <div class="task-info">
        <div class="task-info-row">
          <span>🏪</span>
          <span><strong>${storeCode}</strong> ${storeName}</span>
        </div>
        <div class="task-info-row">
          <span>👤</span>
          <span>${clientName}</span>
        </div>
        <div class="task-info-row">
          <span>🔌</span>
          <span>${integratorName}</span>
        </div>
        ${responsible && `
          <div class="task-info-row">
            <span>👷</span>
            <span><strong>${responsible}</strong></span>
          </div>
        `}
      </div>
      
      <div class="task-footer">
        <div class="task-tags">
          <div class="task-tag">${project.code || 'S/N'}</div>
        </div>
      </div>
    </div>
  `;
}

// Atualizar estatísticas
function updateStats(tasks) {
  document.getElementById('total-tasks').textContent = tasks.length;
  
  const uniqueProjects = new Set(tasks.map(t => t.project.id));
  document.getElementById('total-projects').textContent = uniqueProjects.size;
  
  const completedStatuses = workStatuses
    .filter(s => s.name.toLowerCase().includes('conclu') || s.name.toLowerCase().includes('entregue'))
    .map(s => s.id);
  
  const completedTasks = tasks.filter(t => completedStatuses.includes(t.work_status_id));
  document.getElementById('completed-tasks').textContent = completedTasks.length;
  
  const progressTasks = tasks.filter(t => !completedStatuses.includes(t.work_status_id));
  document.getElementById('progress-tasks').textContent = progressTasks.length;
}

// Obter emoji do status
function getStatusEmoji(statusName) {
  const name = statusName.toLowerCase();
  if (name.includes('aguard') || name.includes('pendent')) return '📋';
  if (name.includes('andamento') || name.includes('execu')) return '🔄';
  if (name.includes('conclu') || name.includes('finaliz')) return '✅';
  if (name.includes('entregue') || name.includes('entreg')) return '📦';
  if (name.includes('pausad') || name.includes('suspen')) return '⏸️';
  if (name.includes('cancel')) return '❌';
  return '📌';
}

// Configurar listeners de filtros
function setupFilterListeners() {
  document.getElementById('filter-store').addEventListener('change', (e) => {
    filters.store = e.target.value;
    renderBoard();
  });
  
  document.getElementById('filter-integrator').addEventListener('change', (e) => {
    filters.integrator = e.target.value;
    renderBoard();
  });
  
  document.getElementById('filter-type').addEventListener('change', (e) => {
    filters.type = e.target.value;
    renderBoard();
  });
  
  document.getElementById('filter-assembler').addEventListener('change', (e) => {
    filters.assembler = e.target.value;
    renderBoard();
  });
  
  document.getElementById('filter-electrician').addEventListener('change', (e) => {
    filters.electrician = e.target.value;
    renderBoard();
  });
  
  document.getElementById('filter-client').addEventListener('input', (e) => {
    filters.client = e.target.value;
    renderBoard();
  });
  
  document.getElementById('filter-date-from').addEventListener('change', (e) => {
    filters.dateFrom = e.target.value;
    renderBoard();
  });
  
  document.getElementById('filter-date-to').addEventListener('change', (e) => {
    filters.dateTo = e.target.value;
    renderBoard();
  });
}

// Limpar filtros
function clearFilters() {
  filters = {
    store: '',
    integrator: '',
    type: '',
    assembler: '',
    electrician: '',
    client: '',
    dateFrom: '',
    dateTo: ''
  };
  
  document.getElementById('filter-store').value = '';
  document.getElementById('filter-integrator').value = '';
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-assembler').value = '';
  document.getElementById('filter-electrician').value = '';
  document.getElementById('filter-client').value = '';
  document.getElementById('filter-date-from').value = '';
  document.getElementById('filter-date-to').value = '';
  
  renderBoard();
}

// Drag and Drop
function allowDrop(ev) {
  ev.preventDefault();
  const column = ev.currentTarget;
  column.classList.add('drag-over');
}

function dragLeave(ev) {
  const column = ev.currentTarget;
  column.classList.remove('drag-over');
}

function drag(ev) {
  const taskCard = ev.target.closest('.task-card');
  if (taskCard) {
    taskCard.classList.add('dragging');
    ev.dataTransfer.setData('taskId', taskCard.dataset.taskId);
    ev.dataTransfer.setData('projectId', taskCard.dataset.projectId);
  }
}

async function drop(ev) {
  ev.preventDefault();
  const column = ev.currentTarget;
  column.classList.remove('drag-over');
  
  const taskId = ev.dataTransfer.getData('taskId');
  const projectId = ev.dataTransfer.getData('projectId');
  const newStatusId = column.dataset.statusId;
  
  if (!taskId || !projectId || !newStatusId) return;
  
  try {
    // Atualizar no servidor
    await api(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ work_status_id: newStatusId })
    });
    
    // Atualizar localmente
    const task = allTasks.find(t => t.id === taskId && t.project.id === projectId);
    if (task) {
      task.work_status_id = newStatusId;
    }
    
    // Re-renderizar
    renderBoard();
    
    // Remover classe dragging
    document.querySelectorAll('.task-card.dragging').forEach(el => {
      el.classList.remove('dragging');
    });
  } catch (error) {
    console.error('Erro ao mover tarefa:', error);
    alert('Erro ao mover tarefa');
  }
}

// Modal
function openTaskModal(taskId, projectId) {
  const task = allTasks.find(t => t.id === taskId && t.project.id === projectId);
  if (!task) return;
  
  selectedTask = task;
  selectedProjectId = projectId;
  
  const project = task.project;
  const status = workStatuses.find(s => s.id === task.work_status_id);
  
  document.getElementById('modal-task-name').textContent = task.name;
  
  document.getElementById('modal-task-info').innerHTML = `
    <strong>Status:</strong> ${status?.name || 'Não definido'}<br>
    <strong>Descrição:</strong> ${task.description || 'Sem descrição'}<br>
    <strong>Observações:</strong> ${task.observations || 'Sem observações'}
  `;
  
  document.getElementById('modal-project-info').innerHTML = `
    <strong>Código:</strong> ${project.code || 'S/N'}<br>
    <strong>Cliente:</strong> ${project.client_name || 'Não informado'}<br>
    <strong>Loja:</strong> ${project.store?.code} - ${project.store?.name || 'Não definida'}<br>
    <strong>Integradora:</strong> ${project.integrator?.name || 'Não definida'}<br>
    <strong>Tipo:</strong> ${project.category === 'reforma' ? '🔧 Reforma' : '🏗️ Nova'}<br>
    <strong>Montador:</strong> ${project.assembler?.name || 'Não definido'}<br>
    <strong>Eletricista:</strong> ${project.electrician?.name || 'Não definido'}<br>
    <strong>Previsão Início:</strong> ${project.forecast_start ? formatDate(project.forecast_start) : 'Não definida'}<br>
    <strong>Previsão Término:</strong> ${project.forecast_end ? formatDate(project.forecast_end) : 'Não definida'}
  `;
  
  document.getElementById('task-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('task-modal').classList.remove('active');
  selectedTask = null;
  selectedProjectId = null;
}

function goToProject() {
  if (selectedProjectId) {
    window.location.href = `/?project=${selectedProjectId}`;
  }
}

// Formatar data
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

// Socket.IO
function setupSocketListeners() {
  if (typeof io === 'undefined') return;
  
  const socket = io();
  
  socket.on('taskUpdated', () => {
    loadProjects().then(() => {
      extractAllTasks();
      renderBoard();
    });
  });
  
  socket.on('projectUpdated', () => {
    loadProjects().then(() => {
      extractAllTasks();
      renderBoard();
    });
  });
}

// Mostrar erro
function showError() {
  document.getElementById('board').innerHTML = `
    <div style="text-align: center; padding: 60px 20px; color: white;">
      <div style="font-size: 64px; margin-bottom: 20px;">😞</div>
      <div style="font-size: 18px;">Erro ao carregar dados</div>
      <button onclick="location.reload()" style="margin-top: 20px; padding: 12px 24px; background: white; color: #667eea; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
        Tentar Novamente
      </button>
    </div>
  `;
}

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
  const modal = document.getElementById('task-modal');
  if (e.target === modal) {
    closeModal();
  }
});

// Iniciar
init();
