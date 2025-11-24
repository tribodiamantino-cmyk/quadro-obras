require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkDuplicates() {
  console.log('\n🔍 Verificando tarefas duplicadas...\n');

  try {
    // Buscar todas as tarefas
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, status, project_id, organization_id');

    if (error) throw error;

    console.log(`📊 Total de tarefas: ${tasks.length}\n`);

    // Agrupar por ID
    const groupedById = {};
    tasks.forEach(task => {
      if (!groupedById[task.id]) {
        groupedById[task.id] = [];
      }
      groupedById[task.id].push(task);
    });

    // Encontrar duplicatas
    const duplicates = Object.entries(groupedById).filter(([id, tasks]) => tasks.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ Nenhuma tarefa duplicada encontrada!\n');
    } else {
      console.log(`⚠️  ENCONTRADAS ${duplicates.length} TAREFAS COM ID DUPLICADO:\n`);
      
      duplicates.forEach(([id, tasks]) => {
        console.log(`❌ ID: ${id} (${tasks.length} ocorrências)`);
        tasks.forEach((task, index) => {
          console.log(`   ${index + 1}. "${task.title}" - ${task.status}`);
          console.log(`      Projeto: ${task.project_id}`);
          console.log(`      Org: ${task.organization_id || 'NULL'}`);
        });
        console.log('');
      });

      console.log('\n🔧 SOLUÇÃO: Remover duplicatas ou regenerar IDs únicos\n');
    }

    // Verificar tarefas sem organization_id
    const withoutOrg = tasks.filter(t => !t.organization_id);
    
    if (withoutOrg.length > 0) {
      console.log(`⚠️  ${withoutOrg.length} tarefas SEM organization_id:\n`);
      withoutOrg.slice(0, 10).forEach(t => {
        console.log(`   • "${t.title}" (${t.id})`);
      });
      if (withoutOrg.length > 10) {
        console.log(`   ... e mais ${withoutOrg.length - 10} tarefas\n`);
      }
      console.log('\n🔧 SOLUÇÃO: Associar tarefas à organização correta\n');
    } else {
      console.log('✅ Todas as tarefas têm organization_id!\n');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkDuplicates();
