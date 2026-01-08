const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkDateFields() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
        AND (column_name LIKE '%date%' OR column_name LIKE '%forecast%')
      ORDER BY ordinal_position
    `);
    
    console.log('📅 Campos de data na tabela projects:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error);
    await pool.end();
  }
}

checkDateFields();
