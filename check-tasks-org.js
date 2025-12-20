const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:ngbiitjwnIqrUIogvRcFNNUQFHuyRwxp@caboose.proxy.rlwy.net:20280/railway'
});

async function checkTasks() {
  try {
    await client.connect();
    
    // 1. Verificar organization_id das tarefas 'teste'
    console.log('=== TAREFAS "teste" ===');
    const tasksRes = await client.query(`
      SELECT t.id, t.title, t.organization_id as task_org, 
             p.id as project_id, p.name, p.organization_id as project_org
      FROM tasks t 
      LEFT JOIN projects p ON t.project_id = p.id 
      WHERE t.title = 'teste' 
      LIMIT 5
    `);
    console.log(JSON.stringify(tasksRes.rows, null, 2));
    
    // 2. Verificar todas as organization_id existentes
    console.log('\n=== ORGANIZATIONS ===');
    const orgsRes = await client.query('SELECT id, name FROM organizations');
    console.log(JSON.stringify(orgsRes.rows, null, 2));
    
    // 3. Verificar se há tarefas com organization_id NULL
    console.log('\n=== TAREFAS COM ORG NULL ===');
    const nullOrgRes = await client.query('SELECT COUNT(*) FROM tasks WHERE organization_id IS NULL');
    console.log('Total:', nullOrgRes.rows[0].count);
    
    await client.end();
  } catch (error) {
    console.error('Erro:', error);
    await client.end();
  }
}

checkTasks();
