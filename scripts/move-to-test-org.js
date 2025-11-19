require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function moveToTestOrg() {
  console.log('\n🔄 MOVENDO PROJETOS PARA ORGANIZAÇÃO "teste"...\n');

  // 1. Buscar organização "teste"
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', 'teste')
    .single();

  if (!orgs) {
    console.error('❌ Organização "teste" não encontrada!');
    return;
  }

  console.log(`🏢 Organização destino: ${orgs.name}`);
  console.log(`   ID: ${orgs.id}\n`);

  // 2. Buscar projetos na organização "Minha Construtora"
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, organization_id')
    .neq('organization_id', orgs.id);

  console.log(`📁 Projetos a mover: ${projects.length}\n`);

  if (projects.length === 0) {
    console.log('✅ Todos os projetos já estão na organização "teste"!\n');
    return;
  }

  // 3. Mover projetos
  console.log('🔄 Movendo projetos...\n');

  let moved = 0;
  for (const project of projects) {
    const { error } = await supabase
      .from('projects')
      .update({ organization_id: orgs.id })
      .eq('id', project.id);

    if (error) {
      console.log(`   ❌ Erro em "${project.name}": ${error.message}`);
    } else {
      console.log(`   ✅ ${project.name}`);
      moved++;
    }
  }

  // 4. Mover loja e status também
  console.log('\n🏪 Movendo loja "IMPORTADO"...');
  const { error: storeError } = await supabase
    .from('stores')
    .update({ organization_id: orgs.id })
    .eq('name', 'IMPORTADO');

  if (storeError) {
    console.log(`   ❌ Erro: ${storeError.message}`);
  } else {
    console.log('   ✅ Loja movida');
  }

  console.log('\n📊 Movendo status "IMPORTADO"...');
  const { error: statusError } = await supabase
    .from('work_statuses')
    .update({ organization_id: orgs.id })
    .eq('name', 'IMPORTADO');

  if (statusError) {
    console.log(`   ❌ Erro: ${statusError.message}`);
  } else {
    console.log('   ✅ Status movido');
  }

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        ✅ MIGRAÇÃO CONCLUÍDA!                            ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('📊 RESULTADO:\n');
  console.log(`   ✅ Projetos movidos: ${moved}`);
  console.log(`   🏢 Para organização: ${orgs.name}\n`);

  console.log('🎯 AGORA:\n');
  console.log('   1. Faça login com: teste@teste.com');
  console.log('   2. Acesse: http://localhost:4000');
  console.log('   3. Os projetos devem aparecer! 🎉\n');
}

moveToTestOrg().catch(console.error);
