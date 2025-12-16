/**
 * Script de Exportação de Dados do Supabase
 * Execute este script para exportar todos os dados para JSON
 * 
 * Uso: node migrations/export-supabase.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltam variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportData() {
  console.log('🚀 Iniciando exportação do Supabase...\n');
  
  const exportDir = path.join(__dirname, 'backup');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const tables = [
    'organizations',
    'users',
    'stores',
    'work_statuses',
    'integrators',
    'assemblers',
    'electricians',
    'projects',
    'tasks'
  ];

  const backup = {
    exportedAt: new Date().toISOString(),
    tables: {}
  };

  for (const table of tables) {
    console.log(`📦 Exportando ${table}...`);
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`   ❌ Erro ao exportar ${table}:`, error.message);
        backup.tables[table] = { error: error.message, data: [] };
      } else {
        console.log(`   ✅ ${data.length} registros`);
        backup.tables[table] = { count: data.length, data };
      }
    } catch (err) {
      console.error(`   ❌ Erro ao exportar ${table}:`, err.message);
      backup.tables[table] = { error: err.message, data: [] };
    }
  }

  // Salvar backup completo
  const backupFile = path.join(exportDir, `supabase-backup-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  console.log(`\n✅ Backup salvo em: ${backupFile}`);

  // Resumo
  console.log('\n📊 RESUMO DA EXPORTAÇÃO:');
  console.log('========================');
  for (const [table, info] of Object.entries(backup.tables)) {
    if (info.error) {
      console.log(`   ${table}: ❌ ERRO - ${info.error}`);
    } else {
      console.log(`   ${table}: ${info.count} registros`);
    }
  }

  return backup;
}

exportData()
  .then(() => {
    console.log('\n🎉 Exportação concluída!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Erro na exportação:', err);
    process.exit(1);
  });
