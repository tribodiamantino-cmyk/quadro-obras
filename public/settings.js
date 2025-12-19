// Verificar autenticação e permissão ADMIN
if (!Auth.isAuthenticated()) {
  window.location.href = '/login.html';
}

const user = Auth.getUser();
if (user.role !== 'ADMIN') {
  alert('Acesso negado. Apenas administradores podem acessar esta página.');
  window.location.href = '/';
}

// Helper para API
function api(path, opts = {}) {
  return Auth.fetch(path, opts);
}

// Estado global
let stores = [];
let workStatuses = [];
let users = [];
let integrators = [];
let assemblers = [];
let electricians = [];

// ==================== TABS ====================

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    // Atualizar tabs ativos
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Atualizar conteúdo ativo
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
  });
});

// ==================== STORES (Lojas) ====================

async function loadStores() {
  try {
    const res = await api('/api/settings/stores');
    stores = await res.json();
    renderStores();
  } catch (error) {
    console.error('Erro ao carregar lojas:', error);
  }
}

function renderStores() {
  const list = document.getElementById('stores-list');
  list.innerHTML = stores.map(store => `
    <tr>
      <td>${store.name}</td>
      <td><strong>${store.code}</strong></td>
      <td><span class="status-badge ${store.active ? 'status-active' : 'status-inactive'}">
        ${store.active ? 'Ativa' : 'Inativa'}
      </span></td>
      <td>
        <button class="btn-icon" onclick="editStore('${store.id}')" title="Editar">✏️</button>
        <button class="btn-icon ${store.active ? 'delete' : ''}" 
                onclick="toggleStoreStatus('${store.id}', ${!store.active})" 
                title="${store.active ? 'Desativar' : 'Ativar'}">
          ${store.active ? '🚫' : '✅'}
        </button>
      </td>
    </tr>
  `).join('');
}

window.openStoreModal = function(storeId = null) {
  const modal = document.getElementById('store-modal');
  const form = document.getElementById('store-form');
  const title = document.getElementById('store-modal-title');
  
  if (storeId) {
    const store = stores.find(s => s.id === storeId);
    title.textContent = 'Editar Loja';
    document.getElementById('store-id').value = store.id;
    document.getElementById('store-name').value = store.name;
    document.getElementById('store-code').value = store.code;
  } else {
    title.textContent = 'Nova Loja';
    form.reset();
    document.getElementById('store-id').value = '';
  }
  
  modal.classList.add('active');
};

window.closeStoreModal = function() {
  document.getElementById('store-modal').classList.remove('active');
};

window.editStore = function(id) {
  openStoreModal(id);
};

window.toggleStoreStatus = async function(id, active) {
  try {
    const res = await api(`/api/settings/stores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active })
    });
    
    if (res.ok) {
      await loadStores();
    }
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    alert('Erro ao atualizar status da loja');
  }
};

document.getElementById('store-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('store-id').value;
  const name = document.getElementById('store-name').value;
  const code = document.getElementById('store-code').value.toUpperCase();
  
  try {
    const url = id ? `/api/settings/stores/${id}` : '/api/settings/stores';
    const method = id ? 'PATCH' : 'POST';
    
    const res = await api(url, {
      method,
      body: JSON.stringify({ name, code, active: true })
    });
    
    if (res.ok) {
      closeStoreModal();
      await loadStores();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao salvar loja');
    }
  } catch (error) {
    console.error('Erro ao salvar loja:', error);
    alert('Erro ao salvar loja');
  }
});

// ==================== WORK STATUSES ====================

async function loadWorkStatuses() {
  try {
    const res = await api('/api/settings/work-statuses');
    workStatuses = await res.json();
    renderWorkStatuses();
  } catch (error) {
    console.error('Erro ao carregar status:', error);
  }
}

function renderWorkStatuses() {
  const list = document.getElementById('statuses-list');
  list.innerHTML = workStatuses.map(status => `
    <tr>
      <td><strong>${status.order_position}</strong></td>
      <td>${status.name}</td>
      <td><span class="color-badge" style="background: ${status.color}"></span></td>
      <td><span class="status-badge ${status.active ? 'status-active' : 'status-inactive'}">
        ${status.active ? 'Ativo' : 'Inativo'}
      </span></td>
      <td>
        <button class="btn-icon" onclick="editStatus('${status.id}')" title="Editar">✏️</button>
        <button class="btn-icon ${status.active ? 'delete' : ''}" 
                onclick="toggleStatusActive('${status.id}', ${!status.active})" 
                title="${status.active ? 'Desativar' : 'Ativar'}">
          ${status.active ? '🚫' : '✅'}
        </button>
      </td>
    </tr>
  `).join('');
}

window.openStatusModal = function(statusId = null) {
  const modal = document.getElementById('status-modal');
  const form = document.getElementById('status-form');
  const title = document.getElementById('status-modal-title');
  
  if (statusId) {
    const status = workStatuses.find(s => s.id === statusId);
    title.textContent = 'Editar Status';
    document.getElementById('status-id').value = status.id;
    document.getElementById('status-name').value = status.name;
    document.getElementById('status-color').value = status.color;
    document.getElementById('status-order').value = status.order_position;
  } else {
    title.textContent = 'Novo Status';
    form.reset();
    document.getElementById('status-id').value = '';
    document.getElementById('status-color').value = '#3498db';
    document.getElementById('status-order').value = workStatuses.length + 1;
  }
  
  modal.classList.add('active');
};

window.closeStatusModal = function() {
  document.getElementById('status-modal').classList.remove('active');
};

window.editStatus = function(id) {
  openStatusModal(id);
};

window.toggleStatusActive = async function(id, active) {
  try {
    const res = await api(`/api/settings/work-statuses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active })
    });
    
    if (res.ok) {
      await loadWorkStatuses();
    }
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    alert('Erro ao atualizar status');
  }
};

document.getElementById('status-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('status-id').value;
  const name = document.getElementById('status-name').value;
  const color = document.getElementById('status-color').value;
  const order_position = parseInt(document.getElementById('status-order').value);
  
  try {
    const url = id ? `/api/settings/work-statuses/${id}` : '/api/settings/work-statuses';
    const method = id ? 'PATCH' : 'POST';
    
    const res = await api(url, {
      method,
      body: JSON.stringify({ name, color, order_position, active: true })
    });
    
    if (res.ok) {
      closeStatusModal();
      await loadWorkStatuses();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao salvar status');
    }
  } catch (error) {
    console.error('Erro ao salvar status:', error);
    alert('Erro ao salvar status');
  }
});

// ==================== USERS ====================

async function loadUsers() {
  try {
    const res = await api('/api/users');
    if (!res.ok) throw new Error('Erro ao carregar usuários');
    users = await res.json();
    renderUsers();
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
  }
}

function renderUsers() {
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const list = document.getElementById('users-list');
  list.innerHTML = users.map(u => {
    const roleLabels = {
      'ADMIN': '🔑 Admin',
      'admin': '🔑 Admin',
      'MEMBER': '✏️ Membro',
      'member': '✏️ Membro',
      'VIEWER': '👁️ Visualizador',
      'viewer': '👁️ Visualizador'
    };
    
    const isCurrentUser = currentUser && currentUser.id === u.id;
    
    return `
      <tr>
        <td>${u.name}${isCurrentUser ? ' <span style="color: #22c55e;">(você)</span>' : ''}</td>
        <td>${u.email}</td>
        <td><span class="role-badge role-${u.role?.toLowerCase()}">${roleLabels[u.role] || u.role}</span></td>
        <td>
          <span class="status-badge status-${u.active ? 'active' : 'inactive'}">
            ${u.active ? '✓ Ativo' : '✗ Inativo'}
          </span>
        </td>
        <td>
          <button class="btn-icon" onclick="editUser('${u.id}')" title="Editar">✏️</button>
          ${u.active ? 
            `<button class="btn-icon delete" onclick="toggleUserStatus('${u.id}', false)" title="Desativar">⊘</button>` :
            `<button class="btn-icon" onclick="toggleUserStatus('${u.id}', true)" title="Ativar">✓</button>`
          }
          ${!isCurrentUser ? 
            `<button class="btn-icon delete" onclick="deleteUser('${u.id}', '${u.name}')" title="Excluir permanentemente">🗑️</button>` : ''
          }
        </td>
      </tr>
    `;
  }).join('');
}

window.openUserModal = function() {
  document.getElementById('user-modal-title').textContent = 'Novo Usuário';
  document.getElementById('user-id').value = '';
  document.getElementById('user-name').value = '';
  document.getElementById('user-email').value = '';
  document.getElementById('user-password').value = '';
  document.getElementById('user-password').required = true;
  document.getElementById('user-role').value = '';
  
  // Lojas - novo usuário tem acesso a todas por padrão
  document.getElementById('user-all-stores').checked = true;
  document.getElementById('stores-selection').style.display = 'none';
  populateUserStores([]);
  
  document.getElementById('user-modal').classList.add('active');
};

window.closeUserModal = function() {
  document.getElementById('user-modal').classList.remove('active');
};

// Toggle seleção de lojas
window.toggleStoresSelection = function() {
  const allStoresCheckbox = document.getElementById('user-all-stores');
  const storesSelection = document.getElementById('stores-selection');
  
  if (allStoresCheckbox.checked) {
    storesSelection.style.display = 'none';
  } else {
    storesSelection.style.display = 'block';
  }
};

// Popular checkboxes de lojas
function populateUserStores(userStores = []) {
  const container = document.getElementById('user-stores');
  if (!container || !stores || stores.length === 0) return;
  
  container.innerHTML = stores.map(store => {
    const isChecked = userStores.includes(store.id);
    return `
      <label style="display: flex; align-items: center; gap: 8px; padding: 4px; cursor: pointer;">
        <input type="checkbox" value="${store.id}" ${isChecked ? 'checked' : ''} />
        <span>${store.code} - ${store.name}</span>
      </label>
    `;
  }).join('');
}

window.editUser = async function(userId) {
  const u = users.find(user => user.id === userId);
  if (!u) return;
  
  document.getElementById('user-modal-title').textContent = 'Editar Usuário';
  document.getElementById('user-id').value = u.id;
  document.getElementById('user-name').value = u.name;
  document.getElementById('user-email').value = u.email;
  document.getElementById('user-password').value = '';
  document.getElementById('user-password').required = false;
  document.getElementById('user-role').value = u.role;
  
  // Carregar lojas do usuário
  try {
    const allStoresAccess = u.all_stores_access !== false; // Default true se não definido
    document.getElementById('user-all-stores').checked = allStoresAccess;
    
    if (!allStoresAccess) {
      // Buscar lojas específicas do usuário
      const res = await api(`/api/users/${userId}`);
      const userData = await res.json();
      const userStoreIds = userData.store_ids || [];
      populateUserStores(userStoreIds);
      document.getElementById('stores-selection').style.display = 'block';
    } else {
      populateUserStores([]);
      document.getElementById('stores-selection').style.display = 'none';
    }
  } catch (error) {
    console.error('Erro ao carregar lojas do usuário:', error);
    // Em caso de erro, mostrar todas as lojas desmarcadas
    populateUserStores([]);
  }
  
  document.getElementById('user-modal').classList.add('active');
};

window.toggleUserStatus = async function(userId, active) {
  const action = active ? 'ativar' : 'desativar';
  if (!confirm(`Tem certeza que deseja ${action} este usuário?`)) return;
  
  try {
    const res = await api(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ active })
    });
    
    if (res.ok) {
      await loadUsers();
    } else {
      const error = await res.json();
      alert(error.message || `Erro ao ${action} usuário`);
    }
  } catch (error) {
    console.error(`Erro ao ${action} usuário:`, error);
    alert(`Erro ao ${action} usuário`);
  }
};

window.deleteUser = async function(userId, userName) {
  if (!confirm(`⚠️ ATENÇÃO: Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário "${userName}"?\n\nEsta ação NÃO pode ser desfeita!`)) return;
  
  try {
    const res = await api(`/api/users/${userId}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      alert(`✅ Usuário "${userName}" excluído com sucesso!`);
      await loadUsers();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao excluir usuário');
    }
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    alert('Erro ao excluir usuário');
  }
};

document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = document.getElementById('user-id').value;
  const name = document.getElementById('user-name').value;
  const email = document.getElementById('user-email').value;
  const password = document.getElementById('user-password').value;
  const role = document.getElementById('user-role').value;
  
  // Coletar configuração de lojas
  const allStoresAccess = document.getElementById('user-all-stores').checked;
  const store_ids = [];
  
  if (!allStoresAccess) {
    // Coletar lojas selecionadas
    const checkboxes = document.querySelectorAll('#user-stores input[type="checkbox"]:checked');
    checkboxes.forEach(cb => store_ids.push(parseInt(cb.value)));
  }
  
  const body = { 
    name, 
    email, 
    role,
    all_stores_access: allStoresAccess,
    store_ids 
  };
  if (password) body.password = password;
  
  try {
    const url = id ? `/api/users/${id}` : '/api/users';
    const method = id ? 'PUT' : 'POST';
    
    const res = await api(url, {
      method,
      body: JSON.stringify(body)
    });
    
    if (res.ok) {
      closeUserModal();
      await loadUsers();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao salvar usuário');
    }
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    alert('Erro ao salvar usuário');
  }
});

// ==================== LOGS DE AUDITORIA ====================

let logs = [];
let logsPagination = { page: 1, limit: 50, total: 0, totalPages: 0 };

async function loadLogs(page = 1) {
  try {
    const userFilter = document.getElementById('log-user-filter')?.value || '';
    const actionFilter = document.getElementById('log-action-filter')?.value || '';
    const entityFilter = document.getElementById('log-entity-filter')?.value || '';
    
    const params = new URLSearchParams({ page, limit: 50 });
    if (userFilter) params.append('userId', userFilter);
    if (actionFilter) params.append('action', actionFilter);
    if (entityFilter) params.append('entityType', entityFilter);
    
    const res = await api(`/api/audit-logs?${params}`);
    if (!res.ok) throw new Error('Erro ao carregar logs');
    
    const data = await res.json();
    logs = data.logs;
    logsPagination = data.pagination;
    
    renderLogs();
    renderLogsPagination();
    
    // Carregar usuários para o filtro
    await loadUsersForFilter();
  } catch (error) {
    console.error('Erro ao carregar logs:', error);
  }
}

async function loadUsersForFilter() {
  try {
    const res = await api('/api/users');
    if (!res.ok) return;
    const users = await res.json();
    
    const select = document.getElementById('log-user-filter');
    if (select && select.children.length === 1) {
      select.innerHTML += users.map(u => 
        `<option value="${u.id}">${u.name}</option>`
      ).join('');
    }
  } catch (error) {
    console.error('Erro ao carregar usuários para filtro:', error);
  }
}

function renderLogs() {
  const list = document.getElementById('logs-list');
  
  if (!logs || logs.length === 0) {
    list.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #95a5a6; padding: 40px;">Nenhum log encontrado</td></tr>';
    return;
  }
  
  const actionIcons = {
    'create': '➕',
    'update': '✏️',
    'delete': '🗑️',
    'archive': '📦',
    'restore': '♻️',
    'login': '🔓',
    'logout': '🔒'
  };
  
  const entityIcons = {
    'project': '🏗️',
    'task': '📋',
    'user': '👥',
    'store': '🏪',
    'status': '📊'
  };
  
  list.innerHTML = logs.map(log => {
    const date = new Date(log.created_at);
    const dateStr = date.toLocaleDateString('pt-BR');
    const timeStr = date.toLocaleTimeString('pt-BR');
    const userName = log.users?.name || 'Sistema';
    
    return `
      <tr>
        <td style="font-size: 11px;">
          ${dateStr}<br/>
          <span style="color: #95a5a6;">${timeStr}</span>
        </td>
        <td>${userName}</td>
        <td>${actionIcons[log.action] || '•'} ${log.action}</td>
        <td>${entityIcons[log.entity_type] || '📄'} ${log.entity_type}</td>
        <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis;">
          <strong>${log.entity_name || '-'}</strong>
          ${log.entity_id ? `<br/><small style="color: #95a5a6;">${log.entity_id.substring(0, 20)}...</small>` : ''}
        </td>
        <td style="font-size: 11px; color: #95a5a6;">${log.ip_address || '-'}</td>
      </tr>
    `;
  }).join('');
}

function renderLogsPagination() {
  const container = document.getElementById('logs-pagination');
  if (!container) return;
  
  const { page, totalPages, total } = logsPagination;
  
  if (totalPages <= 1) {
    container.innerHTML = `<p>Total: ${total} registros</p>`;
    return;
  }
  
  let html = '<div style="display: flex; gap: 10px; align-items: center; justify-content: center;">';
  
  if (page > 1) {
    html += `<button class="btn-secondary" onclick="loadLogs(${page - 1})">← Anterior</button>`;
  }
  
  html += `<span>Página ${page} de ${totalPages} (${total} registros)</span>`;
  
  if (page < totalPages) {
    html += `<button class="btn-secondary" onclick="loadLogs(${page + 1})">Próximo →</button>`;
  }
  
  html += '</div>';
  container.innerHTML = html;
}

// Event listeners para filtros de logs
document.getElementById('log-user-filter')?.addEventListener('change', () => loadLogs(1));
document.getElementById('log-action-filter')?.addEventListener('change', () => loadLogs(1));
document.getElementById('log-entity-filter')?.addEventListener('change', () => loadLogs(1));

window.loadLogs = loadLogs;

// ==================== INTEGRATORS (Integradoras) ====================

async function loadIntegrators() {
  try {
    const res = await api('/api/settings/integrators');
    integrators = await res.json();
    renderIntegrators();
  } catch (error) {
    console.error('Erro ao carregar integradoras:', error);
  }
}

function renderIntegrators() {
  const list = document.getElementById('integrators-list');
  list.innerHTML = integrators.map(integrator => `
    <tr>
      <td>${integrator.name}</td>
      <td>
        <button class="btn-icon delete" onclick="deleteIntegrator('${integrator.id}')" title="Excluir">🗑️</button>
      </td>
    </tr>
  `).join('');
}

window.openIntegratorModal = function() {
  const modal = document.getElementById('integrator-modal');
  const form = document.getElementById('integrator-form');
  const title = document.getElementById('integrator-modal-title');
  
  title.textContent = 'Nova Integradora';
  form.reset();
  document.getElementById('integrator-id').value = '';
  modal.classList.add('active');
};

window.closeIntegratorModal = function() {
  document.getElementById('integrator-modal').classList.remove('active');
};

window.deleteIntegrator = async function(id) {
  if (!confirm('Excluir esta integradora?')) return;
  
  try {
    const res = await api(`/api/settings/integrators/${id}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      await loadIntegrators();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao excluir integradora');
    }
  } catch (error) {
    console.error('Erro ao excluir integradora:', error);
    alert('Erro ao excluir integradora');
  }
};

document.getElementById('integrator-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('integrator-name').value;
  
  try {
    const res = await api('/api/settings/integrators', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    
    if (res.ok) {
      closeIntegratorModal();
      await loadIntegrators();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao salvar integradora');
    }
  } catch (error) {
    console.error('Erro ao salvar integradora:', error);
    alert('Erro ao salvar integradora');
  }
});

// ==================== ASSEMBLERS (Montadores) ====================

async function loadAssemblers() {
  try {
    const res = await api('/api/settings/assemblers');
    assemblers = await res.json();
    renderAssemblers();
  } catch (error) {
    console.error('Erro ao carregar montadores:', error);
  }
}

function renderAssemblers() {
  const list = document.getElementById('assemblers-list');
  list.innerHTML = assemblers.map(assembler => `
    <tr>
      <td>${assembler.name}</td>
      <td>
        <button class="btn-icon delete" onclick="deleteAssembler('${assembler.id}')" title="Excluir">🗑️</button>
      </td>
    </tr>
  `).join('');
}

window.openAssemblerModal = function() {
  const modal = document.getElementById('assembler-modal');
  const form = document.getElementById('assembler-form');
  const title = document.getElementById('assembler-modal-title');
  
  title.textContent = 'Novo Montador';
  form.reset();
  document.getElementById('assembler-id').value = '';
  modal.classList.add('active');
};

window.closeAssemblerModal = function() {
  document.getElementById('assembler-modal').classList.remove('active');
};

window.deleteAssembler = async function(id) {
  if (!confirm('Excluir este montador?')) return;
  
  try {
    const res = await api(`/api/settings/assemblers/${id}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      await loadAssemblers();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao excluir montador');
    }
  } catch (error) {
    console.error('Erro ao excluir montador:', error);
    alert('Erro ao excluir montador');
  }
};

document.getElementById('assembler-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('assembler-name').value;
  
  try {
    const res = await api('/api/settings/assemblers', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    
    if (res.ok) {
      closeAssemblerModal();
      await loadAssemblers();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao salvar montador');
    }
  } catch (error) {
    console.error('Erro ao salvar montador:', error);
    alert('Erro ao salvar montador');
  }
});

// ==================== ELECTRICIANS (Eletricistas) ====================

async function loadElectricians() {
  try {
    const res = await api('/api/settings/electricians');
    electricians = await res.json();
    renderElectricians();
  } catch (error) {
    console.error('Erro ao carregar eletricistas:', error);
  }
}

function renderElectricians() {
  const list = document.getElementById('electricians-list');
  list.innerHTML = electricians.map(electrician => `
    <tr>
      <td>${electrician.name}</td>
      <td>
        <button class="btn-icon delete" onclick="deleteElectrician('${electrician.id}')" title="Excluir">🗑️</button>
      </td>
    </tr>
  `).join('');
}

window.openElectricianModal = function() {
  const modal = document.getElementById('electrician-modal');
  const form = document.getElementById('electrician-form');
  const title = document.getElementById('electrician-modal-title');
  
  title.textContent = 'Novo Eletricista';
  form.reset();
  document.getElementById('electrician-id').value = '';
  modal.classList.add('active');
};

window.closeElectricianModal = function() {
  document.getElementById('electrician-modal').classList.remove('active');
};

window.deleteElectrician = async function(id) {
  if (!confirm('Excluir este eletricista?')) return;
  
  try {
    const res = await api(`/api/settings/electricians/${id}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      await loadElectricians();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao excluir eletricista');
    }
  } catch (error) {
    console.error('Erro ao excluir eletricista:', error);
    alert('Erro ao excluir eletricista');
  }
};

document.getElementById('electrician-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('electrician-name').value;
  
  try {
    const res = await api('/api/settings/electricians', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    
    if (res.ok) {
      closeElectricianModal();
      await loadElectricians();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao salvar eletricista');
    }
  } catch (error) {
    console.error('Erro ao salvar eletricista:', error);
    alert('Erro ao salvar eletricista');
  }
});

// ==================== LOGOUT ====================

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

// ==================== INICIALIZAÇÃO ====================

loadStores();
loadWorkStatuses();
loadUsers();
loadIntegrators();
loadAssemblers();
loadElectricians();
loadLogs(); // Carregar logs na inicialização

// ==================== CARREGAR VERSÃO DA APLICAÇÃO ====================
async function loadVersion() {
  try {
    const res = await fetch('/api/version');
    if (res.ok) {
      const data = await res.json();
      
      // Atualizar versão
      const versionEl = document.getElementById('app-version');
      if (versionEl) {
        versionEl.textContent = data.version;
      }
      
      // Atualizar data (formatar para PT-BR)
      const dateEl = document.getElementById('app-date');
      if (dateEl) {
        const buildDate = new Date(data.buildDate);
        const formattedDate = buildDate.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        dateEl.textContent = formattedDate;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar versão:', error);
  }
}

// Carregar versão ao iniciar
loadVersion();
