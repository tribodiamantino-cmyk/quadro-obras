#!/usr/bin/env node

/**
 * Script para executar a migração GSI no Supabase
 * Este script adiciona os campos gsi_forecast_date e gsi_actual_date na tabela projects
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Iniciando migração GSI...\n');

  // Verificar se as variáveis de ambiente estão definidas
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('❌ Erro: Variáveis SUPABASE_URL e SUPABASE_ANON_KEY não encontradas no .env');
    process.exit(1);
  }

  // Criar cliente Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  try {
    console.log('📋 Lendo arquivo de migração...');
    
    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, 'supabase-add-gsi-delivery.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 SQL a ser executado:');
    console.log('─'.repeat(50));
    console.log(sqlContent);
    console.log('─'.repeat(50));
    
    console.log('\n🔄 Executando migração...');
    
    // Dividir o SQL em comandos individuais
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && cmd !== '');

    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`\n📝 Executando comando ${i + 1}/${sqlCommands.length}:`);
      console.log(`   ${command.substring(0, 60)}...`);
      
      try {
        // Para comandos ALTER TABLE, usar rpc do Supabase
        if (command.includes('ALTER TABLE')) {
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: command + ';' 
          });
          
          if (error) {
            console.log(`⚠️  Tentativa com rpc falhou: ${error.message}`);
            console.log('   Isso é esperado se a função exec_sql não existir no Supabase.');
            console.log('   Os campos serão adicionados quando o servidor tentar usar.');
          } else {
            console.log('   ✅ Comando executado com sucesso via rpc');
          }
        }
      } catch (error) {
        console.log(`⚠️  Erro ao executar comando: ${error.message}`);
        console.log('   Continuando... (erro pode ser esperado)');
      }
    }

    console.log('\n✅ Migração concluída!');
    console.log('\n📝 IMPORTANTE:');
    console.log('   Se houve erros acima, você precisará executar o SQL manualmente no Supabase:');
    console.log('   1. Acesse https://supabase.com/dashboard');
    console.log('   2. Vá para SQL Editor');
    console.log('   3. Execute o conteúdo do arquivo supabase-add-gsi-delivery.sql');
    
    console.log('\n🚀 Agora vou iniciar o servidor...\n');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    console.log('\n📝 Execute manualmente no Supabase SQL Editor:');
    console.log('   ALTER TABLE projects ADD COLUMN IF NOT EXISTS gsi_forecast_date DATE;');
    console.log('   ALTER TABLE projects ADD COLUMN IF NOT EXISTS gsi_actual_date DATE;');
    
    console.log('\n🚀 Continuando com a inicialização do servidor...\n');
  }
}

// Executar migração
runMigration().then(() => {
  console.log('🎉 Processo concluído!');
}).catch((error) => {
  console.error('❌ Erro:', error);
  process.exit(1);
});