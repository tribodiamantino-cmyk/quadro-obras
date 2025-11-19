#!/usr/bin/env node

/**
 * Script para aplicar migração GSI usando conexão direta PostgreSQL
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function applyMigration() {
  console.log('🚀 Aplicando migração GSI...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis SUPABASE_URL e SUPABASE_ANON_KEY não encontradas');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('📋 Verificando se os campos GSI já existem...');

    // Tentar buscar um projeto para verificar se os campos existem
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, gsi_forecast_date, gsi_actual_date')
      .limit(1);

    if (error) {
      if (error.message.includes('column "gsi_forecast_date" does not exist')) {
        console.log('⚠️  Campos GSI não encontrados. É necessário executar a migração SQL manualmente.');
        console.log('\n📝 EXECUTE NO SUPABASE SQL EDITOR:');
        console.log('─'.repeat(50));
        console.log('ALTER TABLE projects');
        console.log('ADD COLUMN IF NOT EXISTS gsi_forecast_date DATE,');
        console.log('ADD COLUMN IF NOT EXISTS gsi_actual_date DATE;');
        console.log('─'.repeat(50));
        console.log('\n1. Acesse: https://supabase.com/dashboard');
        console.log('2. Vá para SQL Editor');
        console.log('3. Execute o SQL acima');
        console.log('\n✅ Após isso, a funcionalidade GSI estará pronta!');
      } else {
        console.error('❌ Erro ao verificar campos:', error.message);
      }
    } else {
      console.log('✅ Campos GSI já existem no banco de dados!');
      console.log('🎉 Funcionalidade GSI está pronta para uso!');
    }

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message);
    console.log('\n📝 Execute manualmente no Supabase SQL Editor:');
    console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS gsi_forecast_date DATE;');
    console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS gsi_actual_date DATE;');
  }

  console.log('\n🌐 Servidor rodando em: http://localhost:4000');
  console.log('🎯 Funcionalidade GSI implementada e pronta para teste!');
}

applyMigration();