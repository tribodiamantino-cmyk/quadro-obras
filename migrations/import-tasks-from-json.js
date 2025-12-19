/**
 * Script para Importar Tarefas do dados-antigos.json para o Banco PostgreSQL
 * 
 * Este script mapeia os projetos pelo nome (já que os IDs mudaram)
 * e importa as tarefas antigas para a tabela tasks
 * 
 * Uso: node migrations/import-tasks-from-json.js
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

// Status válidos no novo sistema
const VALID_STATUSES = ['Criado', 'Em separação', 'Pendencia', 'Em romaneio', 'Entregue'];

// Mapeamento de status antigos para novos (caso existam diferenças)
const STATUS_MAP = {
  'Para separação': 'Criado',
  'Separação': 'Em separação',
  'Romaneio': 'Em romaneio',
  'Em Romaneio': 'Em romaneio',
  'Em Separação': 'Em separação',
  'Pendência': 'Pendencia',
  'pendencia': 'Pendencia'
};

function normalizeStatus(status) {
  if (!status) return 'Criado';
  if (VALID_STATUSES.includes(status)) return status;
  if (STATUS_MAP[status]) return STATUS_MAP[status];
  console.warn(`   ⚠️  Status desconhecido: "${status}" -> usando "Criado"`);
  return 'Criado';
}

async function importTasks() {
  console.log('🚀 Iniciando importação de tarefas do dados-antigos.json...\n');
  
  // Ler arquivo de dados antigos
  const jsonPath = path.join(__dirname, '..', 'dados-antigos.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Arquivo dados-antigos.json não encontrado');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`📂 Carregados ${data.projects?.length || 0} projetos do arquivo JSON\n`);

  const client = await pool.connect();
  
  try {
    // Buscar projetos do banco (para fazer mapeamento por nome)
    const { rows: dbProjects } = await client.query(`
      SELECT id, name, client_name FROM projects
    `);
    
    console.log(`📦 Encontrados ${dbProjects.length} projetos no banco de dados\n`);
    
    // Criar mapa de nomes -> IDs do banco
    const projectNameToId = {};
    dbProjects.forEach(p => {
      // Normalizar nome para comparação
      const normalizedName = (p.name || p.client_name || '').trim().toLowerCase();
      projectNameToId[normalizedName] = p.id;
    });
    
    // Verificar tarefas já existentes
    const { rows: existingTasks } = await client.query(`SELECT id FROM tasks`);
    const existingTaskIds = new Set(existingTasks.map(t => t.id));
    console.log(`📋 Já existem ${existingTaskIds.size} tarefas no banco\n`);
    
    let importedCount = 0;
    let skippedCount = 0;
    let noMatchCount = 0;
    let errorCount = 0;
    
    await client.query('BEGIN');
    
    // Processar cada projeto do JSON
    for (const oldProject of (data.projects || [])) {
      const normalizedOldName = (oldProject.name || '').trim().toLowerCase();
      const dbProjectId = projectNameToId[normalizedOldName];
      
      if (!dbProjectId) {
        if (oldProject.tasks && oldProject.tasks.length > 0) {
          console.log(`⚠️  Projeto não encontrado no banco: "${oldProject.name}" (${oldProject.tasks.length} tarefas)`);
          noMatchCount += oldProject.tasks.length;
        }
        continue;
      }
      
      // Buscar organization_id do projeto
      const { rows: [projectRow] } = await client.query(
        'SELECT organization_id FROM projects WHERE id = $1',
        [dbProjectId]
      );
      
      if (!projectRow) {
        console.log(`⚠️  Erro ao buscar organization do projeto: ${dbProjectId}`);
        continue;
      }
      
      const orgId = projectRow.organization_id;
      
      // Importar tarefas deste projeto
      for (const task of (oldProject.tasks || [])) {
        // Verificar se tarefa já existe
        if (existingTaskIds.has(task.id)) {
          skippedCount++;
          continue;
        }
        
        try {
          const status = normalizeStatus(task.status);
          
          await client.query(`
            INSERT INTO tasks (id, title, status, dates, history, has_pending, parent_id, project_id, organization_id, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (id) DO NOTHING
          `, [
            task.id,
            task.title,
            status,
            JSON.stringify(task.dates || {}),
            JSON.stringify(task.history || []),
            task.hasPending || false,
            task.parentId || null,
            dbProjectId,
            orgId,
            task.created ? parseDate(task.created) : new Date()
          ]);
          
          importedCount++;
          
        } catch (err) {
          console.error(`   ❌ Erro ao importar tarefa "${task.title}": ${err.message}`);
          errorCount++;
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log('\n========================================');
    console.log('📊 RESUMO DA IMPORTAÇÃO');
    console.log('========================================');
    console.log(`✅ Tarefas importadas:     ${importedCount}`);
    console.log(`⏭️  Tarefas já existentes:  ${skippedCount}`);
    console.log(`⚠️  Projetos não encontrados: ${noMatchCount} tarefas`);
    console.log(`❌ Erros:                  ${errorCount}`);
    console.log('========================================\n');
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Erro na importação, rollback executado:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Helper para converter data no formato "DD/MM/YYYY HH:mm" para Date
function parseDate(dateStr) {
  if (!dateStr) return new Date();
  
  // Formato: "24/09/2025 14:39"
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s?(\d{2})?:?(\d{2})?/);
  if (match) {
    const [, day, month, year, hour = '00', min = '00'] = match;
    return new Date(year, month - 1, day, hour, min);
  }
  
  return new Date();
}

// Executar
importTasks()
  .then(() => {
    console.log('✅ Importação concluída!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Falha na importação:', err);
    process.exit(1);
  });
