require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function setupImportedTags() {
  console.log('\n🏷️  CRIANDO TAGS PARA DADOS IMPORTADOS...\n');

  // 1. Buscar organização
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.error('❌ Nenhuma organização encontrada!');
    return;
  }

  const orgId = orgs[0].id;
  console.log(`🏢 Organização: ${orgs[0].name}\n`);

  // 2. Criar loja "IMPORTADO"
  console.log('🏪 Criando loja "IMPORTADO"...');
  
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .insert({
      name: 'IMPORTADO',
      code: 'IMP',
      color: '#95a5a6',
      active: true,
      organization_id: orgId
    })
    .select()
    .single();

  if (storeError) {
    if (storeError.code === '23505') {
      console.log('   ⚠️  Loja "IMPORTADO" já existe, buscando...');
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id, name')
        .eq('name', 'IMPORTADO')
        .single();
      
      if (existingStore) {
        console.log(`   ✅ Usando loja existente: ${existingStore.name}\n`);
        var storeId = existingStore.id;
      }
    } else {
      console.error('   ❌ Erro ao criar loja:', storeError.message);
      return;
    }
  } else {
    console.log(`   ✅ Loja criada: ${store.name} (${store.code})\n`);
    var storeId = store.id;
  }

  // 3. Criar status "IMPORTADO"
  console.log('📊 Criando status "IMPORTADO"...');
  
  const { data: status, error: statusError } = await supabase
    .from('work_statuses')
    .insert({
      name: 'IMPORTADO',
      color: '#95a5a6',
      order_position: 0,
      active: true,
      organization_id: orgId
    })
    .select()
    .single();

  if (statusError) {
    if (statusError.code === '23505') {
      console.log('   ⚠️  Status "IMPORTADO" já existe, buscando...');
      const { data: existingStatus } = await supabase
        .from('work_statuses')
        .select('id, name')
        .eq('name', 'IMPORTADO')
        .single();
      
      if (existingStatus) {
        console.log(`   ✅ Usando status existente: ${existingStatus.name}\n`);
        var statusId = existingStatus.id;
      }
    } else {
      console.error('   ❌ Erro ao criar status:', statusError.message);
      return;
    }
  } else {
    console.log(`   ✅ Status criado: ${status.name}\n`);
    var statusId = status.id;
  }

  // 4. Buscar projetos importados (sem store_id e work_status_id)
  console.log('📁 Buscando projetos importados...');
  
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name')
    .is('store_id', null)
    .is('work_status_id', null);

  if (projectsError) {
    console.error('❌ Erro ao buscar projetos:', projectsError.message);
    return;
  }

  console.log(`   Encontrados: ${projects.length} projetos\n`);

  if (projects.length === 0) {
    console.log('✅ Todos os projetos já têm loja e status!\n');
    return;
  }

  // 5. Atualizar projetos
  console.log('🔄 Atualizando projetos com loja e status "IMPORTADO"...\n');

  let updated = 0;
  let errors = 0;

  for (const project of projects) {
    const { error } = await supabase
      .from('projects')
      .update({
        store_id: storeId,
        work_status_id: statusId
      })
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
  console.log('║        ✅ MARCAÇÃO CONCLUÍDA!                            ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('📊 RESULTADO:\n');
  console.log(`   ✅ Projetos atualizados: ${updated}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`   🏪 Loja: IMPORTADO`);
  console.log(`   📊 Status: IMPORTADO\n`);

  console.log('💡 COMO USAR:\n');
  console.log('   1. Os projetos importados agora aparecem com loja "IMPORTADO"');
  console.log('   2. E status "IMPORTADO" para fácil identificação');
  console.log('   3. Depois de organizar, você pode:');
  console.log('      - Alterar loja e status de cada projeto');
  console.log('      - Ou deletar a loja/status "IMPORTADO"\n');

  console.log('🎯 PRÓXIMO PASSO:\n');
  console.log('   Acesse http://localhost:4000');
  console.log('   Agora os projetos devem aparecer! 🎉\n');
}

setupImportedTags().catch(console.error);
