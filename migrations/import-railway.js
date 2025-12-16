/**
 * Script de Importação de Dados para Railway PostgreSQL
 * Execute este script após criar o schema no banco Railway
 * 
 * Uso: node migrations/import-railway.js <arquivo-backup.json>
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Conexão Railway PostgreSQL
const DATABASE_URL = process.env.DATABASE_URL_RAILWAY || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Configure DATABASE_URL_RAILWAY no .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function importData(backupFile) {
  console.log('🚀 Iniciando importação para Railway PostgreSQL...\n');
  
  // Ler backup
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Arquivo não encontrado: ${backupFile}`);
    process.exit(1);
  }
  
  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  console.log(`📂 Carregado backup de: ${backup.exportedAt}\n`);

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Ordem de importação (respeitando foreign keys)
    const importOrder = [
      'organizations',
      'users',
      'stores',
      'work_statuses',
      'integrators',
      'assemblers',
      'electricians',
      'projects',
      'tasks'
    ];

    for (const table of importOrder) {
      const tableData = backup.tables[table];
      
      if (!tableData || tableData.error || !tableData.data.length) {
        console.log(`⏭️  ${table}: Pulando (sem dados)`);
        continue;
      }

      console.log(`📦 Importando ${table} (${tableData.data.length} registros)...`);

      for (const row of tableData.data) {
        await insertRow(client, table, row);
      }
      
      console.log(`   ✅ ${tableData.data.length} registros importados`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Importação concluída com sucesso!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Erro na importação, rollback executado:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function insertRow(client, table, row) {
  // Remover campos nulos ou undefined
  const cleanRow = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== null && value !== undefined) {
      cleanRow[key] = value;
    }
  }

  const columns = Object.keys(cleanRow);
  const values = Object.values(cleanRow);
  const placeholders = columns.map((_, i) => `$${i + 1}`);

  // Se não tiver coluna 'id', fazer insert simples
  if (!columns.includes('id')) {
    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
    `;
    await client.query(query, values);
    return;
  }

  // Com id, usar ON CONFLICT
  const updateCols = columns.filter(c => c !== 'id' && c !== 'created_at');
  
  if (updateCols.length === 0) {
    // Só tem id e created_at, fazer insert ignorando conflito
    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT (id) DO NOTHING
    `;
    await client.query(query, values);
  } else {
    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT (id) DO UPDATE SET
      ${updateCols.map(c => `${c} = EXCLUDED.${c}`).join(', ')}
    `;
    await client.query(query, values);
  }
}

// Executar
const backupFile = process.argv[2];

if (!backupFile) {
  // Tentar encontrar o backup mais recente
  const backupDir = path.join(__dirname, 'backup');
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('supabase-backup-'))
      .sort()
      .reverse();
    
    if (files.length > 0) {
      const latestBackup = path.join(backupDir, files[0]);
      console.log(`📂 Usando backup mais recente: ${files[0]}\n`);
      importData(latestBackup)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    } else {
      console.error('❌ Nenhum arquivo de backup encontrado');
      console.log('   Execute primeiro: node migrations/export-supabase.js');
      process.exit(1);
    }
  } else {
    console.error('❌ Pasta de backup não existe');
    console.log('   Execute primeiro: node migrations/export-supabase.js');
    process.exit(1);
  }
} else {
  importData(backupFile)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
