const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/apply-gsi-migration',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

console.log('🚀 Aplicando migração GSI...');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (res.statusCode === 200) {
        console.log('✅', response.message);
      } else {
        console.log('⚠️', response.message);
      }
    } catch (error) {
      console.log('❌ Resposta:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro de conexão:', error.message);
  console.log('\n📝 SOLUÇÃO MANUAL - Execute no Supabase SQL Editor:');
  console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS gsi_forecast_date DATE;');
  console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS gsi_actual_date DATE;');
});

req.end();