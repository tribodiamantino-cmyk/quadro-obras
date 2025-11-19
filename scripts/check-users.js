require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role');

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  if (data.length === 0) {
    console.log('\n❌ Nenhum usuário encontrado!');
    console.log('\n📝 Para importar dados, você precisa:');
    console.log('   1. Iniciar o servidor: npm start');
    console.log('   2. Acessar: http://localhost:4000/register.html');
    console.log('   3. Criar um usuário admin');
    console.log('   4. Executar novamente: npm run import\n');
  } else {
    console.log(`\n✅ ${data.length} usuário(s) encontrado(s):\n`);
    data.forEach(u => {
      const roleIcon = u.role === 'admin' ? '👑' : '👤';
      console.log(`   ${roleIcon} ${u.name} (${u.email}) - ${u.role}`);
    });
    console.log('');

    const hasAdmin = data.some(u => u.role === 'admin');
    if (hasAdmin) {
      console.log('✅ Usuário admin encontrado! Pode executar: npm run import\n');
    } else {
      console.log('⚠️  Nenhum admin encontrado. Todos os projetos serão associados ao primeiro usuário.\n');
    }
  }
}

checkUsers();
