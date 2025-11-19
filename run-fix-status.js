// Script para executar SQL de correção de status
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis SUPABASE_URL e SUPABASE_KEY não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  console.log('🔧 Executando correção de status...\n');

  try {
    // Passo 1: Remover constraint antiga
    console.log('1️⃣ Removendo constraint antiga...');
    const { error: drop1 } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;'
    });
    if (drop1) {
      console.log('   ⚠️ Tentativa 1 falhou, tentando método alternativo...');
      // Tentar via update direto
    } else {
      console.log('   ✅ Constraint removida!\n');
    }

    // Passo 2: Atualizar tarefas
    console.log('2️⃣ Atualizando status das tarefas...');
    
    // backlog -> Criado
    const { data: r1, error: e1 } = await supabase
      .from('tasks')
      .update({ status: 'Criado' })
      .eq('status', 'backlog')
      .select();
    console.log(`   📌 backlog → Criado: ${r1?.length || 0} tarefas`);

    // doing -> Em separação  
    const { data: r2, error: e2 } = await supabase
      .from('tasks')
      .update({ status: 'Em separação' })
      .eq('status', 'doing')
      .select();
    console.log(`   📌 doing → Em separação: ${r2?.length || 0} tarefas`);

    // done -> Entregue
    const { data: r3, error: e3 } = await supabase
      .from('tasks')
      .update({ status: 'Entregue' })
      .eq('status', 'done')
      .select();
    console.log(`   📌 done → Entregue: ${r3?.length || 0} tarefas\n`);

    if (e1 || e2 || e3) {
      console.error('❌ Erros durante atualização:', { e1, e2, e3 });
      console.log('\n⚠️ EXECUTE MANUALMENTE no Supabase SQL Editor:');
      console.log('---');
      console.log('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;');
      console.log("UPDATE tasks SET status = 'Criado' WHERE status = 'backlog';");
      console.log("UPDATE tasks SET status = 'Em separação' WHERE status = 'doing';");
      console.log("UPDATE tasks SET status = 'Entregue' WHERE status = 'done';");
      console.log("ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK (status IN ('Criado', 'Em separação', 'Pendencia', 'Em romaneio', 'Entregue'));");
      console.log('---\n');
    } else {
      console.log('✅ Status atualizados com sucesso!\n');
    }

    // Verificar resultado
    console.log('3️⃣ Verificando resultado...');
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status');

    const counts = {};
    tasks?.forEach(t => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });

    console.log('📊 Status atuais:');
    Object.keys(counts).forEach(s => {
      console.log(`   ${s}: ${counts[s]}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    console.log('\n⚠️ EXECUTE MANUALMENTE no Supabase SQL Editor o arquivo: fix-status-constraint.sql');
  }
}

runSQL().then(() => {
  console.log('\n✨ Concluído! Recarregue a página do navegador.\n');
  process.exit(0);
});
