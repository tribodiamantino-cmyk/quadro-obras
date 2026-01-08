// Script para executar migration no Railway
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Usar a DATABASE_URL passada como argumento ou variável de ambiente
const databaseUrl = process.argv[2] || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Erro: DATABASE_URL não fornecida!');
  console.log('\nUso: node run-migration.js "postgresql://user:pass@host:port/db"');
  console.log('Ou: set DATABASE_URL=... && node run-migration.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔗 Conectado ao banco de dados Railway...');
    
    // Ler o arquivo de migration
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migration-add-project-activities.sql'),
      'utf8'
    );
    
    console.log('📄 Executando migration...\n');
    
    // Executar a migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration executada com sucesso!\n');
    
    // Verificar se a tabela foi criada
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'project_activities'
      ORDER BY ordinal_position;
    `);
    
    console.log('📊 Colunas da tabela project_activities:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Verificar novas colunas em projects
    const projectColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name IN ('notes', 'activity_log');
    `);
    
    console.log('\n📊 Novas colunas em projects:');
    projectColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });
    
    console.log('\n🎉 Tudo pronto! O sistema está pronto para usar o histórico de atividades.');
    
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
