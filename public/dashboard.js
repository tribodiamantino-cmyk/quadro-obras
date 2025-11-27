// Dashboard Público - Quadro de Obras
// Versão simplificada para visualização mobile

let allProjects = [];
let allStores = [];
let allIntegrators = [];
let currentFilter = 'all';
let selectedStore = 'all';
let selectedIntegrator = 'all';
let startDateFrom = '';
let startDateTo = '';
let endDateFrom = '';
let endDateTo = '';
let socket = null;

// Elementos do DOM
const projectsGrid = document.getElementById('projectsGrid');
const totalProjectsEl = document.getElementById('totalProjects');
const activeProjectsEl = document.getElementById('activeProjects');
const completedProjectsEl = document.getElementById('completedProjects');
const archivedProjectsEl = document.getElementById('archivedProjects');
const storeFilter = document.getElementById('storeFilter');
const integratorFilter = document.getElementById('integratorFilter');
const startDateFromInput = document.getElementById('startDateFrom');
const startDateToInput = document.getElementById('startDateTo');
const endDateFromInput = document.getElementById('endDateFrom');
const endDateToInput = document.getElementById('endDateTo');

// Inicializar
async function init() {
  try {
    await loadProjects();
    setupFilters();
    setupAdvancedFilters();
    setupSocket();
  } catch (error) {
    console.error('Erro ao inicializar:', error);
    showError();
  }
}

// Carregar projetos da API
async function loadProjects() {
  try {
    const response = await fetch('/api/dashboard');
    if (!response.ok) throw new Error('Erro ao carregar dados');
    
    const data = await response.json();
    allProjects = data.projects || [];
    allStores = data.stores || [];
    allIntegrators = data.integrators || [];
    
    populateStoresDropdown();
    populateIntegratorsDropdown();
    updateStats();
    renderProjects();
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    showError();
  }
}

// Preencher dropdown de lojas
function populateStoresDropdown() {
  if (!storeFilter || allStores.length === 0) return;
  
  const options = allStores.map(store => 
    `<option value="${store.id}">${store.code} - ${store.name}</option>`
  ).join('');
  
  storeFilter.innerHTML = `<option value="all">Todas as lojas</option>${options}`;
}

// Preencher dropdown de integradoras
function populateIntegratorsDropdown() {
  if (!integratorFilter || allIntegrators.length === 0) return;
  
  const options = allIntegrators.map(integrator => 
    `<option value="${integrator.id}">${integrator.name}</option>`
  ).join('');
  
  integratorFilter.innerHTML = `<option value="all">Todas as integradoras</option>${options}`;
}

// Atualizar estatísticas
function updateStats() {
  const total = allProjects.length;
  const active = allProjects.filter(p => !p.archived).length;
  const archived = allProjects.filter(p => p.archived).length;
  const completed = allProjects.filter(p => 
    p.work_status?.name?.toLowerCase().includes('entregue') || 
    p.work_status?.name?.toLowerCase().includes('concluído')
  ).length;

  totalProjectsEl.textContent = total;
  activeProjectsEl.textContent = active;
  completedProjectsEl.textContent = completed;
  archivedProjectsEl.textContent = archived;
}

// Renderizar projetos
function renderProjects() {
  const filteredProjects = filterProjects();
  
  if (filteredProjects.length === 0) {
    projectsGrid.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <div class="text">Nenhuma obra encontrada</div>
      </div>
    `;
    return;
  }

  projectsGrid.innerHTML = filteredProjects.map(project => {
    const statusColor = project.work_status?.color || '#64748b';
    const statusName = project.work_status?.name || 'Sem status';
    const storeCode = project.store?.code || '-';
    const storeName = project.store?.name || 'Sem loja';
    const categoryIcon = project.category === 'reforma' ? '🔧' : '🏗️';
    const categoryText = project.category === 'reforma' ? 'Reforma' : 'Nova';
    const isArchived = project.archived === true;
    
    return `
      <div class="project-card" style="border-color: ${statusColor}">
        <div class="project-header">
          <div>
            <div class="project-name">${project.client_name || project.name}</div>
            <div class="project-code">
              🏪 ${storeCode} ${storeName}
            </div>
          </div>
          <div class="category-badge">
            ${categoryIcon} ${categoryText}
          </div>
        </div>
        
        <div class="status-badge" style="background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40;">
          <span class="status-dot" style="background: ${statusColor}"></span>
          ${statusName}
        </div>
        
        ${isArchived ? '<div class="archived-badge">📦 Arquivada</div>' : ''}
      </div>
    `;
  }).join('');
}

// Filtrar projetos
function filterProjects() {
  return allProjects.filter(project => {
    // Filtro rápido (botões)
    let passQuickFilter = true;
    switch (currentFilter) {
      case 'active':
        passQuickFilter = !project.archived;
        break;
      case 'archived':
        passQuickFilter = project.archived;
        break;
      case 'reforma':
        passQuickFilter = project.category === 'reforma';
        break;
      case 'nova':
        passQuickFilter = project.category === 'nova';
        break;
      default:
        passQuickFilter = true;
    }
    
    if (!passQuickFilter) return false;
    
    // Filtro por loja
    if (selectedStore !== 'all' && project.store_id !== selectedStore) {
      return false;
    }
    
    // Filtro por integradora
    if (selectedIntegrator !== 'all' && project.integrator_id !== selectedIntegrator) {
      return false;
    }
    
    // Filtro por data de início (De)
    if (startDateFrom && project.forecast_start) {
      if (new Date(project.forecast_start) < new Date(startDateFrom)) {
        return false;
      }
    }
    
    // Filtro por data de início (Até)
    if (startDateTo && project.forecast_start) {
      if (new Date(project.forecast_start) > new Date(startDateTo)) {
        return false;
      }
    }
    
    // Filtro por data de fim (De)
    if (endDateFrom && project.forecast_end) {
      if (new Date(project.forecast_end) < new Date(endDateFrom)) {
        return false;
      }
    }
    
    // Filtro por data de fim (Até)
    if (endDateTo && project.forecast_end) {
      if (new Date(project.forecast_end) > new Date(endDateTo)) {
        return false;
      }
    }
    
    return true;
  });
}

// Configurar filtros
function setupFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remover active de todos
      filterButtons.forEach(b => b.classList.remove('active'));
      
      // Adicionar active no clicado
      btn.classList.add('active');
      
      // Atualizar filtro e renderizar
      currentFilter = btn.dataset.filter;
      renderProjects();
    });
  });
}

// Configurar filtros avançados
function setupAdvancedFilters() {
  // Filtro de loja
  if (storeFilter) {
    storeFilter.addEventListener('change', () => {
      selectedStore = storeFilter.value;
      renderProjects();
    });
  }
  
  // Filtro de integradora
  if (integratorFilter) {
    integratorFilter.addEventListener('change', () => {
      selectedIntegrator = integratorFilter.value;
      renderProjects();
    });
  }
  
  // Filtros de data - Início De
  if (startDateFromInput) {
    startDateFromInput.addEventListener('change', () => {
      startDateFrom = startDateFromInput.value;
      renderProjects();
    });
  }
  
  // Filtros de data - Início Até
  if (startDateToInput) {
    startDateToInput.addEventListener('change', () => {
      startDateTo = startDateToInput.value;
      renderProjects();
    });
  }
  
  // Filtros de data - Fim De
  if (endDateFromInput) {
    endDateFromInput.addEventListener('change', () => {
      endDateFrom = endDateFromInput.value;
      renderProjects();
    });
  }
  
  // Filtros de data - Fim Até
  if (endDateToInput) {
    endDateToInput.addEventListener('change', () => {
      endDateTo = endDateToInput.value;
      renderProjects();
    });
  }
}

// Configurar Socket.IO para atualizações em tempo real
function setupSocket() {
  try {
    socket = io({
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Conectado ao servidor em tempo real');
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor');
    });

    // Escutar atualizações de projetos
    socket.on('projectUpdated', (project) => {
      console.log('📝 Projeto atualizado:', project.id);
      updateProject(project);
    });

    socket.on('projectCreated', (project) => {
      console.log('✨ Novo projeto criado:', project.id);
      allProjects.unshift(project);
      updateStats();
      renderProjects();
    });

    socket.on('projectDeleted', (projectId) => {
      console.log('🗑️ Projeto deletado:', projectId);
      allProjects = allProjects.filter(p => p.id !== projectId);
      updateStats();
      renderProjects();
    });

  } catch (error) {
    console.error('Erro ao conectar Socket.IO:', error);
  }
}

// Atualizar projeto existente
function updateProject(updatedProject) {
  const index = allProjects.findIndex(p => p.id === updatedProject.id);
  if (index !== -1) {
    allProjects[index] = { ...allProjects[index], ...updatedProject };
    updateStats();
    renderProjects();
  }
}

// Mostrar erro
function showError() {
  projectsGrid.innerHTML = `
    <div class="empty-state">
      <div class="icon">❌</div>
      <div class="text">Erro ao carregar dados</div>
    </div>
  `;
}

// Carregar versão da API
async function loadVersion() {
  try {
    const response = await fetch('/api/version');
    const data = await response.json();
    document.getElementById('version').textContent = `v${data.version}`;
  } catch (error) {
    console.error('Erro ao carregar versão:', error);
  }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init();
    loadVersion();
  });
} else {
  init();
  loadVersion();
}
