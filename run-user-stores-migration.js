const fs = require('fs');
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:yMxZWaItbVYmTwfSFhQyQZBOxaGKETXE@autorack.proxy.rlwy.net:37501/railway",
  ssl: false
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco');
    
    const sql = fs.readFileSync('user-stores-migration.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ Migração executada com sucesso!');
    await client.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

runMigration();
