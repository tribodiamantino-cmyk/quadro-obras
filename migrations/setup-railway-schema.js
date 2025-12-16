/**
 * Script para executar o schema no Railway PostgreSQL
 * Uso: node migrations/setup-railway-schema.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Pega a DATABASE_URL do Railway
const DATABASE_URL = process.env.DATABASE_URL_RAILWAY || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Configure DATABASE_URL_RAILWAY no .env com a URL do banco Railway');
  console.log('\nAdicione no .env:');
  console.log('DATABASE_URL_RAILWAY=postgresql://...\n');
  process.exit(1);
}

console.log('🔗 Conectando ao Railway PostgreSQL...\n');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupSchema() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Conectado!\n');
    console.log('📋 Executando schema...\n');
    
    // Ler arquivo SQL
    const schemaPath = path.join(__dirname, '01-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Executar schema
    await client.query(schema);
    
    console.log('✅ Schema criado com sucesso!\n');
    
    // Listar tabelas criadas
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📊 Tabelas criadas:');
    rows.forEach(row => console.log(`   - ${row.table_name}`));
    
  } catch (err) {
    console.error('❌ Erro ao executar schema:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

setupSchema()
  .then(() => {
    console.log('\n🎉 Pronto! Agora execute: node migrations/import-railway.js\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Falha:', err);
    process.exit(1);
  });
