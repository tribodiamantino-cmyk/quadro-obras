require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createAdminUser() {
  console.log('🔧 Criando usuário admin...\n');

  // Buscar organização "teste"
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'teste')
    .single();

  if (!org) {
    console.error('❌ Organização "teste" não encontrada!');
    process.exit(1);
  }

  // Verificar se usuário já existe
  const { data: existing } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'admin@admin.com')
    .single();

  if (existing) {
    console.log('⚠️  Usuário admin@admin.com já existe!');
    console.log('📧 Email: admin@admin.com');
    console.log('🔑 Senha: admin123');
    console.log('\n✅ Use essas credenciais para login!');
    process.exit(0);
  }

  // Hashear senha
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Criar usuário
  const { data: user, error} = await supabase
    .from('users')
    .insert({
      email: 'admin@admin.com',
      name: 'Administrador',
      password: hashedPassword,
      organization_id: org.id,
      role: 'ADMIN',
      active: true
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar usuário:', error);
    process.exit(1);
  }

  console.log('✅ Usuário admin criado com sucesso!\n');
  console.log('📧 Email: admin@admin.com');
  console.log('🔑 Senha: admin123');
  console.log('🏢 Organização: teste');
  console.log('\n🚀 Faça login no sistema com essas credenciais!');
}

createAdminUser().catch(console.error);
