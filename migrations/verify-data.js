/**
 * Script para verificar dados no banco Railway
 */

require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL_RAILWAY || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando dados no Railway PostgreSQL...\n');
    
    const tables = [
      'organizations',
      'users',
      'integrators',
      'assemblers',
      'electricians',
      'projects',
      'tasks'
    ];

    for (const table of tables) {
      const { rows } = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${table}: ${rows[0].count} registros`);
    }

    console.log('\n✅ Dados verificados com sucesso!');
    
  } finally {
    client.release();
    await pool.end();
  }
}

checkData();
