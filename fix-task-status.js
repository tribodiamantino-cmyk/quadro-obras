// Script para corrigir status das tarefas antigas
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis SUPABASE_URL e SUPABASE_KEY não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTaskStatus() {
  console.log('🔧 Corrigindo status das tarefas...\n');

  // Mapeamento de status antigos para novos
  const statusMap = {
    'backlog': 'Criado',
    'doing': 'Em separação',
    'done': 'Entregue'
  };

  try {
    // Buscar todas as tarefas com status antigos
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title, status')
      .in('status', ['backlog', 'doing', 'done']);

    if (fetchError) throw fetchError;

    console.log(`📋 Encontradas ${tasks.length} tarefas com status antigos\n`);

    // Atualizar cada tarefa
    for (const task of tasks) {
      const newStatus = statusMap[task.status];
      console.log(`  📌 ${task.title}`);
      console.log(`     Antigo: "${task.status}" → Novo: "${newStatus}"`);

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);

      if (updateError) {
        console.error(`     ❌ Erro: ${updateError.message}`);
      } else {
        console.log(`     ✅ Atualizado!\n`);
      }
    }

    console.log('✨ Correção concluída!\n');

    // Verificar resultado
    const { data: updatedTasks, error: verifyError } = await supabase
      .from('tasks')
      .select('status')
      .in('status', ['Criado', 'Em separação', 'Pendencia', 'Em romaneio', 'Entregue']);

    if (verifyError) throw verifyError;

    console.log('📊 Status atuais:');
    const statusCount = {};
    updatedTasks.forEach(t => {
      statusCount[t.status] = (statusCount[t.status] || 0) + 1;
    });
    Object.keys(statusCount).forEach(status => {
      console.log(`   ${status}: ${statusCount[status]}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

fixTaskStatus().then(() => process.exit(0));
