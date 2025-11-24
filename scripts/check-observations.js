require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkObservations() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        🔍 DIAGNÓSTICO DE OBSERVAÇÕES                     ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Buscar todos os projetos
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, details_text, details_checklist')
      .order('name');

    if (error) {
      throw error;
    }

    console.log(`📊 Total de projetos: ${projects.length}\n`);

    let stats = {
      withDetailsText: 0,
      withDetailsChecklist: 0,
      withBoth: 0,
      empty: 0
    };

    console.log('📋 ANÁLISE POR PROJETO:\n');

    projects.forEach(p => {
      const hasText = p.details_text && p.details_text.trim();
      const hasChecklist = p.details_checklist && Array.isArray(p.details_checklist) && p.details_checklist.length > 0;

      let status = '❌ VAZIO';
      
      if (hasText && hasChecklist) {
        status = '✅ COMPLETO (texto + checklist)';
        stats.withBoth++;
      } else if (hasText) {
        status = '📝 Apenas texto';
        stats.withDetailsText++;
      } else if (hasChecklist) {
        status = '☑️  Apenas checklist';
        stats.withDetailsChecklist++;
      } else {
        stats.empty++;
      }

      console.log(`${status} - ${p.name}`);
      
      if (hasText) {
        const preview = p.details_text.substring(0, 80);
        console.log(`   "${preview}${p.details_text.length > 80 ? '...' : ''}"`);
      }
      
      if (hasChecklist) {
        console.log(`   Checklist: ${p.details_checklist.length} item(s)`);
        p.details_checklist.slice(0, 3).forEach(item => {
          console.log(`      ${item.checked ? '☑' : '☐'} ${item.text}`);
        });
        if (p.details_checklist.length > 3) {
          console.log(`      ... e mais ${p.details_checklist.length - 3} item(s)`);
        }
      }
      
      console.log('');
    });

    // Resumo
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║        📊 RESUMO                                         ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log(`Total de projetos: ${projects.length}\n`);
    console.log(`✅ Com texto E checklist: ${stats.withBoth}`);
    console.log(`📝 Apenas com texto: ${stats.withDetailsText}`);
    console.log(`☑️  Apenas com checklist: ${stats.withDetailsChecklist}`);
    console.log(`❌ Vazios (SEM observações): ${stats.empty}\n`);

    if (stats.empty > 0) {
      console.log('⚠️  ATENÇÃO!\n');
      console.log(`   ${stats.empty} projeto(s) estão SEM observações/checklist!`);
      console.log(`   Se isso não está correto, você precisa importar os dados.\n`);
      console.log('   Passos:\n');
      console.log('   1. Localize o arquivo de backup (dados-antigos.json ou db.json)');
      console.log('   2. Coloque na raiz do projeto como "dados-antigos.json"');
      console.log('   3. Execute: node scripts/import-missing-observations.js\n');
    } else {
      console.log('🎉 Todos os projetos têm observações!\n');
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
checkObservations().catch(console.error);
