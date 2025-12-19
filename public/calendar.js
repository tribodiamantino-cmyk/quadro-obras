// Calendário de Obras
// Visualização de datas das obras com filtros

// Estado
let allEvents = [];
let filteredEvents = [];
let stores = [];
let integrators = [];
let workStatuses = [];
let eventTypes = [];
let activeEventTypes = ['start_date', 'delivery_forecast', 'gsi_forecast_date', 'gsi_actual_date'];

// Filtros
let selectedStore = 'all';
let selectedIntegrator = 'all';
let selectedCategory = 'all';
let selectedStatus = 'all';

// Navegação
let currentDate = new Date();
let selectedDay = null;

// Elementos DOM
const calendarDays = document.getElementById('calendarDays');
const currentMonthEl = document.getElementById('currentMonth');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const filtersToggleBtn = document.getElementById('filtersToggleBtn');
const filtersPanel = document.getElementById('filtersPanel');
const storeFilter = document.getElementById('storeFilter');
const integratorFilter = document.getElementById('integratorFilter');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const eventTypesLegend = document.getElementById('eventTypesLegend');
const eventsList = document.getElementById('eventsList');
const eventsContainer = document.getElementById('eventsContainer');
const selectedDateEl = document.getElementById('selectedDate');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');

// Nomes dos meses em português
const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Inicializar
async function init() {
  try {
    await loadCalendarData();
    setupEventListeners();
    renderCalendar();
  } catch (error) {
    console.error('Erro ao inicializar:', error);
    showError();
  }
}

// Carregar dados do calendário
async function loadCalendarData() {
  try {
    const response = await fetch('/api/calendar');
    if (!response.ok) throw new Error('Erro ao carregar dados');
    
    const data = await response.json();
    allEvents = data.events || [];
    stores = data.stores || [];
    integrators = data.integrators || [];
    workStatuses = data.workStatuses || [];
    eventTypes = data.eventTypes || [];
    
    populateFilters();
    renderEventTypesLegend();
    applyFilters();
  } catch (error) {
    console.error('Erro ao carregar calendário:', error);
    throw error;
  }
}

// Popular dropdowns de filtros
function populateFilters() {
  // Lojas
  if (storeFilter && stores.length > 0) {
    const options = stores.map(s => 
      `<option value="${s.id}">${s.code} - ${s.name}</option>`
    ).join('');
    storeFilter.innerHTML = `<option value="all">Todas as lojas</option>${options}`;
  }
  
  // Integradoras
  if (integratorFilter && integrators.length > 0) {
    const options = integrators.map(i => 
      `<option value="${i.id}">${i.name}</option>`
    ).join('');
    integratorFilter.innerHTML = `<option value="all">Todas as integradoras</option>${options}`;
  }
  
  // Status da obra
  if (statusFilter && workStatuses.length > 0) {
    const options = workStatuses.map(s => 
      `<option value="${s.id}">${s.name}</option>`
    ).join('');
    statusFilter.innerHTML = `<option value="all">Todos os status</option>${options}`;
  }
}

// Renderizar legenda de tipos de evento
function renderEventTypesLegend() {
  if (!eventTypesLegend || eventTypes.length === 0) return;
  
  eventTypesLegend.innerHTML = eventTypes.map(et => `
    <div class="event-type-badge ${activeEventTypes.includes(et.type) ? 'active' : ''}" 
         data-type="${et.type}"
         style="--badge-color: ${et.color}">
      <span class="event-type-dot" style="background: ${et.color}"></span>
      <span>${et.icon} ${et.label}</span>
    </div>
  `).join('');
  
  // Adicionar eventos de clique
  document.querySelectorAll('.event-type-badge').forEach(badge => {
    badge.addEventListener('click', () => {
      const type = badge.dataset.type;
      toggleEventType(type);
    });
  });
}

// Toggle tipo de evento
function toggleEventType(type) {
  const index = activeEventTypes.indexOf(type);
  if (index > -1) {
    activeEventTypes.splice(index, 1);
  } else {
    activeEventTypes.push(type);
  }
  
  // Atualizar visual da legenda
  document.querySelectorAll('.event-type-badge').forEach(badge => {
    const badgeType = badge.dataset.type;
    badge.classList.toggle('active', activeEventTypes.includes(badgeType));
  });
  
  applyFilters();
  renderCalendar();
}

// Aplicar filtros
function applyFilters() {
  filteredEvents = allEvents.filter(event => {
    // Filtro por tipo de evento
    if (!activeEventTypes.includes(event.type)) return false;
    
    // Filtro por loja
    if (selectedStore !== 'all' && event.project.store?.id !== selectedStore) return false;
    
    // Filtro por integradora
    if (selectedIntegrator !== 'all' && event.project.integrator?.id !== selectedIntegrator) return false;
    
    // Filtro por categoria
    if (selectedCategory !== 'all' && event.project.category !== selectedCategory) return false;
    
    // Filtro por status da obra
    if (selectedStatus !== 'all' && event.project.status?.id !== selectedStatus) return false;
    
    // Não mostrar arquivadas
    if (event.project.archived) return false;
    
    return true;
  });
}

// Renderizar calendário
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Atualizar título do mês
  currentMonthEl.textContent = `${monthNames[month]} ${year}`;
  
  // Primeiro dia do mês
  const firstDay = new Date(year, month, 1);
  const startingDay = firstDay.getDay();
  
  // Último dia do mês
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();
  
  // Dias do mês anterior para preencher
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  
  // Gerar HTML dos dias
  let daysHTML = '';
  
  // Dias do mês anterior
  for (let i = startingDay - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    daysHTML += renderDayCell(year, month - 1, day, true);
  }
  
  // Dias do mês atual
  for (let day = 1; day <= totalDays; day++) {
    daysHTML += renderDayCell(year, month, day, false);
  }
  
  // Dias do próximo mês
  const remainingDays = 42 - (startingDay + totalDays); // 6 semanas * 7 dias
  for (let day = 1; day <= remainingDays; day++) {
    daysHTML += renderDayCell(year, month + 1, day, true);
  }
  
  calendarDays.innerHTML = daysHTML;
  
  // Adicionar eventos de clique nos dias
  document.querySelectorAll('.day').forEach(dayEl => {
    dayEl.addEventListener('click', () => {
      const dateStr = dayEl.dataset.date;
      if (dateStr) {
        selectDay(dateStr);
      }
    });
  });
}

// Renderizar célula de dia
function renderDayCell(year, month, day, isOtherMonth) {
  const date = new Date(year, month, day);
  const dateStr = formatDateISO(date);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  // Eventos deste dia
  const dayEvents = filteredEvents.filter(e => e.date === dateStr);
  
  // Máximo de eventos a mostrar
  const maxEventsToShow = 2;
  const eventsToShow = dayEvents.slice(0, maxEventsToShow);
  const moreCount = dayEvents.length - maxEventsToShow;
  
  const eventsHTML = eventsToShow.map(e => `
    <div class="day-event" style="background: ${e.color}30; color: ${e.color}">
      ${getEventIcon(e.type)}
    </div>
  `).join('');
  
  const moreHTML = moreCount > 0 ? `<div class="day-event-more">+${moreCount}</div>` : '';
  
  return `
    <div class="day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}">
      <div class="day-number">${day}</div>
      <div class="day-events">
        ${eventsHTML}
        ${moreHTML}
      </div>
    </div>
  `;
}

// Obter ícone do tipo de evento
function getEventIcon(type) {
  const icons = {
    'start_date': '🚀',
    'delivery_forecast': '📦',
    'gsi_forecast_date': '📋',
    'gsi_actual_date': '✅'
  };
  return icons[type] || '📌';
}

// Selecionar dia
function selectDay(dateStr) {
  selectedDay = dateStr;
  
  // Eventos do dia
  const dayEvents = filteredEvents.filter(e => e.date === dateStr);
  
  if (dayEvents.length === 0) {
    eventsList.style.display = 'none';
    return;
  }
  
  // Formatar data para exibição
  const date = new Date(dateStr + 'T00:00:00');
  const formattedDate = date.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  
  selectedDateEl.textContent = formattedDate;
  
  // Renderizar eventos
  eventsContainer.innerHTML = dayEvents.map(event => {
    const categoryIcon = event.project.category === 'reforma' ? '🔧' : '🏗️';
    const statusColor = event.project.status?.color || '#94a3b8';
    
    return `
    <div class="event-card" style="border-color: ${event.color}" onclick='showEventDetails(${JSON.stringify(event).replace(/'/g, "&apos;")})'>
      <div class="event-card-header">
        <div class="event-card-title">${event.project.name}</div>
        <div class="event-card-type" style="background: ${event.color}30; color: ${event.color}">
          ${getEventIcon(event.type)} ${event.typeLabel}
        </div>
      </div>
      ${event.project.client_name ? `<div class="event-card-client">👤 ${event.project.client_name}</div>` : ''}
      <div class="event-card-details">
        <span>🏪 ${event.project.store?.code || '-'}</span>
        <span style="color: ${statusColor}">📊 ${event.project.status?.name || '-'}</span>
        <span>${categoryIcon} ${event.project.category === 'reforma' ? 'Reforma' : 'Nova'}</span>
      </div>
      ${event.project.integrator || event.project.assembler || event.project.electrician ? `
      <div class="event-card-team">
        ${event.project.integrator ? `<span>🔌 ${event.project.integrator.name}</span>` : ''}
        ${event.project.assembler ? `<span>🔧 ${event.project.assembler.name}</span>` : ''}
        ${event.project.electrician ? `<span>⚡ ${event.project.electrician.name}</span>` : ''}
      </div>
      ` : ''}
    </div>
  `}).join('');
  
  eventsList.style.display = 'block';
  
  // Scroll para a lista
  eventsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Mostrar detalhes do evento
function showEventDetails(event) {
  document.getElementById('modalTitle').textContent = event.project.name;
  document.getElementById('modalSubtitle').textContent = event.typeLabel;
  
  const categoryText = event.project.category === 'reforma' ? '🔧 Reforma' : '🏗️ Nova';
  
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-detail">
      <label>Tipo de Evento</label>
      <div class="value" style="color: ${event.color}">${getEventIcon(event.type)} ${event.typeLabel}</div>
    </div>
    <div class="modal-detail">
      <label>Data</label>
      <div class="value">${formatDateBR(event.date)}</div>
    </div>
    <div class="modal-detail">
      <label>Obra</label>
      <div class="value">${event.project.name}</div>
    </div>
    ${event.project.client_name ? `
    <div class="modal-detail">
      <label>Cliente</label>
      <div class="value">👤 ${event.project.client_name}</div>
    </div>
    ` : ''}
    <div class="modal-detail">
      <label>Loja</label>
      <div class="value">🏪 ${event.project.store?.code || '-'} ${event.project.store?.name || ''}</div>
    </div>
    <div class="modal-detail">
      <label>Categoria</label>
      <div class="value">${categoryText}</div>
    </div>
    <div class="modal-detail">
      <label>Status</label>
      <div class="value" style="color: ${event.project.status?.color || '#94a3b8'}">
        📊 ${event.project.status?.name || 'Não definido'}
      </div>
    </div>
    ${event.project.integrator ? `
      <div class="modal-detail">
        <label>Integradora</label>
        <div class="value">🔌 ${event.project.integrator.name}</div>
      </div>
    ` : ''}
    ${event.project.assembler ? `
      <div class="modal-detail">
        <label>Montador</label>
        <div class="value">🔧 ${event.project.assembler.name}</div>
      </div>
    ` : ''}
    ${event.project.electrician ? `
      <div class="modal-detail">
        <label>Eletricista</label>
        <div class="value">⚡ ${event.project.electrician.name}</div>
      </div>
    ` : ''}
    ${event.project.details_text ? `
      <div class="modal-detail">
        <label>Observações</label>
        <div class="value" style="font-size: 12px; color: #94a3b8; white-space: pre-wrap;">${event.project.details_text}</div>
      </div>
    ` : ''}
    <div class="modal-actions" style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
      <a href="/" class="btn-open-project" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
        📋 Ver no Quadro
      </a>
    </div>
  `;
  
  modalOverlay.classList.add('show');
}

// Fechar modal
function closeModal() {
  modalOverlay.classList.remove('show');
}

// Configurar event listeners
function setupEventListeners() {
  // Navegação de mês
  prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    eventsList.style.display = 'none';
  });
  
  nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    eventsList.style.display = 'none';
  });
  
  // Toggle filtros
  filtersToggleBtn.addEventListener('click', () => {
    filtersPanel.classList.toggle('show');
    filtersToggleBtn.classList.toggle('active');
  });
  
  // Filtros
  storeFilter.addEventListener('change', () => {
    selectedStore = storeFilter.value;
    applyFilters();
    renderCalendar();
    eventsList.style.display = 'none';
  });
  
  integratorFilter.addEventListener('change', () => {
    selectedIntegrator = integratorFilter.value;
    applyFilters();
    renderCalendar();
    eventsList.style.display = 'none';
  });
  
  categoryFilter.addEventListener('change', () => {
    selectedCategory = categoryFilter.value;
    applyFilters();
    renderCalendar();
    eventsList.style.display = 'none';
  });
  
  // Filtro de status
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      selectedStatus = statusFilter.value;
      applyFilters();
      renderCalendar();
      eventsList.style.display = 'none';
    });
  }
  
  // Modal
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// Formatar data ISO
function formatDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Formatar data BR
function formatDateBR(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Mostrar erro
function showError() {
  calendarDays.innerHTML = `
    <div class="empty-events" style="grid-column: span 7;">
      <div class="icon">❌</div>
      <div>Erro ao carregar calendário</div>
    </div>
  `;
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
