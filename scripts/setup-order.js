require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addOrderFields() {
  console.log('🔄 Adicionando campos de ordenação...\n');

  try {
    // Tentar selecionar com display_order para ver se já existe
    console.log('📊 Verificando se campos já existem...');
    
    const { data: projectTest, error: projectTestError } = await supabase
      .from('projects')
      .select('display_order')
      .limit(1);
    
    if (!projectTestError && projectTest !== null) {
      console.log('✅ Campo display_order já existe em projects!');
    } else {
      console.log('⚠️  Campo display_order não existe em projects');
      console.log('   Execute manualmente no Supabase SQL Editor:');
      console.log('   ALTER TABLE projects ADD COLUMN display_order INTEGER DEFAULT 0;');
    }

    const { data: taskTest, error: taskTestError } = await supabase
      .from('tasks')
      .select('display_order')
      .limit(1);
    
    if (!taskTestError && taskTest !== null) {
      console.log('✅ Campo display_order já existe em tasks!');
    } else {
      console.log('⚠️  Campo display_order não existe em tasks');
      console.log('   Execute manualmente no Supabase SQL Editor:');
      console.log('   ALTER TABLE tasks ADD COLUMN display_order INTEGER DEFAULT 0;');
    }

    // Atualizar ordens existentes
    console.log('\n🔄 Atualizando ordens dos projetos existentes...');
    
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, created_at, organization_id')
      .order('organization_id')
      .order('created_at');
    
    if (projectsError) {
      console.log('❌ Erro ao buscar projetos:', projectsError.message);
    } else {
      console.log(`📦 Encontrados ${projects.length} projetos`);
      
      // Agrupar por organização
      const byOrg = {};
      projects.forEach(p => {
        if (!byOrg[p.organization_id]) byOrg[p.organization_id] = [];
        byOrg[p.organization_id].push(p);
      });
      
      // Atualizar ordem
      for (const orgId in byOrg) {
        const orgProjects = byOrg[orgId];
        console.log(`  Organização ${orgId}: ${orgProjects.length} projetos`);
        
        for (let i = 0; i < orgProjects.length; i++) {
          const { error } = await supabase
            .from('projects')
            .update({ display_order: i })
            .eq('id', orgProjects[i].id);
          
          if (error) {
            console.log(`    ❌ Erro ao atualizar ${orgProjects[i].id}:`, error.message);
          }
        }
      }
      console.log('  ✅ Ordens dos projetos atualizadas!');
    }

    // Atualizar ordens das tarefas
    console.log('\n🔄 Atualizando ordens das tarefas existentes...');
    
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, status, project_id, created_at')
      .order('project_id')
      .order('status')
      .order('created_at');
    
    if (tasksError) {
      console.log('❌ Erro ao buscar tarefas:', tasksError.message);
    } else {
      console.log(`📋 Encontradas ${tasks.length} tarefas`);
      
      // Agrupar por projeto e status
      const byProjectStatus = {};
      tasks.forEach(t => {
        const key = `${t.project_id}_${t.status}`;
        if (!byProjectStatus[key]) byProjectStatus[key] = [];
        byProjectStatus[key].push(t);
      });
      
      // Atualizar ordem
      for (const key in byProjectStatus) {
        const groupTasks = byProjectStatus[key];
        
        for (let i = 0; i < groupTasks.length; i++) {
          const { error } = await supabase
            .from('tasks')
            .update({ display_order: i })
            .eq('id', groupTasks[i].id);
          
          if (error) {
            console.log(`    ❌ Erro ao atualizar ${groupTasks[i].id}:`, error.message);
          }
        }
      }
      console.log('  ✅ Ordens das tarefas atualizadas!');
    }

    console.log('\n✅ Processo concluído!');
    console.log('\n📝 IMPORTANTE:');
    console.log('   Se os campos display_order não existirem, execute no Supabase SQL Editor:');
    console.log('   ');
    console.log('   ALTER TABLE projects ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;');
    console.log('   ALTER TABLE tasks ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;');
    console.log('   CREATE INDEX IF NOT EXISTS idx_projects_order ON projects(organization_id, display_order);');
    console.log('   CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(project_id, status, display_order);');
    
  } catch (error) {
    console.error('\n❌ Erro:', error);
  }
}

addOrderFields();
