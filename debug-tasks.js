const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:ngbiitjwnIqrUIogvRcFNNUQFHuyRwxp@caboose.proxy.rlwy.net:20280/railway'
});

async function debug() {
  try {
    await client.connect();
    console.log('✅ Conectado ao banco\n');

    // 1. Verificar tarefas mais recentes
    console.log('=== TAREFAS MAIS RECENTES ===');
    const tasks = await client.query(
      `SELECT id, title, status, project_id, organization_id, created_at 
       FROM tasks 
       ORDER BY created_at DESC 
       LIMIT 5`
    );
    tasks.rows.forEach(t => {
      console.log(`- ${t.title} | ${t.status} | criado: ${t.created_at}`);
      console.log(`  project_id: ${t.project_id}`);
      console.log(`  org_id: ${t.organization_id}`);
    });

    // 2. Verificar o projeto que está sendo usado
    const projectId = '0b25c1ba-69ff-46d3-8582-5dbfa68fae8c';
    console.log('\n=== PROJETO ===');
    const project = await client.query(
      `SELECT id, name, organization_id, archived FROM projects WHERE id = $1`,
      [projectId]
    );
    if (project.rows[0]) {
      console.log(`Nome: ${project.rows[0].name}`);
      console.log(`Org ID: ${project.rows[0].organization_id}`);
      console.log(`Arquivado: ${project.rows[0].archived}`);
    }

    // 3. Contar tarefas no projeto
    console.log('\n=== TAREFAS NO PROJETO ===');
    const taskCount = await client.query(
      `SELECT COUNT(*) as total FROM tasks WHERE project_id = $1`,
      [projectId]
    );
    console.log(`Total de tarefas: ${taskCount.rows[0].total}`);

    // 4. Simular a query do servidor
    console.log('\n=== SIMULANDO QUERY DO SERVIDOR ===');
    const orgId = project.rows[0]?.organization_id;
    if (orgId) {
      const serverQuery = await client.query(
        `SELECT t.* FROM tasks t
         INNER JOIN projects p ON t.project_id = p.id
         WHERE p.organization_id = $1
         ORDER BY t.created_at`,
        [orgId]
      );
      console.log(`Query retornou: ${serverQuery.rows.length} tarefas`);
      
      // Filtrar para o projeto específico
      const projectTasks = serverQuery.rows.filter(t => t.project_id === projectId);
      console.log(`Tarefas do projeto ${projectId}: ${projectTasks.length}`);
      projectTasks.slice(0, 3).forEach(t => {
        console.log(`  - ${t.title} (${t.status})`);
      });
    }

    // 5. Verificar se há problema de organization_id
    console.log('\n=== VERIFICAÇÃO DE ORG_ID ===');
    const mismatch = await client.query(
      `SELECT t.id, t.title, t.organization_id as task_org, p.organization_id as project_org
       FROM tasks t
       JOIN projects p ON t.project_id = p.id
       WHERE t.organization_id != p.organization_id
       LIMIT 5`
    );
    if (mismatch.rows.length > 0) {
      console.log('⚠️  PROBLEMA: Tarefas com org_id diferente do projeto!');
      mismatch.rows.forEach(m => {
        console.log(`  - ${m.title}: task_org=${m.task_org}, project_org=${m.project_org}`);
      });
    } else {
      console.log('✅ Todas as tarefas têm org_id correto');
    }

    await client.end();
  } catch (error) {
    console.error('Erro:', error);
    await client.end();
  }
}

debug();
