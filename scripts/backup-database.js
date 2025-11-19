// ========================================
// SCRIPT DE BACKUP DO BANCO DE DADOS
// ========================================
// 
// Faz backup automático das tabelas principais
// Uso: npm run backup
//

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function backup() {
  console.log('\n🔄 Iniciando backup do banco de dados...\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupDir = path.join(__dirname, '..', 'backup');
  
  // Criar diretório de backup se não existir
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
  const backup = {
    timestamp: new Date().toISOString(),
    database: process.env.SUPABASE_URL,
    tables: {}
  };

  try {
    // Backup de projetos
    console.log('📊 Backup: projects...');
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('*');
    
    if (projError) throw projError;
    backup.tables.projects = projects;
    console.log(`   ✅ ${projects.length} projetos salvos`);

    // Backup de tarefas
    console.log('📋 Backup: tasks...');
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*');
    
    if (tasksError) throw tasksError;
    backup.tables.tasks = tasks;
    console.log(`   ✅ ${tasks.length} tarefas salvas`);

    // Backup de usuários (sem senha)
    console.log('👥 Backup: users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, organization_id, active, created_at');
    
    if (usersError) throw usersError;
    backup.tables.users = users;
    console.log(`   ✅ ${users.length} usuários salvos`);

    // Backup de lojas
    console.log('🏪 Backup: stores...');
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*');
    
    if (storesError) throw storesError;
    backup.tables.stores = stores;
    console.log(`   ✅ ${stores.length} lojas salvas`);

    // Backup de status
    console.log('📊 Backup: work_statuses...');
    const { data: statuses, error: statusError } = await supabase
      .from('work_statuses')
      .select('*');
    
    if (statusError) throw statusError;
    backup.tables.work_statuses = statuses;
    console.log(`   ✅ ${statuses.length} status salvos`);

    // Salvar arquivo
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ BACKUP CONCLUÍDO COM SUCESSO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📁 Arquivo: ${backupFile}`);
    console.log(`📊 Total de registros: ${
      projects.length + tasks.length + users.length + stores.length + statuses.length
    }`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Erro ao fazer backup:', error.message);
    process.exit(1);
  }
}

backup();
