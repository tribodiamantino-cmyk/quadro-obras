// ========================================
// VISUALIZADOR DE LOGS DO SUPABASE
// ========================================
// 
// Mostra logs recentes do sistema
// Uso: npm run logs
//

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function viewLogs() {
  console.log('\n📋 LOGS DE AUDITORIA - ÚLTIMAS 50 AÇÕES\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select(`
        *,
        users!audit_logs_user_id_fkey (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.log('⚠️  Tabela audit_logs não existe ou está vazia');
      console.log('   Execute: supabase-audit-logs.sql no Supabase\n');
      return;
    }

    if (!logs || logs.length === 0) {
      console.log('ℹ️  Nenhum log encontrado\n');
      return;
    }

    logs.forEach(log => {
      const date = new Date(log.created_at).toLocaleString('pt-BR');
      const user = log.users?.name || 'Sistema';
      const action = getActionEmoji(log.action);
      const entity = log.entity_type;
      
      console.log(`${action} ${date}`);
      console.log(`   👤 ${user}`);
      console.log(`   📦 ${log.action} → ${entity}`);
      
      if (log.entity_id) {
        console.log(`   🆔 ID: ${log.entity_id}`);
      }
      
      console.log('');
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Total de logs: ${logs.length}\n`);

  } catch (error) {
    console.error('❌ Erro ao buscar logs:', error.message);
  }
}

function getActionEmoji(action) {
  const emojis = {
    'create': '✨',
    'update': '📝',
    'delete': '🗑️',
    'archive': '📦',
    'restore': '♻️',
    'login': '🔐',
    'logout': '🚪'
  };
  return emojis[action] || '📌';
}

viewLogs();
