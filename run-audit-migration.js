// Script para executar migração de logs de auditoria
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis SUPABASE_URL e SUPABASE_KEY não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Executando migração de Logs de Auditoria...\n');

  try {
    // Ler arquivo SQL
    const sql = fs.readFileSync('./supabase-audit-logs.sql', 'utf8');
    
    console.log('📝 SQL a ser executado:');
    console.log('---');
    console.log(sql);
    console.log('---\n');
    
    console.log('⚠️  Este script NÃO pode executar SQL complexo via API do Supabase.');
    console.log('📋 Por favor, execute MANUALMENTE no Supabase SQL Editor:\n');
    console.log('1. Acesse: https://supabase.com/dashboard');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá em "SQL Editor"');
    console.log('4. Cole o SQL acima');
    console.log('5. Clique em "RUN"\n');
    
    console.log('✅ Após executar o SQL, reinicie o servidor: npm start\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

runMigration().then(() => process.exit(0));
