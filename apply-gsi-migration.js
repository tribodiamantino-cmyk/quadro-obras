#!/usr/bin/env node

/**
 * Aplicar migração GSI usando o endpoint do servidor
 */

require('dotenv').config();

async function applyGsiMigration() {
  console.log('🚀 Aplicando migração GSI via endpoint...\n');

  try {
    const response = await fetch('http://localhost:4000/api/apply-gsi-migration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅', result.message);
    } else {
      const error = await response.json();
      console.error('❌ Erro:', error.message);
    }
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    console.log('\n📝 SOLUÇÃO MANUAL:');
    console.log('1. Acesse: https://supabase.com/dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute: ALTER TABLE projects ADD COLUMN IF NOT EXISTS gsi_forecast_date DATE, ADD COLUMN IF NOT EXISTS gsi_actual_date DATE;');
  }
}

applyGsiMigration();