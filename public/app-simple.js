// Sistema simplificado que funciona com Supabase
const socket = io();
let state = { 
  projects: [], 
  currentProject: null, 
  tasks: [], 
  stores: [], 
  workStatuses: [],
  integrators: [],
  assemblers: [],
  electricians: []
};
let currentProjectId = null;
let selectedStoreId = 'all'; // Filtro de loja atual
let selectedStatusId = 'all'; // Filtro de status atual
let selectedCategory = 'all'; // Filtro de categoria atual
let showArchived = false; // Mostrar obras arquivadas

// ==================== HELPERS DE OTIMIZAÇÃO ====================

// Debounce: Aguarda pausa para executar
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle: Limita frequência de execução
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Toast notification suave
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 24px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease, slideOut 0.3s ease 2.7s;
    max-width: 300px;
  `;
  
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// CSS para animações de toast (adicionar uma vez)
if (!document.getElementById('toast-animations')) {
  const style = document.createElement('style');
  style.id = 'toast-animations';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// Update otimista: atualiza UI imediatamente, depois sincroniza com servidor
async function optimisticUpdate(updateFn, rollbackFn, apiCall) {
  try {
    // 1. Atualiza UI IMEDIATAMENTE
    updateFn();
    
    // 2. Chama API em background
    const response = await apiCall();
    
    // 3. Se falhar, reverte
    if (!response.ok) {
      rollbackFn();
      const error = await response.json();
      showToast(error.message || 'Erro ao salvar', 'error');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro no update otimista:', error);
    rollbackFn();
    showToast('Erro de conexão', 'error');
    return false;
  }
}

// Update seletivo no DOM - atualizar só uma task
function updateTaskInDOM(taskId, updates) {
  const taskEl = document.querySelector(`.task[data-id="${taskId}"]`);
  if (!taskEl) return;
  
  // Atualizar título se fornecido
  if (updates.title !== undefined) {
    const titleEl = taskEl.querySelector('.task-title');
    if (titleEl) titleEl.textContent = updates.title;
  }
  
  // Atualizar status/coluna se fornecido
  if (updates.status !== undefined) {
    moveTaskInDOM(taskId, updates.status);
  }
}

// Mover task no DOM (visual instantâneo)
function moveTaskInDOM(taskId, newStatus) {
  const taskEl = document.querySelector(`.task[data-id="${taskId}"]`);
  if (!taskEl) return;
  
  const oldColumn = taskEl.closest('.tasks');
  const newColumnId = statusToColumnId(newStatus);
  const newColumn = document.getElementById(newColumnId);
  
  if (!newColumn || !oldColumn) return;
  
  // Adiciona classe de animação
  taskEl.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
  taskEl.style.opacity = '0.5';
  
  // Move após pequeno delay (para animação)
  setTimeout(() => {
    newColumn.appendChild(taskEl);
    taskEl.dataset.status = newStatus;
    taskEl.style.opacity = '1';
    
    // Atualiza botões de navegação
    updateTaskNavButtons(taskEl, newStatus);
  }, 150);
}

// Remover task do DOM
function removeTaskFromDOM(taskId) {
  const taskEl = document.querySelector(`.task[data-id="${taskId}"]`);
  if (!taskEl) return;
  
  // Animação de saída
  taskEl.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
  taskEl.style.transform = 'scale(0.8)';
  taskEl.style.opacity = '0';
  
  setTimeout(() => taskEl.remove(), 200);
}

// Mapear status para ID da coluna
function statusToColumnId(status) {
  const map = {
    'Criado': 'col-criado',
    'Em separação': 'col-em',
    'Pendencia': 'col-pend',
    'Em romaneio': 'col-romaneio',
    'Entregue': 'col-entregue'
  };
  return map[status] || 'col-criado';
}

// Atualizar botões de navegação da task
function updateTaskNavButtons(taskEl, status) {
  const navContainer = taskEl.querySelector('.task-actions');
  if (!navContainer) return;
  
  const taskId = taskEl.dataset.id;
  const task = state.tasks.find(t => t.id === taskId);
  
  // Fluxo correto: Criado → Em separação → Pendencia/Romaneio → Entregue
  const canGoBack = status !== 'Criado';
  const canGoNext = status !== 'Entregue';
  const showPendingBtn = (status === 'Em separação') && task && !task.title.toLowerCase().includes('pendência');
  
  navContainer.innerHTML = `
    ${canGoBack ? `<button class="btn-task-nav btn-prev" onclick="moveTask('${taskId}', 'prev')" title="Voltar">◀</button>` : ''}
    ${showPendingBtn ? `<button class="btn-task-pending" onclick="createPending('${taskId}')" title="Criar Pendência">P</button>` : ''}
    ${canGoNext ? `<button class="btn-task-nav btn-next" onclick="moveTask('${taskId}', 'next')" title="Avançar">▶</button>` : ''}
    <button class="btn-task-delete" onclick="deleteTask('${taskId}')" title="Excluir">×</button>
  `;
}

// Helper para API com autenticação
function api(path, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  return fetch(path, {
    ...opts,
    headers: { ...headers, ...(opts.headers || {}) }
  });
}

// Elementos da UI
const projectSelect = document.getElementById('projectSelect');
const projectsList = document.getElementById('projectsList');
const btnNewProject = document.getElementById('btnNewProjectAside');
const btnAddCriado = document.getElementById('btnAddCriado');
const inputCriado = document.getElementById('input-criado');
const projectDetails = document.getElementById('projectDetails');
const storeFilterAside = document.getElementById('storeFilterAside');
const statusFilterAside = document.getElementById('statusFilterAside');
const categoryFilterAside = document.getElementById('categoryFilterAside');
const showArchivedCheckbox = document.getElementById('showArchivedCheckbox');

// Carregar estado inicial
async function loadState() {
  try {
    const params = new URLSearchParams();
    if (selectedStoreId && selectedStoreId !== 'all') {
      params.append('storeId', selectedStoreId);
    }
    if (selectedStatusId && selectedStatusId !== 'all') {
      params.append('statusId', selectedStatusId);
    }
    if (selectedCategory && selectedCategory !== 'all') {
      params.append('category', selectedCategory);
    }
    if (showArchived) {
      params.append('showArchived', 'true');
    }
    // Enviar o projeto selecionado para o backend
    if (currentProjectId) {
      params.append('currentProjectId', currentProjectId);
    }
    
    const res = await api(`/api/projects/state?${params.toString()}`);
    
    if (!res.ok) {
      console.error('❌ Erro ao carregar estado:', res.status);
      return;
    }
    
    const data = await res.json();
    state = data;
    
    // Manter o currentProjectId se foi definido pelo usuário
    // Se não foi definido, usar o que veio do backend
    if (!currentProjectId && data.currentProject?.id) {
      currentProjectId = data.currentProject.id;
    }
    
    render();
  } catch (error) {
    console.error('Erro ao carregar estado:', error);
  }
}

// Renderizar tudo
function render() {
  renderStoreFilter();
  renderStatusFilter();
  renderProjectsList();
  renderProjectSelect();
  renderTasks();
  renderDetails();
}

// Renderizar filtro de lojas na sidebar
function renderStoreFilter() {
  if (!storeFilterAside) return;
  
  const currentValue = storeFilterAside.value || 'all';
  
  storeFilterAside.innerHTML = '<option value="all">Todas lojas</option>' + 
    (state.stores || []).map(store => `
      <option value="${store.id}">${store.code}</option>
    `).join('');
  
  storeFilterAside.value = currentValue;
}

// Renderizar filtro de status na sidebar
function renderStatusFilter() {
  if (!statusFilterAside) return;
  
  const currentValue = statusFilterAside.value || 'all';
  
  statusFilterAside.innerHTML = '<option value="all">Todos status</option>' + 
    (state.workStatuses || []).map(status => `
      <option value="${status.id}">${status.name}</option>
    `).join('');
  
  statusFilterAside.value = currentValue;
}

// Filtro de loja - listener COM DEBOUNCE (compatível iOS)
if (storeFilterAside) {
  const debouncedFilter = debounce(() => loadState(), 300);
  const handleStoreChange = () => {
    selectedStoreId = storeFilterAside.value;
    debouncedFilter();
  };
  // iOS Safari pode não disparar 'change', então usar 'input' também
  storeFilterAside.addEventListener('change', handleStoreChange);
  storeFilterAside.addEventListener('input', handleStoreChange);
}

// Filtro de status - listener COM DEBOUNCE (compatível iOS)
if (statusFilterAside) {
  const debouncedFilter = debounce(() => loadState(), 300);
  const handleStatusChange = () => {
    selectedStatusId = statusFilterAside.value;
    debouncedFilter();
  };
  // iOS Safari pode não disparar 'change', então usar 'input' também
  statusFilterAside.addEventListener('change', handleStatusChange);
  statusFilterAside.addEventListener('input', handleStatusChange);
}

// Filtro de categoria - listener COM DEBOUNCE (compatível iOS)
if (categoryFilterAside) {
  const debouncedFilter = debounce(() => loadState(), 300);
  const handleCategoryChange = () => {
    selectedCategory = categoryFilterAside.value;
    debouncedFilter();
  };
  // iOS Safari pode não disparar 'change', então usar 'input' também
  categoryFilterAside.addEventListener('change', handleCategoryChange);
  categoryFilterAside.addEventListener('input', handleCategoryChange);
}

// Checkbox mostrar arquivados - listener COM DEBOUNCE
if (showArchivedCheckbox) {
  const debouncedFilter = debounce(() => loadState(), 300);
  showArchivedCheckbox.addEventListener('change', () => {
    showArchived = showArchivedCheckbox.checked;
    debouncedFilter();
  });
}

// Renderizar lista de projetos
function renderProjectsList() {
  if (!projectsList) return;
  
  projectsList.innerHTML = (state.projects || []).map(p => {
    const statusColor = p.work_status?.color || '#34495e';
    const storeName = p.store?.name || 'Sem loja';
    const storeCode = p.store?.code || '-';
    const isArchived = p.archived === true;
    const categoryIcon = p.category === 'reforma' ? '🔧' : '🏗️';
    const categoryText = p.category === 'reforma' ? 'Reforma' : 'Nova';
    
    // Criar options do dropdown de status
    const statusOptions = (state.workStatuses || []).map(s => 
      `<option value="${s.id}" ${s.id === p.work_status_id ? 'selected' : ''}>${s.name}</option>`
    ).join('');
    
    return `
      <div class="project-item ${p.id === currentProjectId ? 'active' : ''} ${isArchived ? 'archived' : ''}" 
           onclick="selectProject('${p.id}')"
           style="border-left: 4px solid ${statusColor}; ${isArchived ? 'opacity: 0.6;' : ''}">
        <div style="font-size: 11px; color: #95a5a6; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center;">
          <span>🏪 ${storeCode} ${isArchived ? '📦' : ''}</span>
          <span style="background: #374151; padding: 2px 6px; border-radius: 3px; font-size: 10px;">${categoryIcon} ${categoryText}</span>
        </div>
        <div style="font-weight: 600; margin-bottom: 6px;">${p.client_name || p.name}</div>
        
        <!-- Dropdown de status -->
        <select 
          class="status-quick-select" 
          data-project-id="${p.id}"
          onchange="event.stopPropagation(); updateProjectStatus('${p.id}', this.value)"
          onclick="event.stopPropagation()"
          style="width: 100%; font-size: 11px; padding: 4px; background: #1e293b; border: 1px solid ${statusColor}; color: ${statusColor}; border-radius: 4px; margin-bottom: 8px;">
          ${statusOptions}
        </select>
        
        <!-- Botões de ação -->
        <div class="project-actions">
          ${isArchived ? 
            `<button class="btn-delete-permanent" onclick="event.stopPropagation(); deletePermanent('${p.id}')" title="Excluir definitivamente">
              🗑️ Excluir
            </button>
            <button class="btn-archive" onclick="event.stopPropagation(); archiveProject('${p.id}')">
              ♻️ Restaurar
            </button>` :
            `<button class="btn-archive" onclick="event.stopPropagation(); archiveProject('${p.id}')">
              🗑️ Arquivar
            </button>`
          }
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Fix para iOS Safari: adicionar evento 'input' aos selects de status
  // iOS pode não disparar 'onchange' corretamente
  setTimeout(() => {
    document.querySelectorAll('.status-quick-select').forEach(select => {
      select.addEventListener('input', (e) => {
        e.stopPropagation();
        const projectId = select.dataset.projectId;
        if (projectId) {
          updateProjectStatus(projectId, select.value);
        }
      });
    });
  }, 0);
}

// Renderizar select de projetos
function renderProjectSelect() {
  if (!projectSelect) return;
  
  projectSelect.innerHTML = (state.projects || []).map(p => `
    <option value="${p.id}" ${p.id === currentProjectId ? 'selected' : ''}>
      ${p.client_name || p.name}
    </option>
  `).join('');
}

// Renderizar tarefas
function renderTasks() {
  // Limpar todas as colunas
  document.querySelectorAll('.tasks').forEach(col => col.innerHTML = '');
  
  // Verificar se há tarefas
  if (!state.tasks || state.tasks.length === 0) {
    return;
  }
  
  // Agrupar tarefas por status
  const tasksByStatus = {
    'Criado': [],
    'Em separação': [],
    'Pendencia': [],
    'Em romaneio': [],
    'Entregue': []
  };
  
  state.tasks.forEach(task => {
    if (tasksByStatus[task.status]) {
      tasksByStatus[task.status].push(task);
    }
  });
  
  // Renderizar em cada coluna
  const colMap = {
    'Criado': 'col-criado',
    'Em separação': 'col-em',
    'Pendencia': 'col-pend',
    'Em romaneio': 'col-romaneio',
    'Entregue': 'col-entregue'
  };
  
  Object.keys(tasksByStatus).forEach(status => {
    const colId = colMap[status];
    const col = document.getElementById(colId);
    if (!col) return;
    
    col.innerHTML = tasksByStatus[status].map(task => {
      // Determinar quais botões mostrar
      const canGoBack = status !== 'Criado';
      const canGoNext = status !== 'Entregue';
      const showPendingBtn = (status === 'Em separação') && !task.title.toLowerCase().includes('pendência');
      
      return `
        <div class="task" draggable="true" data-id="${task.id}" data-status="${task.status}">
          <div class="task-title">${task.title}</div>
          <div class="task-actions">
            ${canGoBack ? `<button class="btn-task-nav btn-prev" onclick="moveTask('${task.id}', 'prev')" title="Voltar">◀</button>` : ''}
            ${showPendingBtn ? `<button class="btn-task-pending" onclick="createPending('${task.id}')" title="Criar Pendência">P</button>` : ''}
            ${canGoNext ? `<button class="btn-task-nav btn-next" onclick="moveTask('${task.id}', 'next')" title="Avançar">▶</button>` : ''}
            <button class="btn-task-delete" onclick="deleteTask('${task.id}')" title="Excluir">×</button>
          </div>
        </div>
      `;
    }).join('');
  });
  
  // Adicionar drag & drop
  setupDragAndDrop();
}

// Renderizar detalhes
function renderDetails() {
  if (!projectDetails) return;
  
  // Se não há projeto selecionado, limpar tudo
  if (!state.currentProject) {
    document.getElementById('detail-client').innerHTML = '<input type="text" disabled placeholder="-" style="width: 100%; background: transparent; border: none; color: #95a5a6;">';
    document.getElementById('detail-store').innerHTML = '<select disabled style="width: 100%; background: transparent; border: none; color: #95a5a6;"><option>-</option></select>';
    document.getElementById('detail-status').innerHTML = '<select disabled style="width: 100%; background: transparent; border: none; color: #95a5a6;"><option>-</option></select>';
    document.getElementById('detail-integrator').innerHTML = '<select disabled style="width: 100%; background: transparent; border: none; color: #95a5a6;"><option>-</option></select>';
    document.getElementById('detail-assembler').innerHTML = '<select disabled style="width: 100%; background: transparent; border: none; color: #95a5a6;"><option>-</option></select>';
    document.getElementById('detail-electrician').innerHTML = '<select disabled style="width: 100%; background: transparent; border: none; color: #95a5a6;"><option>-</option></select>';
    document.getElementById('detail-start-date').innerHTML = '<input type="date" disabled style="width: 100%; background: transparent; border: none; color: #95a5a6;">';
    document.getElementById('detail-delivery').innerHTML = '<input type="date" disabled style="width: 100%; background: transparent; border: none; color: #95a5a6;">';
    document.getElementById('detail-location').innerHTML = '<input type="text" disabled placeholder="-" style="width: 100%; background: transparent; border: none; color: #95a5a6;">';
    projectDetails.value = '';
    return;
  }
  
  const p = state.currentProject;
  
  // Cliente (text input)
  document.getElementById('detail-client').innerHTML = `
    <input 
      type="text" 
      value="${p.client_name || p.name || ''}" 
      onchange="updateProjectField('${p.id}', 'client_name', this.value)"
      style="width: 100%; background: #1e293b; border: 1px solid #34495e; color: #ecf0f1; padding: 6px; border-radius: 4px; font-size: 12px;"
    >
  `;
  
  // Loja (select)
  const storeOptions = (state.stores || []).map(s => 
    `<option value="${s.id}" ${s.id === p.store_id ? 'selected' : ''}>${s.name}</option>`
  ).join('');
  document.getElementById('detail-store').innerHTML = `
    <select 
      class="detail-field-select"
      data-project-id="${p.id}"
      data-field="store_id"
      onchange="updateProjectField('${p.id}', 'store_id', this.value)"
      style="width: 100%; background: #1e293b; border: 1px solid #34495e; color: #ecf0f1; padding: 6px; border-radius: 4px; font-size: 12px;">
      <option value="">Selecione...</option>
      ${storeOptions}
    </select>
  `;
  
  // Status (select)
  const statusOptions = (state.workStatuses || []).map(s => 
    `<option value="${s.id}" ${s.id === p.work_status_id ? 'selected' : ''}>${s.name}</option>`
  ).join('');
  document.getElementById('detail-status').innerHTML = `
    <select 
      class="detail-field-select"
      data-project-id="${p.id}"
      data-field="work_status_id"
      onchange="updateProjectField('${p.id}', 'work_status_id', this.value)"
      style="width: 100%; background: #1e293b; border: 1px solid #34495e; color: #ecf0f1; padding: 6px; border-radius: 4px; font-size: 12px;">
      <option value="">Selecione...</option>
      ${statusOptions}
    </select>
  `;
  
  // Categoria (select)
  document.getElementById('detail-category').innerHTML = `
    <select 
      class="detail-field-select"
      data-project-id="${p.id}"
      data-field="category"
      onchange="updateProjectField('${p.id}', 'category', this.value)"
      style="width: 100%; background: #1e293b; border: 1px solid #34495e; color: #ecf0f1; padding: 6px; border-radius: 4px; font-size: 12px;">
      <option value="nova" ${p.category === 'nova' ? 'selected' : ''}>🏗️ Nova Obra</option>
      <option value="reforma" ${p.category === 'reforma' ? 'selected' : ''}>🔧 Reforma</option>
    </select>
  `;
  
  // Integradora (select)
  const integratorOptions = (state.integrators || []).map(i => 
    `<option value="${i.id}" ${i.id === p.integrator_id ? 'selected' : ''}>${i.name}</option>`
  ).join('');
  document.getElementById('detail-integrator').innerHTML = `
    <select 
      class="detail-field-select"
      data-project-id="${p.id}"
      data-field="integrator_id"
      onchange="updateProjectField('${p.id}', 'integrator_id', this.value)"
      style="width: 100%; background: #1e293b; border: 1px solid #34495e; color: #ecf0f1; padding: 6px; border-radius: 4px; font-size: 12px;">
      <option value="">Selecione...</option>
      ${integratorOptions}
    </select>
  `;
  
  // Montador (select)
  const assemblerOptions = (state.assemblers || []).map(a => 
    `<option value="${a.id}" ${a.id === p.assembler_id ? 'selected' : ''}>${a.name}</option>`
  ).join('');
  document.getElementById('detail-assembler').innerHTML = `
    <select 
      class="detail-field-select"
      data-project-id="${p.id}"
      data-field="assembler_id"
      onchange="updateProjectField('${p.id}', 'assembler_id', this.value)"
      style="width: 100%; background: #1e293b; border: 1px solid #34495e; color: #ecf0f1; padding: 6px; border-radius: 4px; font-size: 12px;">
      <option value="">Selecione...</option>
      ${assemblerOptions}
    </select>
  `;
  
  // Eletricista (select)
  const electricianOptions = (state.electricians || []).map(e => 
    `<option value="${e.id}" ${e.id === p.electrician_id ? 'selected' : ''}>${e.name}</option>`
  ).join('');
  document.getElementById('detail-electrician').innerHTML = `
    <select 
      class="detail-field-select"
      data-project-id="${p.id}"
      data-field="electrician_id"
      onchange="updateProjectField('${p.id}', 'electrician_id', this.value)"
      style="width: 100%; background: #1e293b; border: 1px solid #34495e; color: #ecf0f1; padding: 6px; border-radius: 4px; font-size: 12px;">
      <option value="">Selecione...</option>
      ${electricianOptions}
    </select>
  `;
  
  // Data Início (date input)
  document.getElementById('detail-start-date').innerHTML = `
    <input 
      type="date" 
      value="${p.start_date || ''}" 
      onchange="updateProjectField('${p.id}', 'start_date', this.value)"
      style="width: 100%; background: #1e293b; border: 1px solid #34495e; color: #ecf0f1; padding: 6px; border-radius: 4px; font-size: 12px;"
    >
  `;
  
  // Previsão Entrega (date input)
  document.getElementById('detail-delivery').innerHTML = `
    <input 
      type="date" 
      value="${p.delivery_forecast || ''}" 
      onchange="updateProjectField('${p.id}', 'delivery_forecast', this.value)"
      style="width: 100%; background: #1e293b; border: 1px solid #34495e; color: #ecf0f1; padding: 6px; border-radius: 4px; font-size: 12px;"
    >
  `;
  
  // Localização (text input)
  document.getElementById('detail-location').innerHTML = `
    <input 
      type="text" 
      value="${p.location_address || ''}" 
      onchange="updateProjectField('${p.id}', 'location_address', this.value)"
      style="width: 100%; background: #1e293b; border: 1px solid #34495e; color: #ecf0f1; padding: 6px; border-radius: 4px; font-size: 12px;"
    >
  `;
  
  // Campos GSI
  renderGsiFields(p);
  
  // Observações (editável)
  projectDetails.value = p.details_text || '';
  
  // Fix para iOS Safari: adicionar evento 'input' aos selects de detalhes
  // iOS pode não disparar 'onchange' corretamente
  setTimeout(() => {
    document.querySelectorAll('.detail-field-select').forEach(select => {
      select.addEventListener('input', (e) => {
        const projectId = select.dataset.projectId;
        const field = select.dataset.field;
        if (projectId && field) {
          updateProjectField(projectId, field, select.value);
        }
      });
    });
  }, 0);
}

// Helper para formatar datas
function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

// Selecionar projeto (versão otimizada - sem recarregar toda a lista)
window.selectProject = async function(projectId) {
  if (currentProjectId === projectId) return; // Já está selecionado
  
  const previousProjectId = currentProjectId;
  currentProjectId = projectId;
  
  // Atualizar visualmente qual card está ativo
  document.querySelectorAll('.project-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const selectedCard = document.querySelector(`.project-item[onclick*="${projectId}"]`);
  if (selectedCard) {
    selectedCard.classList.add('active');
  }
  
  // Carregar apenas os detalhes do projeto selecionado
  try {
    const res = await api(`/api/projects/${projectId}/details`);
    if (res.ok) {
      const projectData = await res.json();
      state.currentProject = projectData.project;
      state.tasks = projectData.tasks;
      
      // Renderizar apenas detalhes e tarefas
      renderDetails();
      renderTasks();
    }
  } catch (error) {
    console.error('Erro ao carregar projeto:', error);
    // Em caso de erro, reverter
    currentProjectId = previousProjectId;
  }
};

// ==================== MODAL DE NOVA OBRA ====================

window.openProjectModal = function() {
  const modal = document.getElementById('project-modal');
  
  // Preencher dropdowns de lojas e status
  const storeSelect = document.getElementById('project-store');
  if (storeSelect) {
    storeSelect.innerHTML = '<option value="">Selecione...</option>' +
      (state.stores || []).map(s => `<option value="${s.id}">${s.name} (${s.code})</option>`).join('');
  }
  
  const statusSelect = document.getElementById('project-status');
  if (statusSelect) {
    statusSelect.innerHTML = '<option value="">Selecione...</option>' +
      (state.workStatuses || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  }
  
  // Preencher dropdowns de integradoras, montadores e eletricistas
  const integratorSelect = document.getElementById('project-integrator');
  if (integratorSelect) {
    integratorSelect.innerHTML = '<option value="">Selecione...</option>' +
      '<option value="__new__">➕ Criar nova integradora...</option>' +
      (state.integrators || []).map(i => `<option value="${i.id}">${i.name}</option>`).join('');
  }
  
  const assemblerSelect = document.getElementById('project-assembler');
  if (assemblerSelect) {
    assemblerSelect.innerHTML = '<option value="">Selecione...</option>' +
      '<option value="__new__">➕ Criar novo montador...</option>' +
      (state.assemblers || []).map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  }
  
  const electricianSelect = document.getElementById('project-electrician');
  if (electricianSelect) {
    electricianSelect.innerHTML = '<option value="">Selecione...</option>' +
      '<option value="__new__">➕ Criar novo eletricista...</option>' +
      (state.electricians || []).map(e => `<option value="${e.id}">${e.name}</option>`).join('');
  }
  
  modal.classList.add('active');
};

// Função para mostrar/esconder campo de texto ao selecionar "Criar novo"
window.handleNewOption = function(type) {
  const select = document.getElementById(`project-${type}`);
  const input = document.getElementById(`new-${type}`);
  
  if (select.value === '__new__') {
    input.style.display = 'block';
    input.required = true;
    input.focus();
  } else {
    input.style.display = 'none';
    input.required = false;
    input.value = '';
  }
};

window.closeProjectModal = function() {
  document.getElementById('project-modal').classList.remove('active');
  document.getElementById('project-form').reset();
};

// Botão nova obra
if (btnNewProject) {
  btnNewProject.addEventListener('click', openProjectModal);
}

// Submit do formulário
document.getElementById('project-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const clientName = document.getElementById('project-client').value;
  const storeId = document.getElementById('project-store').value;
  const workStatusId = document.getElementById('project-status').value;
  const category = document.getElementById('project-category').value;
  let integratorId = document.getElementById('project-integrator').value || null;
  let assemblerId = document.getElementById('project-assembler').value || null;
  let electricianId = document.getElementById('project-electrician').value || null;
  const startDate = document.getElementById('project-start-date').value;
  const deliveryForecast = document.getElementById('project-delivery').value;
  const locationAddress = document.getElementById('project-location').value;
  const gsiForecastDate = document.getElementById('project-gsi-forecast').value;
  
  try {
    // Criar integradora se selecionou "Criar novo"
    if (integratorId === '__new__') {
      const newName = document.getElementById('new-integrator').value.trim();
      if (!newName) {
        alert('Digite o nome da nova integradora');
        return;
      }
      
      const res = await api('/api/settings/integrators', {
        method: 'POST',
        body: JSON.stringify({ name: newName })
      });
      
      if (res.ok) {
        const newIntegrator = await res.json();
        integratorId = newIntegrator.id;
      } else {
        const error = await res.json();
        alert(error.message || 'Erro ao criar integradora');
        return;
      }
    }
    
    // Criar montador se selecionou "Criar novo"
    if (assemblerId === '__new__') {
      const newName = document.getElementById('new-assembler').value.trim();
      if (!newName) {
        alert('Digite o nome do novo montador');
        return;
      }
      
      const res = await api('/api/settings/assemblers', {
        method: 'POST',
        body: JSON.stringify({ name: newName })
      });
      
      if (res.ok) {
        const newAssembler = await res.json();
        assemblerId = newAssembler.id;
      } else {
        const error = await res.json();
        alert(error.message || 'Erro ao criar montador');
        return;
      }
    }
    
    // Criar eletricista se selecionou "Criar novo"
    if (electricianId === '__new__') {
      const newName = document.getElementById('new-electrician').value.trim();
      if (!newName) {
        alert('Digite o nome do novo eletricista');
        return;
      }
      
      const res = await api('/api/settings/electricians', {
        method: 'POST',
        body: JSON.stringify({ name: newName })
      });
      
      if (res.ok) {
        const newElectrician = await res.json();
        electricianId = newElectrician.id;
      } else {
        const error = await res.json();
        alert(error.message || 'Erro ao criar eletricista');
        return;
      }
    }
    
    // Criar projeto
    const projectData = {
      name: clientName, // Usando clientName como name também
      clientName,
      storeId,
      workStatusId,
      category,
      integratorId,
      assemblerId,
      electricianId,
      startDate: startDate || null,
      deliveryForecast: deliveryForecast || null,
      locationAddress: locationAddress || null,
      gsiForecastDate: gsiForecastDate || null
    };
    
    const res = await api('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
    
    if (res.ok) {
      closeProjectModal();
      await loadState();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao criar obra');
    }
  } catch (error) {
    console.error('Erro ao criar obra:', error);
    alert('Erro ao criar obra');
  }
});

// ==================== FIM MODAL ====================

// Adicionar tarefa
if (btnAddCriado && inputCriado) {
  const addTask = async () => {
    const title = inputCriado.value.trim();
    if (!title || !currentProjectId) return;
    
    try {
      const res = await api('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          status: 'backlog',
          projectId: currentProjectId
        })
      });
      
      if (res.ok) {
        inputCriado.value = '';
        await loadState();
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    }
  };
  
  btnAddCriado.addEventListener('click', addTask);
  inputCriado.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });
}

// Deletar tarefa - OTIMIZADO
window.deleteTask = async function(taskId) {
  if (!confirm('Excluir esta tarefa?')) return;
  
  // Salvar task para possível rollback
  const taskIndex = state.tasks.findIndex(t => t.id === taskId);
  const taskBackup = taskIndex >= 0 ? {...state.tasks[taskIndex]} : null;
  
  // UPDATE OTIMISTA: Remove visualmente AGORA
  const updateUI = () => {
    if (taskIndex >= 0) {
      state.tasks.splice(taskIndex, 1);
    }
    removeTaskFromDOM(taskId);
  };
  
  // Rollback se falhar
  const rollback = () => {
    if (taskBackup && taskIndex >= 0) {
      state.tasks.splice(taskIndex, 0, taskBackup);
      loadState(); // Recarrega para restaurar
    }
  };
  
  // API em background
  const apiCall = () => api(`/api/tasks/${taskId}`, { method: 'DELETE' });
  
  const success = await optimisticUpdate(updateUI, rollback, apiCall);
  
  if (success) {
    showToast('✓ Tarefa excluída', 'success');
  }
};

// Drag and Drop - OTIMIZADO
function setupDragAndDrop() {
  const tasks = document.querySelectorAll('.task');
  const columns = document.querySelectorAll('.tasks');
  
  tasks.forEach(task => {
    task.addEventListener('dragstart', (e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', task.dataset.id);
      task.classList.add('dragging');
      task.style.opacity = '0.5';
    });
    
    task.addEventListener('dragend', () => {
      task.classList.remove('dragging');
      task.style.opacity = '1';
    });
  });
  
  columns.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      // Visual feedback: adiciona classe hover
      col.classList.add('drag-over');
    });
    
    col.addEventListener('dragleave', (e) => {
      col.classList.remove('drag-over');
    });
    
    col.addEventListener('drop', async (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      
      const taskId = e.dataTransfer.getData('text/plain');
      const newStatus = getStatusFromColumn(col.id);
      
      if (!newStatus) return;
      
      // Encontrar task
      const task = state.tasks.find(t => t.id === taskId);
      if (!task || task.status === newStatus) return;
      
      const oldStatus = task.status;
      
      // UPDATE OTIMISTA: Move visualmente AGORA (já está movido pelo drag)
      const updateUI = () => {
        task.status = newStatus;
        const taskEl = document.querySelector(`.task[data-id="${taskId}"]`);
        if (taskEl) {
          taskEl.dataset.status = newStatus;
          updateTaskNavButtons(taskEl, newStatus);
          
          // Animação suave
          taskEl.style.transition = 'all 0.2s ease';
          taskEl.style.transform = 'scale(1.02)';
          setTimeout(() => {
            taskEl.style.transform = 'scale(1)';
          }, 200);
        }
      };
      
      // Rollback se API falhar
      const rollback = () => {
        task.status = oldStatus;
        moveTaskInDOM(taskId, oldStatus);
      };
      
      // API em background (NÃO BLOQUEIA)
      const apiCall = () => api(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      
      // Executa update otimista
      optimisticUpdate(updateUI, rollback, apiCall);
    });
  });
}

// Mapear coluna para status
function getStatusFromColumn(colId) {
  const map = {
    'col-criado': 'Criado',
    'col-em': 'Em separação',
    'col-pend': 'Pendencia',
    'col-romaneio': 'Em romaneio',
    'col-entregue': 'Entregue'
  };
  return map[colId];
}

// Socket events
socket.on('connect', () => {
  console.log('Socket conectado');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user.organizationId) {
    socket.emit('joinOrganization', user.organizationId);
  }
});

socket.on('taskCreated', () => loadState());
socket.on('taskUpdated', () => loadState());
socket.on('taskDeleted', () => loadState());
socket.on('projectCreated', () => loadState());

// Salvar detalhes do projeto - OTIMIZADO COM DEBOUNCE
if (projectDetails) {
  const saveDetails = debounce(async () => {
    if (!currentProjectId) return;
    
    try {
      const res = await api(`/api/projects/${currentProjectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          details_text: projectDetails.value 
        })
      });
      
      if (res.ok) {
        // Feedback visual discreto
        projectDetails.style.borderColor = '#10b981';
        setTimeout(() => {
          projectDetails.style.borderColor = '';
        }, 500);
      }
    } catch (error) {
      console.error('Erro ao salvar detalhes:', error);
      showToast('Erro ao salvar observações', 'error');
    }
  }, 800); // Aguarda 800ms de pausa antes de salvar
  
  projectDetails.addEventListener('input', saveDetails);
}

// Inicializar
loadState();

// ==================== EDITAR E ARQUIVAR OBRA ====================

window.editProject = function(projectId) {
  const project = (state.projects || []).find(p => p.id === projectId);
  if (!project) {
    alert('Obra não encontrada');
    return;
  }
  
  const modal = document.getElementById('edit-project-modal');
  
  // Preencher campos
  document.getElementById('edit-project-id').value = project.id;
  document.getElementById('edit-project-client').value = project.client_name || project.name || '';
  document.getElementById('edit-project-start-date').value = project.start_date || '';
  document.getElementById('edit-project-delivery').value = project.delivery_forecast || '';
  document.getElementById('edit-project-location').value = project.location_address || '';
  document.getElementById('edit-project-gsi-forecast').value = project.gsi_forecast_date || '';
  
  // Popular dropdowns
  const storeSelect = document.getElementById('edit-project-store');
  const statusSelect = document.getElementById('edit-project-status');
  const integratorSelect = document.getElementById('edit-project-integrator');
  const assemblerSelect = document.getElementById('edit-project-assembler');
  const electricianSelect = document.getElementById('edit-project-electrician');
  
  // Lojas
  storeSelect.innerHTML = '<option value="">Selecione...</option>' + 
    (state.stores || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  storeSelect.value = project.store_id || '';
  
  // Status
  statusSelect.innerHTML = '<option value="">Selecione...</option>' + 
    (state.workStatuses || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  statusSelect.value = project.work_status_id || '';
  
  // Integradoras
  integratorSelect.innerHTML = '<option value="">Selecione...</option>' + 
    '<option value="__new__">➕ Criar nova integradora...</option>' +
    (state.integrators || []).map(i => `<option value="${i.id}">${i.name}</option>`).join('');
  integratorSelect.value = project.integrator_id || '';
  
  // Montadores
  assemblerSelect.innerHTML = '<option value="">Selecione...</option>' + 
    '<option value="__new__">➕ Criar novo montador...</option>' +
    (state.assemblers || []).map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  assemblerSelect.value = project.assembler_id || '';
  
  // Eletricistas
  electricianSelect.innerHTML = '<option value="">Selecione...</option>' + 
    '<option value="__new__">➕ Criar novo eletricista...</option>' +
    (state.electricians || []).map(e => `<option value="${e.id}">${e.name}</option>`).join('');
  electricianSelect.value = project.electrician_id || '';
  
  modal.classList.add('active');
};

window.closeEditProjectModal = function() {
  const modal = document.getElementById('edit-project-modal');
  modal.classList.remove('active');
  document.getElementById('edit-project-form').reset();
  
  // Esconder campos de texto "novo"
  document.getElementById('edit-new-integrator').style.display = 'none';
  document.getElementById('edit-new-assembler').style.display = 'none';
  document.getElementById('edit-new-electrician').style.display = 'none';
};

// Atualizar handleNewOption para suportar modal de edição
window.handleNewOption = function(type, mode = 'create') {
  const prefix = mode === 'edit' ? 'edit-' : '';
  const selectId = `${prefix}project-${type}`;
  const inputId = `${prefix}new-${type}`;
  
  const select = document.getElementById(selectId);
  const input = document.getElementById(inputId);
  
  if (!select || !input) return;
  
  if (select.value === '__new__') {
    input.style.display = 'block';
    input.required = true;
  } else {
    input.style.display = 'none';
    input.required = false;
    input.value = '';
  }
};

// Submit do formulário de edição
document.getElementById('edit-project-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const projectId = document.getElementById('edit-project-id').value;
  const clientName = document.getElementById('edit-project-client').value;
  const storeId = document.getElementById('edit-project-store').value;
  const workStatusId = document.getElementById('edit-project-status').value;
  let integratorId = document.getElementById('edit-project-integrator').value || null;
  let assemblerId = document.getElementById('edit-project-assembler').value || null;
  let electricianId = document.getElementById('edit-project-electrician').value || null;
  const startDate = document.getElementById('edit-project-start-date').value;
  const deliveryForecast = document.getElementById('edit-project-delivery').value;
  const locationAddress = document.getElementById('edit-project-location').value;
  const gsiForecastDate = document.getElementById('edit-project-gsi-forecast').value;
  
  try {
    // Criar integradora se selecionou "Criar novo"
    if (integratorId === '__new__') {
      const newName = document.getElementById('edit-new-integrator').value.trim();
      if (!newName) {
        alert('Digite o nome da nova integradora');
        return;
      }
      
      const res = await api('/api/settings/integrators', {
        method: 'POST',
        body: JSON.stringify({ name: newName })
      });
      
      if (res.ok) {
        const newIntegrator = await res.json();
        integratorId = newIntegrator.id;
      } else {
        const error = await res.json();
        alert(error.message || 'Erro ao criar integradora');
        return;
      }
    }
    
    // Criar montador se selecionou "Criar novo"
    if (assemblerId === '__new__') {
      const newName = document.getElementById('edit-new-assembler').value.trim();
      if (!newName) {
        alert('Digite o nome do novo montador');
        return;
      }
      
      const res = await api('/api/settings/assemblers', {
        method: 'POST',
        body: JSON.stringify({ name: newName })
      });
      
      if (res.ok) {
        const newAssembler = await res.json();
        assemblerId = newAssembler.id;
      } else {
        const error = await res.json();
        alert(error.message || 'Erro ao criar montador');
        return;
      }
    }
    
    // Criar eletricista se selecionou "Criar novo"
    if (electricianId === '__new__') {
      const newName = document.getElementById('edit-new-electrician').value.trim();
      if (!newName) {
        alert('Digite o nome do novo eletricista');
        return;
      }
      
      const res = await api('/api/settings/electricians', {
        method: 'POST',
        body: JSON.stringify({ name: newName })
      });
      
      if (res.ok) {
        const newElectrician = await res.json();
        electricianId = newElectrician.id;
      } else {
        const error = await res.json();
        alert(error.message || 'Erro ao criar eletricista');
        return;
      }
    }
    
    // Atualizar projeto
    const projectData = {
      name: clientName,
      clientName,
      storeId,
      workStatusId,
      integratorId,
      assemblerId,
      electricianId,
      startDate: startDate || null,
      deliveryForecast: deliveryForecast || null,
      locationAddress: locationAddress || null,
      gsiForecastDate: gsiForecastDate || null
    };
    
    const res = await api(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
    
    if (res.ok) {
      closeEditProjectModal();
      await loadState();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao atualizar obra');
    }
  } catch (error) {
    console.error('Erro ao atualizar obra:', error);
    alert('Erro ao atualizar obra');
  }
});

window.archiveProject = async function(projectId) {
  const project = (state.projects || []).find(p => p.id === projectId);
  if (!project) {
    alert('Obra não encontrada');
    return;
  }
  
  const isArchived = project.archived === true;
  const action = isArchived ? 'restaurar' : 'arquivar';
  const message = isArchived 
    ? `Deseja restaurar a obra "${project.client_name || project.name}"?` 
    : `Deseja arquivar a obra "${project.client_name || project.name}"?\n\nA obra será mantida para consultas futuras.`;
  
  const confirmed = confirm(message);
  if (!confirmed) return;
  
  try {
    const res = await api(`/api/projects/${projectId}/archive`, {
      method: 'PATCH',
      body: JSON.stringify({ archived: !isArchived })
    });
    
    if (res.ok) {
      await loadState();
      alert(`Obra ${isArchived ? 'restaurada' : 'arquivada'} com sucesso!`);
    } else {
      const error = await res.json();
      alert(error.message || `Erro ao ${action} obra`);
    }
  } catch (error) {
    console.error(`Erro ao ${action} obra:`, error);
    alert(`Erro ao ${action} obra`);
  }
};

// Atualizar status da obra rapidamente
window.updateProjectStatus = async function(projectId, newStatusId) {
  try {
    const res = await api(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ work_status_id: newStatusId })
    });
    
    if (res.ok) {
      await loadState();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao atualizar status');
      await loadState(); // Recarregar para reverter o select
    }
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    alert('Erro ao atualizar status');
    await loadState(); // Recarregar para reverter o select
  }
};

// Atualizar campo individual do painel de detalhes
window.updateProjectField = async function(projectId, fieldName, fieldValue) {
  try {
    // Enviar direto com o nome do campo em snake_case (formato do banco)
    const res = await api(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ [fieldName]: fieldValue || null })
    });
    
    if (res.ok) {
      await loadState();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao atualizar campo');
      await loadState();
    }
  } catch (error) {
    console.error('Erro ao atualizar campo:', error);
    alert('Erro ao atualizar campo');
    await loadState();
  }
};

// Mover tarefa para próxima/anterior coluna
window.moveTask = async function(taskId, direction) {
  // Encontrar task no state
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  const oldStatus = task.status;
  
  // Fluxo correto: Criado → Em separação → Pendencia/Romaneio → Entregue
  const statusFlow = {
    'Criado': { next: 'Em separação', prev: null },
    'Em separação': { next: 'Em romaneio', prev: 'Criado' },
    'Pendencia': { next: 'Em romaneio', prev: 'Em separação' },
    'Em romaneio': { next: 'Entregue', prev: 'Em separação' },
    'Entregue': { next: null, prev: 'Em romaneio' }
  };
  
  const newStatus = statusFlow[oldStatus]?.[direction];
  if (!newStatus) return;
  
  // UPDATE OTIMISTA: Move visualmente AGORA
  const updateUI = () => {
    task.status = newStatus;
    moveTaskInDOM(taskId, newStatus);
  };
  
  // Rollback se falhar
  const rollback = () => {
    task.status = oldStatus;
    moveTaskInDOM(taskId, oldStatus);
  };
  
  // API em background
  const apiCall = () => api(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus })
  });
  
  const success = await optimisticUpdate(updateUI, rollback, apiCall);
  
  if (success) {
    showToast('✓ Tarefa movida', 'success');
  }
};

// Criar pendência (desdobramento)
window.createPending = async function(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;
  
  const oldStatus = task.status;
  
  // UPDATE OTIMISTA: Move original para Romaneio e cria cópia em Pendencia
  const updateUI = () => {
    // Mover original para Romaneio
    task.status = 'Em romaneio';
    moveTaskInDOM(taskId, 'Em romaneio');
    
    // Criar cópia visual em Pendencia (temporário)
    const pendenciaCol = document.getElementById('col-pend');
    if (pendenciaCol) {
      const tempId = 'temp-' + Date.now();
      const pendenciaHTML = `
        <div class="task task-new updating" draggable="true" data-id="${tempId}" data-status="Pendencia">
          <div class="task-title">${task.title} — Pendência</div>
          <div class="task-actions">
            <button class="btn-task-nav btn-prev" onclick="moveTask('${tempId}', 'prev')" title="Voltar">◀</button>
            <button class="btn-task-nav btn-next" onclick="moveTask('${tempId}', 'next')" title="Avançar">▶</button>
            <button class="btn-task-delete" onclick="deleteTask('${tempId}')" title="Excluir">×</button>
          </div>
        </div>
      `;
      pendenciaCol.insertAdjacentHTML('beforeend', pendenciaHTML);
    }
  };
  
  // Rollback se falhar
  const rollback = () => {
    task.status = oldStatus;
    moveTaskInDOM(taskId, oldStatus);
    
    // Remover cópia temporária
    const tempPending = document.querySelector('.task.updating');
    if (tempPending) tempPending.remove();
  };
  
  // API em background
  const apiCall = async () => {
    const res = await api(`/api/tasks/${taskId}/create-pending`, {
      method: 'POST'
    });
    
    if (res.ok) {
      // Recarregar state para pegar ID real da pendência
      setTimeout(() => loadState(), 500);
    }
    
    return res;
  };
  
  await optimisticUpdate(updateUI, rollback, apiCall);
};

// Excluir obra definitivamente
window.deletePermanent = async function(projectId) {
  if (!confirm('⚠️ ATENÇÃO!\n\nEsta ação NÃO pode ser desfeita.\nA obra e todas as suas tarefas serão excluídas permanentemente do banco de dados.\n\nTem certeza?')) {
    return;
  }
  
  try {
    const res = await api(`/api/projects/${projectId}/permanent`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      await loadState();
      alert('Obra excluída definitivamente!');
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao excluir obra');
    }
  } catch (error) {
    console.error('Erro ao excluir obra:', error);
    alert('Erro ao excluir obra');
  }
};

// ==================== FUNÇÕES GSI ====================

// Renderizar campos GSI
function renderGsiFields(project) {
  const forecastEl = document.getElementById('detail-gsi-forecast');
  const actualEl = document.getElementById('detail-gsi-actual');
  const btnValidate = document.getElementById('btn-validate-gsi');
  
  if (!forecastEl || !actualEl || !btnValidate) return;
  
  // Campo de data prevista com máscara
  forecastEl.innerHTML = `
    <input 
      type="date" 
      value="${project.gsi_forecast_date || ''}" 
      onchange="updateGsiForecastDate('${project.id}', this.value)"
      style="width: 100%; background: #1e293b; border: 1px solid #34495e; color: #ecf0f1; padding: 4px; border-radius: 4px; font-size: 10px;"
      placeholder="dd/mm/aaaa"
    >
  `;
  
  // Campo de data efetiva e botão
  if (project.gsi_actual_date) {
    // Se já tem data efetiva, mostrar apenas a data
    actualEl.textContent = formatDateBR(project.gsi_actual_date);
    btnValidate.style.display = 'none';
  } else {
    // Se não tem data efetiva, deixar vazio e mostrar apenas o botão
    actualEl.textContent = '-';
    actualEl.style.color = '#94a3b8';
    btnValidate.style.display = project.gsi_forecast_date ? 'block' : 'none';
    btnValidate.onclick = () => validateGsiDelivery(project.id);
  }
}

// Atualizar data prevista GSI
window.updateGsiForecastDate = async function(projectId, date) {
  try {
    const res = await api(`/api/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify({ gsi_forecast_date: date || null })
    });
    
    if (res.ok) {
      await loadState();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao atualizar data GSI');
      await loadState();
    }
  } catch (error) {
    console.error('Erro ao atualizar data GSI:', error);
    alert('Erro ao atualizar data GSI');
    await loadState();
  }
};

// Validar entrega GSI (marcar data efetiva)
window.validateGsiDelivery = async function(projectId) {
  if (!confirm('Confirmar chegada da entrega GSI?\n\nA data efetiva será marcada como hoje.')) {
    return;
  }
  
  try {
    const res = await api(`/api/projects/${projectId}/validate-gsi`, {
      method: 'POST'
    });
    
    if (res.ok) {
      const response = await res.json();
      await loadState();
      alert(`✅ ${response.message}\nData efetiva: ${formatDateBR(response.actualDate)}`);
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao validar entrega GSI');
    }
  } catch (error) {
    console.error('Erro ao validar entrega GSI:', error);
    alert('Erro ao validar entrega GSI');
  }
};

// Formatar data para exibição (DD/MM/AAAA)
function formatDateBR(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    return dateString;
  }
}

// Logout do sistema
window.logout = async function() {
  if (!confirm('Deseja realmente sair do sistema?')) {
    return;
  }
  
  try {
    // Registrar logout no log de auditoria
    await api('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Erro ao registrar logout:', error);
  } finally {
    // Sempre fazer logout localmente
    Auth.logout();
  }
};
