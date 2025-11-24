require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function importObservations() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        📝 IMPORTAR OBSERVAÇÕES FALTANTES                 ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Ler arquivo de dados antigos
    const dataPath = path.join(__dirname, '..', 'dados-antigos.json');
    console.log('📂 Lendo arquivo:', dataPath);
    
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Arquivo dados-antigos.json não encontrado!');
      console.log('\nVocê precisa ter o arquivo dados-antigos.json na raiz do projeto.');
      return;
    }
    
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const oldData = JSON.parse(rawData);
    
    console.log(`\n📊 Projetos encontrados: ${oldData.projects.length}\n`);

    // Estatísticas
    let stats = {
      projectsUpdated: 0,
      projectsSkipped: 0,
      projectsNotFound: 0,
      errors: []
    };

    console.log('🔄 Processando observações...\n');

    for (const oldProject of oldData.projects) {
      try {
        const projectName = oldProject.name;
        
        // Buscar projeto no Supabase pelo nome
        const { data: project, error: findError } = await supabase
          .from('projects')
          .select('id, name, details_text, details_checklist')
          .eq('name', projectName)
          .single();

        if (findError || !project) {
          console.log(`❌ Projeto não encontrado: "${projectName}"`);
          stats.projectsNotFound++;
          continue;
        }

        // Verificar se há observações/detalhes no projeto antigo
        const hasDetailsText = oldProject.detailsText && oldProject.detailsText.trim();
        const hasDetailsChecklist = oldProject.detailsChecklist && oldProject.detailsChecklist.length > 0;
        
        // Também verificar campo "details" alternativo
        const hasDetails = oldProject.details && 
                          (typeof oldProject.details === 'string' && oldProject.details.trim()) ||
                          (Array.isArray(oldProject.details) && oldProject.details.length > 0);

        if (!hasDetailsText && !hasDetailsChecklist && !hasDetails) {
          console.log(`⏭️  Sem observações: "${projectName}"`);
          stats.projectsSkipped++;
          continue;
        }

        // Preparar dados para atualizar
        const updateData = {};
        
        // Campo de texto (observações)
        if (hasDetailsText) {
          updateData.details_text = oldProject.detailsText;
        } else if (hasDetails && typeof oldProject.details === 'string') {
          updateData.details_text = oldProject.details;
        }
        
        // Checklist
        if (hasDetailsChecklist) {
          updateData.details_checklist = oldProject.detailsChecklist;
        } else if (hasDetails && Array.isArray(oldProject.details)) {
          updateData.details_checklist = oldProject.details;
        }

        // Atualizar projeto
        const { error: updateError } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', project.id);

        if (updateError) {
          throw updateError;
        }

        console.log(`✅ "${projectName}"`);
        if (updateData.details_text) {
          const preview = updateData.details_text.substring(0, 60);
          console.log(`   📝 Observações: "${preview}${updateData.details_text.length > 60 ? '...' : ''}"`);
        }
        if (updateData.details_checklist) {
          console.log(`   ☑️  Checklist: ${updateData.details_checklist.length} item(s)`);
        }
        console.log('');

        stats.projectsUpdated++;

      } catch (error) {
        console.log(`❌ Erro em "${oldProject.name}": ${error.message}\n`);
        stats.errors.push({
          project: oldProject.name,
          error: error.message
        });
      }
    }

    // Resultado
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║        ✅ IMPORTAÇÃO DE OBSERVAÇÕES CONCLUÍDA!           ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('📊 ESTATÍSTICAS:\n');
    console.log(`   • Projetos atualizados: ${stats.projectsUpdated}`);
    console.log(`   • Projetos sem observações: ${stats.projectsSkipped}`);
    console.log(`   • Projetos não encontrados: ${stats.projectsNotFound}`);
    
    if (stats.errors.length > 0) {
      console.log(`   • Erros: ${stats.errors.length}\n`);
      console.log('   Detalhes dos erros:\n');
      stats.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.project}`);
        console.log(`      ${err.error}\n`);
      });
    } else {
      console.log('   • Erros: 0\n');
    }

    // Salvar log
    const logPath = path.join(__dirname, '..', 'backup', `observations-import-${new Date().toISOString().replace(/:/g, '-')}.json`);
    fs.writeFileSync(logPath, JSON.stringify(stats, null, 2));
    console.log(`💾 Log salvo em: ${logPath}\n`);

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
importObservations().catch(console.error);
