/**
 * Configuração do banco PostgreSQL (Railway)
 */

const { Pool } = require('pg');

// Usar DATABASE_URL do Railway ou configuração local
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL não configurada!');
  console.log('   Configure a variável de ambiente DATABASE_URL');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Testar conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro no pool PostgreSQL:', err.message);
});

// Helper para queries
const db = {
  query: (text, params) => pool.query(text, params),
  
  // Helper para single row
  async single(text, params) {
    const result = await pool.query(text, params);
    return result.rows[0] || null;
  },
  
  // Helper para múltiplas rows
  async many(text, params) {
    const result = await pool.query(text, params);
    return result.rows;
  },
  
  // Helper para insert retornando o registro
  async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`);
    
    const query = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },
  
  // Helper para update
  async update(table, id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    
    const query = `
      UPDATE ${table}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $${keys.length + 1}
      RETURNING *
    `;
    
    const result = await pool.query(query, [...values, id]);
    return result.rows[0];
  },
  
  // Helper para delete
  async delete(table, id) {
    const query = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  pool
};

module.exports = db;
