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
    const res = await api('/api/settings/users');
    users = await res.json();
    renderUsers();
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
  }
}

function renderUsers() {
  const list = document.getElementById('users-list');
  list.innerHTML = users.map(u => `
    <tr>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>
        <select class="role-badge role-${u.role.toLowerCase()}" 
                onchange="updateUserRole('${u.id}', this.value)" 
                ${u.id === user.id ? 'disabled' : ''}>
          <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
          <option value="MEMBER" ${u.role === 'MEMBER' ? 'selected' : ''}>Membro</option>
          <option value="VIEWER" ${u.role === 'VIEWER' ? 'selected' : ''}>Visualizador</option>
        </select>
      </td>
      <td>
        ${u.id === user.id ? '<em style="color: #95a5a6;">Você</em>' : '-'}
      </td>
    </tr>
  `).join('');
}

window.updateUserRole = async function(userId, role) {
  if (!confirm(`Alterar permissão deste usuário para ${role}?`)) {
    await loadUsers();
    return;
  }
  
  try {
    const res = await api(`/api/settings/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
    
    if (res.ok) {
      await loadUsers();
    } else {
      const error = await res.json();
      alert(error.message || 'Erro ao atualizar permissão');
      await loadUsers();
    }
  } catch (error) {
    console.error('Erro ao atualizar permissão:', error);
    alert('Erro ao atualizar permissão');
    await loadUsers();
  }
};

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

// ==================== INICIALIZAÇÃO ====================

loadStores();
loadWorkStatuses();
loadUsers();
loadIntegrators();
loadAssemblers();
loadElectricians();
