require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Função para converter data BR para ISO
function convertDateBR(dateBR) {
  if (!dateBR) return null;
  
  // Formato: "24/09/2025 14:39"
  const [datePart, timePart] = dateBR.split(' ');
  const [day, month, year] = datePart.split('/');
  const [hours, minutes] = (timePart || '00:00').split(':');
  
  return new Date(year, month - 1, day, hours, minutes).toISOString();
}

// Mapeamento de status antigos para novos
const statusMap = {
  'Criado': 'Criado',
  'Para separação': 'Criado',
  'Em separação': 'Em separação',
  'Pendencia': 'Pendencia',
  'Em romaneio': 'Em romaneio',
  'Entregue': 'Entregue',
  'Concluído': 'Entregue',
  'Cancelado': 'Pendencia'
};

function mapStatus(oldStatus) {
  return statusMap[oldStatus] || 'Criado';
}

async function importData() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║        🔄 IMPORTAÇÃO DE DADOS ANTIGOS                    ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Ler arquivo de dados antigos
    const dataPath = path.join(__dirname, '..', 'dados-antigos.json');
    console.log('📂 Lendo arquivo:', dataPath);
    
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const oldData = JSON.parse(rawData);
    
    console.log(`\n📊 Dados encontrados:`);
    console.log(`   • Projetos: ${oldData.projects.length}`);
    
    let totalTasks = 0;
    oldData.projects.forEach(p => {
      totalTasks += p.tasks.length;
    });
    console.log(`   • Tarefas: ${totalTasks}\n`);

    // Confirmar importação
    console.log('⚠️  ATENÇÃO: Esta operação vai importar dados antigos!');
    console.log('   Certifique-se de ter feito backup antes.\n');

    // Buscar usuário admin para associar projetos
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .ilike('role', 'admin')
      .limit(1);
    
    if (!users || users.length === 0) {
      console.error('❌ Erro: Nenhum usuário admin encontrado!');
      console.log('   Crie um usuário admin primeiro.\n');
      return;
    }

    const adminId = users[0].id;
    console.log(`✅ Usuário admin encontrado: ${adminId}\n`);

    // Estatísticas
    let stats = {
      projectsImported: 0,
      projectsSkipped: 0,
      tasksImported: 0,
      tasksSkipped: 0,
      errors: []
    };

    // Importar projetos e tarefas
    console.log('🔄 Iniciando importação...\n');

    for (const oldProject of oldData.projects) {
      try {
        console.log(`📁 Projeto: ${oldProject.name}`);

        // Verificar se projeto já existe
        const { data: existingProject } = await supabase
          .from('projects')
          .select('id, name')
          .eq('name', oldProject.name)
          .single();

        let projectId;

        if (existingProject) {
          console.log(`   ⚠️  Projeto já existe, usando ID: ${existingProject.id}`);
          projectId = existingProject.id;
          stats.projectsSkipped++;
        } else {
          // Criar novo projeto
          const { data: newProject, error: projectError } = await supabase
            .from('projects')
            .insert({
              name: oldProject.name
            })
            .select()
            .single();

          if (projectError) {
            throw projectError;
          }

          projectId = newProject.id;
          console.log(`   ✅ Projeto criado: ${projectId}`);
          stats.projectsImported++;
        }

        // Importar tarefas do projeto
        if (oldProject.tasks && oldProject.tasks.length > 0) {
          console.log(`   📋 Importando ${oldProject.tasks.length} tarefas...`);

          for (const oldTask of oldProject.tasks) {
            try {
              // Verificar se tarefa já existe
              const { data: existingTask } = await supabase
                .from('tasks')
                .select('id')
                .eq('project_id', projectId)
                .eq('title', oldTask.title)
                .single();

              if (existingTask) {
                console.log(`      ⚠️  Tarefa já existe: "${oldTask.title}"`);
                stats.tasksSkipped++;
                continue;
              }

              // Preparar dados da tarefa
              const taskData = {
                id: oldTask.id, // Usar ID original
                project_id: projectId,
                title: oldTask.title,
                status: mapStatus(oldTask.status), // Mapear status antigo para novo
                created_at: convertDateBR(oldTask.created) || new Date().toISOString()
              };

              // Inserir tarefa
              const { data: newTask, error: taskError } = await supabase
                .from('tasks')
                .insert(taskData)
                .select()
                .single();

              if (taskError) {
                throw taskError;
              }

              stats.tasksImported++;

              // Importar histórico se existir
              if (oldTask.history && oldTask.history.length > 0) {
                const historyRecords = oldTask.history.map(h => ({
                  task_id: newTask.id,
                  user_id: adminId,
                  action: 'update',
                  entity_type: 'task',
                  entity_id: newTask.id,
                  old_value: h.from,
                  new_value: h.to,
                  created_at: convertDateBR(h.at) || new Date().toISOString()
                }));

                const { error: historyError } = await supabase
                  .from('audit_logs')
                  .insert(historyRecords);

                if (historyError) {
                  console.log(`      ⚠️  Erro ao importar histórico: ${historyError.message}`);
                }
              }

              console.log(`      ✅ "${oldTask.title}" → ${taskData.status}`);

            } catch (taskError) {
              console.log(`      ❌ Erro na tarefa "${oldTask.title}": ${taskError.message}`);
              stats.errors.push({
                type: 'task',
                project: oldProject.name,
                task: oldTask.title,
                error: taskError.message
              });
            }
          }
        }

        console.log(''); // Linha em branco

      } catch (projectError) {
        console.log(`   ❌ Erro no projeto "${oldProject.name}": ${projectError.message}\n`);
        stats.errors.push({
          type: 'project',
          project: oldProject.name,
          error: projectError.message
        });
      }
    }

    // Exibir resultado
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║        ✅ IMPORTAÇÃO CONCLUÍDA!                          ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('📊 ESTATÍSTICAS:\n');
    console.log(`   Projetos:`);
    console.log(`      • Importados: ${stats.projectsImported}`);
    console.log(`      • Já existiam: ${stats.projectsSkipped}`);
    console.log(`      • Total processado: ${stats.projectsImported + stats.projectsSkipped}\n`);
    
    console.log(`   Tarefas:`);
    console.log(`      • Importadas: ${stats.tasksImported}`);
    console.log(`      • Já existiam: ${stats.tasksSkipped}`);
    console.log(`      • Total processado: ${stats.tasksImported + stats.tasksSkipped}\n`);

    if (stats.errors.length > 0) {
      console.log(`   ⚠️  Erros: ${stats.errors.length}\n`);
      console.log('   Detalhes dos erros:\n');
      stats.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.type}: ${err.project}${err.task ? ` / ${err.task}` : ''}`);
        console.log(`      ${err.error}\n`);
      });
    } else {
      console.log('   ✅ Nenhum erro!\n');
    }

    // Salvar log de importação
    const logPath = path.join(__dirname, '..', 'backup', `import-log-${new Date().toISOString().replace(/:/g, '-')}.json`);
    fs.writeFileSync(logPath, JSON.stringify(stats, null, 2));
    console.log(`💾 Log salvo em: ${logPath}\n`);

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
importData().catch(console.error);
