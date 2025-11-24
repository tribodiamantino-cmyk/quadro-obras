require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkJangadaBrunaTasks() {
  console.log('\n🔍 Verificando tarefas da "Jangada Bruna Av5"...\n');

  try {
    // Buscar projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .ilike('name', '%Jangada Bruna%AV5%')
      .single();

    if (projectError || !project) {
      console.log('❌ Projeto não encontrado. Tentando busca mais ampla...\n');
      
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .ilike('name', '%Jangada%Bruna%');
      
      console.log('📋 Projetos Jangada Bruna encontrados:\n');
      projects.forEach(p => console.log(`   • ${p.name} (${p.id})`));
      
      return;
    }

    console.log(`✅ Projeto: ${project.name}`);
    console.log(`   ID: ${project.id}\n`);

    // Buscar TODAS as tarefas (inclusive deletadas se houver campo)
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: true });

    if (tasksError) throw tasksError;

    console.log(`📊 Total de tarefas: ${tasks.length}\n`);

    if (tasks.length === 0) {
      console.log('⚠️  NENHUMA TAREFA ENCONTRADA!\n');
      return;
    }

    // Agrupar por status
    const byStatus = {};
    tasks.forEach(task => {
      const status = task.status || 'SEM STATUS';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(task);
    });

    console.log('📋 TAREFAS POR STATUS:\n');
    Object.entries(byStatus).forEach(([status, statusTasks]) => {
      console.log(`\n${status} (${statusTasks.length} tarefa(s)):`);
      console.log('─'.repeat(60));
      statusTasks.forEach(task => {
        console.log(`   • ${task.title}`);
        console.log(`     ID: ${task.id}`);
        console.log(`     Criada: ${new Date(task.created_at).toLocaleString('pt-BR')}`);
        console.log(`     Atualizada: ${new Date(task.updated_at).toLocaleString('pt-BR')}`);
        console.log(`     Order: ${task.display_order || 'NULL'}`);
        console.log('');
      });
    });

    // Verificar duplicatas
    const titles = tasks.map(t => t.title);
    const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  TAREFAS DUPLICADAS:\n');
      const uniqueDuplicates = [...new Set(duplicates)];
      uniqueDuplicates.forEach(title => {
        const duplicateTasks = tasks.filter(t => t.title === title);
        console.log(`   "${title}" (${duplicateTasks.length}x):`);
        duplicateTasks.forEach(t => {
          console.log(`      - ID: ${t.id}, Status: ${t.status}`);
        });
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkJangadaBrunaTasks();
