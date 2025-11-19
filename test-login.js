require('dotenv').config();
const supabase = require('./src/config/supabase');

async function testLogin() {
  try {
    console.log('Testando busca do usuário...');
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@construtora.com')
      .single();

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      return;
    }

    console.log('Usuário encontrado:');
    console.log('- Email:', user.email);
    console.log('- Nome:', user.name);
    console.log('- Role:', user.role);
    console.log('- Password hash:', user.password);
    console.log('- Org ID:', user.organization_id);

    // Testar senha
    const bcrypt = require('bcryptjs');
    const validPassword = await bcrypt.compare('admin123', user.password);
    console.log('\nSenha "admin123" válida?', validPassword);

  } catch (err) {
    console.error('Erro:', err);
  }
  process.exit(0);
}

testLogin();
