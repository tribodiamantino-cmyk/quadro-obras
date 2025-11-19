const supabase = require('../config/supabase');

// ==================== STORES (Lojas) ====================

exports.getStores = async (req, res) => {
  try {
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .order('name', { ascending: true });

    if (error) throw error;

    res.json(stores || []);
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createStore = async (req, res) => {
  try {
    const { name, code, color } = req.body;

    const { data: store, error } = await supabase
      .from('stores')
      .insert({
        name,
        code,
        color: color || '#3498db',
        organization_id: req.user.organizationId
      })
      .select()
      .single();

    if (error) throw error;

    res.json(store);
  } catch (error) {
    console.error('Erro ao criar loja:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, color, active } = req.body;

    const { data: store, error } = await supabase
      .from('stores')
      .update({ name, code, color, active, updated_at: new Date() })
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select()
      .single();

    if (error) throw error;

    res.json(store);
  } catch (error) {
    console.error('Erro ao atualizar loja:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id)
      .eq('organization_id', req.user.organizationId);

    if (error) throw error;

    res.json({ message: 'Loja excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir loja:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== WORK STATUSES (Status de Obras) ====================

exports.getWorkStatuses = async (req, res) => {
  try {
    const { data: statuses, error } = await supabase
      .from('work_statuses')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .order('order_position', { ascending: true });

    if (error) throw error;

    res.json(statuses || []);
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createWorkStatus = async (req, res) => {
  try {
    const { name, color, order_position } = req.body;

    const { data: status, error } = await supabase
      .from('work_statuses')
      .insert({
        name,
        color,
        order_position: order_position || 0,
        organization_id: req.user.organizationId
      })
      .select()
      .single();

    if (error) throw error;

    res.json(status);
  } catch (error) {
    console.error('Erro ao criar status:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateWorkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, order_position, active } = req.body;

    const { data: status, error } = await supabase
      .from('work_statuses')
      .update({ name, color, order_position, active, updated_at: new Date() })
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select()
      .single();

    if (error) throw error;

    res.json(status);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteWorkStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('work_statuses')
      .delete()
      .eq('id', id)
      .eq('organization_id', req.user.organizationId);

    if (error) throw error;

    res.json({ message: 'Status excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir status:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== USERS (Gerenciamento) ====================

exports.getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .eq('organization_id', req.user.organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(users || []);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MEMBER', 'VIEWER'].includes(role)) {
      return res.status(400).json({ message: 'Role inválido' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date() })
      .eq('id', id)
      .eq('organization_id', req.user.organizationId)
      .select('id, email, name, role')
      .single();

    if (error) throw error;

    res.json(user);
  } catch (error) {
    console.error('Erro ao atualizar role:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== INTEGRATORS (Integradoras) ====================

exports.getIntegrators = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('integrators')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar integradoras:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createIntegrator = async (req, res) => {
  try {
    const { name } = req.body;

    const { data, error } = await supabase
      .from('integrators')
      .insert({ name, organization_id: req.user.organizationId })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao criar integradora:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteIntegrator = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('integrators')
      .delete()
      .eq('id', id)
      .eq('organization_id', req.user.organizationId);

    if (error) throw error;
    res.json({ message: 'Integradora excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir integradora:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ASSEMBLERS (Montadores) ====================

exports.getAssemblers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assemblers')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar montadores:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createAssembler = async (req, res) => {
  try {
    const { name } = req.body;

    const { data, error } = await supabase
      .from('assemblers')
      .insert({ name, organization_id: req.user.organizationId })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao criar montador:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAssembler = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('assemblers')
      .delete()
      .eq('id', id)
      .eq('organization_id', req.user.organizationId);

    if (error) throw error;
    res.json({ message: 'Montador excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir montador:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ELECTRICIANS (Eletricistas) ====================

exports.getElectricians = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('electricians')
      .select('*')
      .eq('organization_id', req.user.organizationId)
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Erro ao buscar eletricistas:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.createElectrician = async (req, res) => {
  try {
    const { name } = req.body;

    const { data, error } = await supabase
      .from('electricians')
      .insert({ name, organization_id: req.user.organizationId })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao criar eletricista:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteElectrician = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('electricians')
      .delete()
      .eq('id', id)
      .eq('organization_id', req.user.organizationId);

    if (error) throw error;
    res.json({ message: 'Eletricista excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir eletricista:', error);
    res.status(500).json({ message: error.message });
  }
};
