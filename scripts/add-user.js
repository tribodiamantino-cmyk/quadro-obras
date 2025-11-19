require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function addUser() {
  console.log('👤 Adicionar Novo Usuário\n');

  // Pegar dados via argumentos da linha de comando
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('❌ Uso correto:');
    console.log('node scripts/add-user.js <email> <nome> <senha> [role]\n');
    console.log('Exemplos:');
    console.log('  node scripts/add-user.js joao@obra.com "João Silva" senha123');
    console.log('  node scripts/add-user.js maria@obra.com "Maria Santos" senha123 ADMIN\n');
    console.log('Roles disponíveis: ADMIN, MEMBER, VIEWER (padrão: MEMBER)');
    process.exit(1);
  }

  const [email, name, password, role = 'MEMBER'] = args;

  // Validar role
  const validRoles = ['ADMIN', 'MEMBER', 'VIEWER'];
  if (!validRoles.includes(role.toUpperCase())) {
    console.error(`❌ Role inválido! Use: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  // Buscar organização "teste"
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', 'teste')
    .single();

  if (!org) {
    console.error('❌ Organização "teste" não encontrada!');
    process.exit(1);
  }

  // Verificar se usuário já existe
  const { data: existing } = await supabase
    .from('users')
    .select('email')
    .eq('email', email)
    .single();

  if (existing) {
    console.error(`❌ Usuário ${email} já existe!`);
    process.exit(1);
  }

  // Hashear senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Criar usuário
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email,
      name,
      password: hashedPassword,
      organization_id: org.id,
      role: role.toUpperCase(),
      active: true
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar usuário:', error);
    process.exit(1);
  }

  console.log('✅ Usuário criado com sucesso!\n');
  console.log('📧 Email:', email);
  console.log('👤 Nome:', name);
  console.log('🔑 Senha:', password);
  console.log('👔 Cargo:', role.toUpperCase());
  console.log('🏢 Organização:', org.name);
  console.log('\n🚀 Usuário já pode fazer login!');
}

addUser().catch(console.error);
