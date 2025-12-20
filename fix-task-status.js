// Script para executar SQL no Railway
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:ngbiitjwnIqrUIogvRcFNNUQFHuyRwxp@caboose.proxy.rlwy.net:20280/railway';

async function runMigration() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados');
    
    // Remover constraint antiga
    console.log('🔄 Removendo constraint antiga...');
    await client.query('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check');
    
    // Adicionar nova constraint
    console.log('🔄 Adicionando nova constraint...');
    await client.query(`
      ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
      CHECK (status IN ('Criado', 'Em separação', 'Pendencia', 'Em romaneio', 'Entregue', 'backlog', 'doing', 'done'))
    `);
    
    console.log('✅ Constraint de status atualizada com sucesso!');
    
    // Verificar
    const result = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conname = 'tasks_status_check'
    `);
    
    if (result.rows.length > 0) {
      console.log('📋 Nova constraint:', result.rows[0].pg_get_constraintdef);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();
