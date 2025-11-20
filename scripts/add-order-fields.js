require('dotenv').config();
const supabase = require('./src/config/supabase');
const fs = require('fs');

async function applyOrderMigration() {
  console.log('🔄 Aplicando migração de ordenação...\n');

  try {
    // Ler o SQL
    const sql = fs.readFileSync('./supabase-add-order.sql', 'utf8');
    
    // Executar cada comando SQL separadamente
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('COMMENT'));

    for (const command of commands) {
      console.log(`Executando: ${command.substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: command });
      
      if (error) {
        // Se o erro for "column already exists", ignorar
        if (error.message.includes('already exists')) {
          console.log('  ℹ️  Já existe, pulando...');
        } else {
          throw error;
        }
      } else {
        console.log('  ✅ OK');
      }
    }

    // Verificar se as colunas foram adicionadas
    console.log('\n📊 Verificando estrutura...');
    
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id, name, display_order')
      .limit(5);
    
    if (projectError) {
      console.log('⚠️  Não foi possível verificar projetos:', projectError.message);
    } else {
      console.log(`✅ Projetos com display_order: ${projects.length} encontrados`);
      projects.forEach(p => console.log(`   - ${p.name}: ordem ${p.display_order}`));
    }

    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, display_order')
      .limit(5);
    
    if (taskError) {
      console.log('⚠️  Não foi possível verificar tarefas:', taskError.message);
    } else {
      console.log(`✅ Tarefas com display_order: ${tasks.length} encontradas`);
      tasks.forEach(t => console.log(`   - ${t.title}: ordem ${t.display_order}`));
    }

    console.log('\n✅ Migração concluída com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('   1. Testar drag & drop de projetos');
    console.log('   2. Testar drag & drop de tarefas');
    console.log('   3. Verificar se a ordem persiste após reload');
    
  } catch (error) {
    console.error('\n❌ Erro na migração:', error);
    process.exit(1);
  }
}

applyOrderMigration();
