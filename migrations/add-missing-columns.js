/**
 * Adicionar colunas faltantes nas tabelas
 */

require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL_RAILWAY || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addMissingColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adicionando colunas faltantes...\n');
    
    // Users
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true');
    console.log('✅ users.active');
    
    // Projects - adicionar todas as colunas que podem estar faltando
    const projectColumns = [
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS store_id UUID',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS work_status_id UUID',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT \'medium\'',
      'ALTER TABLE projects ADD COLUMN IF NOT EXISTS observations TEXT DEFAULT \'\'',
    ];
    
    for (const query of projectColumns) {
      await client.query(query);
    }
    console.log('✅ projects - todas as colunas');
    
    // Criar tabelas auxiliares se não existirem
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ stores table');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS work_statuses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        color TEXT DEFAULT '#gray',
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log('✅ work_statuses table');
    
    // Adicionar foreign keys
    await client.query('ALTER TABLE projects ADD CONSTRAINT fk_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL').catch(() => {});
    await client.query('ALTER TABLE projects ADD CONSTRAINT fk_work_status FOREIGN KEY (work_status_id) REFERENCES work_statuses(id) ON DELETE SET NULL').catch(() => {});
    console.log('✅ foreign keys');
    
    console.log('\n🎉 Todas as colunas adicionadas!');
    
  } finally {
    client.release();
    await pool.end();
  }
}

addMissingColumns();
