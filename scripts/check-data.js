require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkData() {
  console.log('\n🔍 VERIFICANDO DADOS NO SUPABASE...\n');

  // Verificar projetos
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, organization_id')
    .limit(50);

  if (projectsError) {
    console.error('❌ Erro ao buscar projetos:', projectsError.message);
  } else {
    console.log(`📁 PROJETOS: ${projects.length} encontrados\n`);
    projects.slice(0, 10).forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name}`);
      console.log(`      ID: ${p.id}`);
      console.log(`      Org: ${p.organization_id || 'sem organização'}\n`);
    });
    if (projects.length > 10) {
      console.log(`   ... e mais ${projects.length - 10} projetos\n`);
    }
  }

  // Verificar tarefas
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, status, project_id')
    .limit(20);

  if (tasksError) {
    console.error('❌ Erro ao buscar tarefas:', tasksError.message);
  } else {
    console.log(`\n📋 TAREFAS: ${tasks.length} encontradas\n`);
    tasks.slice(0, 10).forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.title}`);
      console.log(`      Status: ${t.status}`);
      console.log(`      Projeto ID: ${t.project_id}\n`);
    });
    if (tasks.length > 10) {
      console.log(`   ... e mais ${tasks.length - 10} tarefas\n`);
    }
  }

  // Verificar organizations
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, slug');

  if (orgsError) {
    console.error('❌ Erro ao buscar organizações:', orgsError.message);
  } else {
    console.log(`\n🏢 ORGANIZAÇÕES: ${orgs.length} encontradas\n`);
    orgs.forEach((o, i) => {
      console.log(`   ${i + 1}. ${o.name} (${o.slug})`);
      console.log(`      ID: ${o.id}\n`);
    });
  }

  // Diagnóstico
  console.log('\n🔍 DIAGNÓSTICO:\n');
  
  if (projects.length > 0 && projects[0].organization_id === null) {
    console.log('⚠️  PROBLEMA ENCONTRADO!');
    console.log('   Os projetos não têm organization_id!');
    console.log('   O sistema provavelmente filtra por organização.\n');
    console.log('💡 SOLUÇÃO:');
    console.log('   Precisamos associar os projetos a uma organização.\n');
  } else if (projects.length === 0) {
    console.log('❌ Nenhum projeto encontrado!');
    console.log('   A importação pode não ter funcionado.\n');
  } else {
    console.log('✅ Dados parecem estar OK!');
    console.log('   Verifique se você está logado com o usuário correto.\n');
  }
}

checkData();
