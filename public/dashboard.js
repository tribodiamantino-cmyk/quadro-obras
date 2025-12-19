// Dashboard Público - Quadro de Obras
// Versão simplificada para visualização mobile

let allProjects = [];
let allStores = [];
let allIntegrators = [];
let allAssemblers = [];
let allElectricians = [];
let allTypes = [];
let allStatuses = [];
let currentFilter = 'all';
let selectedStore = 'all';
let selectedIntegrator = 'all';
let selectedType = 'all';
let selectedAssembler = 'all';
let selectedElectrician = 'all';
let selectedStatus = 'all';
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
const typeFilter = document.getElementById('typeFilter');
const assemblerFilter = document.getElementById('assemblerFilter');
const electricianFilter = document.getElementById('electricianFilter');
const statusFilter = document.getElementById('statusFilter');
const startDateFromInput = document.getElementById('startDateFrom');
const startDateToInput = document.getElementById('startDateTo');
const endDateFromInput = document.getElementById('endDateFrom');
const endDateToInput = document.getElementById('endDateTo');
const filtersToggleBtn = document.getElementById('filtersToggleBtn');
const advancedFilters = document.getElementById('advancedFilters');

// Inicializar
async function init() {
  try {
    await loadProjects();
    setupFilters();
    setupAdvancedFilters();
    setupFiltersToggle();
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
    
    // Extrair listas únicas de tipos, montadores, eletricistas e status
    extractUniqueValues();
    
    populateStoresDropdown();
    populateIntegratorsDropdown();
    populateTypesDropdown();
    populateAssemblersDropdown();
    populateElectriciansDropdown();
    populateStatusesDropdown();
    updateStats();
    renderProjects();
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    showError();
  }
}

// Extrair valores únicos dos projetos
function extractUniqueValues() {
  // Tipos
  const typesSet = new Set();
  allProjects.forEach(p => {
    if (p.category) typesSet.add(p.category);
  });
  allTypes = Array.from(typesSet).sort();
  
  // Montadores
  const assemblersSet = new Set();
  allProjects.forEach(p => {
    if (p.assembler?.name) assemblersSet.add(JSON.stringify({ id: p.assembler.id, name: p.assembler.name }));
  });
  allAssemblers = Array.from(assemblersSet).map(s => JSON.parse(s)).sort((a, b) => a.name.localeCompare(b.name));
  
  // Eletricistas
  const electriciansSet = new Set();
  allProjects.forEach(p => {
    if (p.electrician?.name) electriciansSet.add(JSON.stringify({ id: p.electrician.id, name: p.electrician.name }));
  });
  allElectricians = Array.from(electriciansSet).map(s => JSON.parse(s)).sort((a, b) => a.name.localeCompare(b.name));
  
  // Status
  const statusesSet = new Set();
  allProjects.forEach(p => {
    if (p.work_status?.name) statusesSet.add(JSON.stringify({ id: p.work_status.id, name: p.work_status.name }));
  });
  allStatuses = Array.from(statusesSet).map(s => JSON.parse(s)).sort((a, b) => a.name.localeCompare(b.name));
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

// Preencher dropdown de tipos
function populateTypesDropdown() {
  if (!typeFilter || allTypes.length === 0) return;
  
  const options = allTypes.map(type => 
    `<option value="${type}">${type}</option>`
  ).join('');
  
  typeFilter.innerHTML = `<option value="all">Todos os tipos</option>${options}`;
}

// Preencher dropdown de montadores
function populateAssemblersDropdown() {
  if (!assemblerFilter || allAssemblers.length === 0) return;
  
  const options = allAssemblers.map(assembler => 
    `<option value="${assembler.id}">${assembler.name}</option>`
  ).join('');
  
  assemblerFilter.innerHTML = `<option value="all">Todos os montadores</option>${options}`;
}

// Preencher dropdown de eletricistas
function populateElectriciansDropdown() {
  if (!electricianFilter || allElectricians.length === 0) return;
  
  const options = allElectricians.map(electrician => 
    `<option value="${electrician.id}">${electrician.name}</option>`
  ).join('');
  
  electricianFilter.innerHTML = `<option value="all">Todos os eletricistas</option>${options}`;
}

// Preencher dropdown de status
function populateStatusesDropdown() {
  if (!statusFilter || allStatuses.length === 0) return;
  
  const options = allStatuses.map(status => 
    `<option value="${status.id}">${status.name}</option>`
  ).join('');
  
  statusFilter.innerHTML = `<option value="all">Todos os status</option>${options}`;
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
      <div class="project-card" style="border-color: ${statusColor}" onclick='openProjectDetails(${JSON.stringify(project).replace(/'/g, "&apos;")})'>
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
    
    // Filtro por tipo de obra
    if (selectedType !== 'all' && project.category !== selectedType) {
      return false;
    }
    
    // Filtro por montador
    if (selectedAssembler !== 'all' && project.assembler?.id !== selectedAssembler) {
      return false;
    }
    
    // Filtro por eletricista
    if (selectedElectrician !== 'all' && project.electrician?.id !== selectedElectrician) {
      return false;
    }
    
    // Filtro por status
    if (selectedStatus !== 'all' && project.work_status?.id !== selectedStatus) {
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
  
  // Filtro de tipo
  if (typeFilter) {
    typeFilter.addEventListener('change', () => {
      selectedType = typeFilter.value;
      renderProjects();
    });
  }
  
  // Filtro de montador
  if (assemblerFilter) {
    assemblerFilter.addEventListener('change', () => {
      selectedAssembler = assemblerFilter.value;
      renderProjects();
    });
  }
  
  // Filtro de eletricista
  if (electricianFilter) {
    electricianFilter.addEventListener('change', () => {
      selectedElectrician = electricianFilter.value;
      renderProjects();
    });
  }
  
  // Filtro de status
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      selectedStatus = statusFilter.value;
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

// Configurar toggle dos filtros avançados
function setupFiltersToggle() {
  if (!filtersToggleBtn || !advancedFilters) return;
  
  filtersToggleBtn.addEventListener('click', () => {
    const isOpen = advancedFilters.classList.contains('show');
    
    if (isOpen) {
      advancedFilters.classList.remove('show');
      filtersToggleBtn.classList.remove('active');
    } else {
      advancedFilters.classList.add('show');
      filtersToggleBtn.classList.add('active');
    }
  });
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

// Abrir modal com detalhes do projeto
function openProjectDetails(project) {
  const modal = document.getElementById('modalOverlay');
  
  // Preencher informações básicas
  document.getElementById('modalProjectName').textContent = project.client_name || project.name;
  document.getElementById('modalProjectStore').textContent = `🏪 ${project.store?.code || '-'} ${project.store?.name || 'Sem loja'}`;
  
  // Status
  const statusColor = project.work_status?.color || '#64748b';
  const statusName = project.work_status?.name || 'Sem status';
  document.getElementById('modalStatus').innerHTML = `
    <div class="status-display" style="background: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40;">
      <span class="status-dot-large" style="background: ${statusColor}"></span>
      ${statusName}
    </div>
  `;
  
  // Categoria
  const categoryIcon = project.category === 'reforma' ? '🔧' : '🏗️';
  const categoryText = project.category === 'reforma' ? 'Reforma' : 'Nova';
  document.getElementById('modalCategory').textContent = `${categoryIcon} ${categoryText}`;
  
  // Cliente
  document.getElementById('modalClientName').textContent = project.client_name || '-';
  
  // Datas
  document.getElementById('modalForecastStart').textContent = project.forecast_start 
    ? new Date(project.forecast_start).toLocaleDateString('pt-BR') 
    : 'Não definida';
  document.getElementById('modalForecastEnd').textContent = project.forecast_end 
    ? new Date(project.forecast_end).toLocaleDateString('pt-BR') 
    : 'Não definida';
  
  // Responsáveis
  document.getElementById('modalIntegrator').textContent = project.integrator?.name || 'Não definida';
  document.getElementById('modalAssembler').textContent = project.assembler?.name || 'Não definida';
  document.getElementById('modalElectrician').textContent = project.electrician?.name || 'Não definida';
  
  // Observações
  const observationsSection = document.getElementById('modalObservationsSection');
  const observationsText = project.details_text || '';
  if (observationsText.trim()) {
    observationsSection.style.display = 'block';
    document.getElementById('modalObservations').innerHTML = observationsText.replace(/\n/g, '<br>');
  } else {
    observationsSection.style.display = 'none';
  }
  
  // Checklist
  const checklistSection = document.getElementById('modalChecklistSection');
  const checklist = project.details_checklist || [];
  if (checklist.length > 0) {
    checklistSection.style.display = 'block';
    document.getElementById('modalChecklist').innerHTML = checklist.map(item => `
      <div class="checklist-item">
        <div class="checklist-checkbox ${item.checked ? 'checked' : ''}"></div>
        <div class="checklist-text ${item.checked ? 'checked' : ''}">${item.text}</div>
      </div>
    `).join('');
  } else {
    checklistSection.style.display = 'none';
  }
  
  // Mostrar modal
  modal.classList.add('show');
  document.body.style.overflow = 'hidden'; // Prevenir scroll do body
}

// Fechar modal
function closeModal() {
  const modal = document.getElementById('modalOverlay');
  modal.classList.remove('show');
  document.body.style.overflow = ''; // Restaurar scroll
}

// Configurar eventos do modal
function setupModal() {
  const modalClose = document.getElementById('modalClose');
  const modalOverlay = document.getElementById('modalOverlay');
  
  // Fechar ao clicar no X
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  
  // Fechar ao clicar fora do modal
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }
  
  // Fechar com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
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
    setupModal();
  });
} else {
  init();
  loadVersion();
  setupModal();
}
