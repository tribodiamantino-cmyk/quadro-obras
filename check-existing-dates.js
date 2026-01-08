const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ngbiitjwnIqrUIogvRcFNNUQFHuyRwxp@caboose.proxy.rlwy.net:20280/railway'
});

async function checkDates() {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        name, 
        start_date, 
        delivery_forecast,
        assembler_start_date,
        electrician_start_date,
        gsi_forecast_date,
        gsi_actual_date
      FROM projects 
      WHERE archived = false
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('=== PROJETOS E SUAS DATAS ===\n');
    
    result.rows.forEach(project => {
      console.log(`📋 ${project.name} (ID: ${project.id})`);
      console.log(`   - Início: ${project.start_date || 'null'}`);
      console.log(`   - Entrega: ${project.delivery_forecast || 'null'}`);
      console.log(`   - Início Montagem: ${project.assembler_start_date || 'null'}`);
      console.log(`   - Início Elétrica: ${project.electrician_start_date || 'null'}`);
      console.log(`   - GSI Previsto: ${project.gsi_forecast_date || 'null'}`);
      console.log(`   - GSI Efetivo: ${project.gsi_actual_date || 'null'}`);
      console.log('');
    });
    
    // Contar quantos projetos têm pelo menos uma data
    const withDates = result.rows.filter(p => 
      p.start_date || p.delivery_forecast || p.gsi_forecast_date
    ).length;
    
    console.log(`\n📊 ${withDates} de ${result.rows.length} projetos têm pelo menos uma data preenchida`);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

checkDates();
