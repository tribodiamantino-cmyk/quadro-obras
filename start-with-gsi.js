#!/usr/bin/env node

/**
 * Script para aplicar migração GSI
 * Como o Supabase não permite execução direta de ALTER TABLE via API,
 * este script apenas orienta sobre a execução manual
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🚀 MIGRAÇÃO GSI - QUADRO DE OBRAS\n');

// Ler o arquivo SQL
const sqlFile = path.join(__dirname, 'supabase-add-gsi-delivery.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

console.log('📋 INSTRUÇÕES PARA APLICAR A MIGRAÇÃO:');
console.log('─'.repeat(60));
console.log('1. Acesse: https://supabase.com/dashboard');
console.log('2. Selecione seu projeto');
console.log('3. Vá para "SQL Editor" no menu lateral');
console.log('4. Cole e execute o SQL abaixo:');
console.log('─'.repeat(60));
console.log(sqlContent);
console.log('─'.repeat(60));

console.log('\n✅ Após executar o SQL no Supabase, a funcionalidade GSI estará pronta!');
console.log('\n🚀 Iniciando o servidor em 3 segundos...\n');

// Aguardar 3 segundos e iniciar o servidor
setTimeout(() => {
  console.log('🔥 Iniciando servidor Supabase...\n');
  
  // Iniciar o servidor
  require('./server-supabase.js');
}, 3000);