require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fixOrganizationIds() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        🔧 CORRIGIR ORGANIZATION_ID DAS TAREFAS           ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Buscar todas as tarefas sem organization_id
    console.log('📋 Buscando tarefas sem organization_id...');
    const { data: tasksWithoutOrg, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title, project_id')
      .is('organization_id', null);

    if (fetchError) throw fetchError;

    console.log(`   Encontradas: ${tasksWithoutOrg.length} tarefas\n`);

    if (tasksWithoutOrg.length === 0) {
      console.log('✅ Todas as tarefas já têm organization_id!\n');
      return;
    }

    // 2. Buscar organization_id correto através dos projetos
    console.log('🔍 Buscando organization_id dos projetos...\n');

    let fixed = 0;
    let errors = [];

    for (const task of tasksWithoutOrg) {
      try {
        // Buscar projeto da tarefa
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('id, name, organization_id')
          .eq('id', task.project_id)
          .single();

        if (projectError || !project) {
          console.log(`⚠️  Projeto não encontrado para tarefa "${task.title}" (${task.id})`);
          errors.push({ task: task.title, error: 'Projeto não encontrado' });
          continue;
        }

        if (!project.organization_id) {
          console.log(`⚠️  Projeto "${project.name}" também está sem organization_id!`);
          errors.push({ task: task.title, error: 'Projeto sem organization_id' });
          continue;
        }

        // Atualizar tarefa com organization_id correto
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ organization_id: project.organization_id })
          .eq('id', task.id);

        if (updateError) {
          console.log(`❌ Erro ao atualizar "${task.title}": ${updateError.message}`);
          errors.push({ task: task.title, error: updateError.message });
          continue;
        }

        fixed++;
        
        if (fixed % 10 === 0) {
          console.log(`   ✅ ${fixed} tarefas atualizadas...`);
        }

      } catch (err) {
        console.log(`❌ Erro ao processar "${task.title}": ${err.message}`);
        errors.push({ task: task.title, error: err.message });
      }
    }

    // Resultado
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║        ✅ CORREÇÃO CONCLUÍDA!                            ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('📊 ESTATÍSTICAS:\n');
    console.log(`   • Tarefas corrigidas: ${fixed}`);
    console.log(`   • Tarefas com erro: ${errors.length}`);
    console.log(`   • Total processado: ${tasksWithoutOrg.length}\n`);

    if (errors.length > 0) {
      console.log('⚠️  ERROS:\n');
      errors.slice(0, 10).forEach((err, index) => {
        console.log(`   ${index + 1}. "${err.task}"`);
        console.log(`      ${err.error}\n`);
      });
      if (errors.length > 10) {
        console.log(`   ... e mais ${errors.length - 10} erros\n`);
      }
    }

    // Verificar resultado
    console.log('🔍 Verificando resultado...\n');
    const { data: stillWithoutOrg } = await supabase
      .from('tasks')
      .select('id')
      .is('organization_id', null);

    if (stillWithoutOrg && stillWithoutOrg.length > 0) {
      console.log(`⚠️  Ainda restam ${stillWithoutOrg.length} tarefas sem organization_id\n`);
    } else {
      console.log('🎉 SUCESSO! Todas as tarefas agora têm organization_id!\n');
    }

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixOrganizationIds();
