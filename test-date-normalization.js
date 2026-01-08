const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:ngbiitjwnIqrUIogvRcFNNUQFHuyRwxp@caboose.proxy.rlwy.net:20280/railway'
});

// Função igual ao servidor
const formatDate = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
};

async function testNormalization() {
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
      LIMIT 5
    `);
    
    console.log('=== ANTES DA NORMALIZAÇÃO ===\n');
    result.rows.forEach(p => {
      console.log(`${p.name}:`);
      console.log(`  start_date (raw): ${p.start_date}`);
      console.log(`  start_date (type): ${typeof p.start_date}`);
    });
    
    console.log('\n=== DEPOIS DA NORMALIZAÇÃO ===\n');
    result.rows.forEach(project => {
      // Normalizar (igual ao servidor)
      project.start_date = formatDate(project.start_date);
      project.delivery_forecast = formatDate(project.delivery_forecast);
      project.assembler_start_date = formatDate(project.assembler_start_date);
      project.electrician_start_date = formatDate(project.electrician_start_date);
      project.gsi_forecast_date = formatDate(project.gsi_forecast_date);
      project.gsi_actual_date = formatDate(project.gsi_actual_date);
      
      console.log(`📋 ${project.name}`);
      console.log(`   - Início: ${project.start_date || 'null'}`);
      console.log(`   - Entrega: ${project.delivery_forecast || 'null'}`);
      console.log(`   - Início Montagem: ${project.assembler_start_date || 'null'}`);
      console.log(`   - Início Elétrica: ${project.electrician_start_date || 'null'}`);
      console.log(`   - GSI Previsto: ${project.gsi_forecast_date || 'null'}`);
      console.log(`   - GSI Efetivo: ${project.gsi_actual_date || 'null'}`);
      console.log('');
    });
    
    console.log('✅ Normalização funcionando corretamente!');
    console.log('📌 As datas agora estão em formato YYYY-MM-DD');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

testNormalization();
