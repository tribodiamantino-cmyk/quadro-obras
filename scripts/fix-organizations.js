require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fixOrganizations() {
  console.log('\n🔧 CORRIGINDO ORGANIZATION_ID DOS PROJETOS...\n');

  // 1. Buscar organizações disponíveis
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, slug');

  if (orgsError || !orgs || orgs.length === 0) {
    console.error('❌ Nenhuma organização encontrada!');
    console.log('   Crie uma organização primeiro.\n');
    return;
  }

  console.log('🏢 Organizações disponíveis:\n');
  orgs.forEach((o, i) => {
    console.log(`   ${i + 1}. ${o.name} (${o.slug})`);
    console.log(`      ID: ${o.id}\n`);
  });

  // Usar a primeira organização (ou você pode escolher)
  const targetOrg = orgs[0];
  console.log(`✅ Usando organização: ${targetOrg.name}\n`);

  // 2. Buscar projetos sem organização
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name')
    .is('organization_id', null);

  if (projectsError) {
    console.error('❌ Erro ao buscar projetos:', projectsError.message);
    return;
  }

  console.log(`📁 Projetos sem organização: ${projects.length}\n`);

  if (projects.length === 0) {
    console.log('✅ Todos os projetos já têm organização!\n');
    return;
  }

  // 3. Atualizar todos os projetos
  console.log('🔄 Atualizando projetos...\n');

  let updated = 0;
  let errors = 0;

  for (const project of projects) {
    const { error } = await supabase
      .from('projects')
      .update({ organization_id: targetOrg.id })
      .eq('id', project.id);

    if (error) {
      console.log(`   ❌ Erro em "${project.name}": ${error.message}`);
      errors++;
    } else {
      console.log(`   ✅ ${project.name}`);
      updated++;
    }
  }

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        ✅ CORREÇÃO CONCLUÍDA!                            ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('📊 RESULTADO:\n');
  console.log(`   ✅ Projetos atualizados: ${updated}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`   🏢 Organização: ${targetOrg.name}\n`);

  console.log('🎯 PRÓXIMO PASSO:\n');
  console.log('   Acesse http://localhost:4000 e faça login!');
  console.log('   Os projetos devem aparecer agora! 🎉\n');
}

fixOrganizations().catch(console.error);
