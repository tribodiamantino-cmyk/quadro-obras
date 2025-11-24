require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fixDisplayOrder() {
  console.log('\n🔧 Corrigindo display_order de TODAS as tarefas...\n');

  try {
    // Buscar todos os projetos
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name');

    if (projectsError) throw projectsError;

    console.log(`📊 Processando ${projects.length} projetos...\n`);

    let totalFixed = 0;

    for (const project of projects) {
      // Buscar tarefas do projeto agrupadas por status
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, status, display_order')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (tasksError) {
        console.error(`❌ Erro no projeto ${project.name}:`, tasksError.message);
        continue;
      }

      if (!tasks || tasks.length === 0) continue;

      // Agrupar por status
      const byStatus = {};
      tasks.forEach(task => {
        const status = task.status || 'Criado';
        if (!byStatus[status]) byStatus[status] = [];
        byStatus[status].push(task);
      });

      // Atualizar display_order para cada status
      for (const [status, statusTasks] of Object.entries(byStatus)) {
        for (let i = 0; i < statusTasks.length; i++) {
          const task = statusTasks[i];
          
          // Só atualizar se display_order for NULL ou diferente do índice
          if (task.display_order === null || task.display_order !== i) {
            const { error: updateError } = await supabase
              .from('tasks')
              .update({ display_order: i })
              .eq('id', task.id);

            if (updateError) {
              console.error(`   ❌ Erro em "${task.title}":`, updateError.message);
            } else {
              totalFixed++;
            }
          }
        }
      }

      if (tasks.length > 0) {
        console.log(`✅ ${project.name}: ${tasks.length} tarefa(s) processadas`);
      }
    }

    console.log(`\n╔═══════════════════════════════════════════════════════════╗`);
    console.log(`║                                                           ║`);
    console.log(`║        ✅ DISPLAY_ORDER CORRIGIDO!                       ║`);
    console.log(`║                                                           ║`);
    console.log(`╚═══════════════════════════════════════════════════════════╝\n`);

    console.log(`📊 Total de tarefas atualizadas: ${totalFixed}\n`);

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixDisplayOrder();
