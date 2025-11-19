const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Limpa dados existentes (cuidado em produção!)
  if (process.env.NODE_ENV !== 'production') {
    await prisma.task.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.organization.deleteMany();
    console.log('🧹 Dados antigos removidos\n');
  }

  // Cria organização 1
  console.log('🏢 Criando organizações...');
  const org1 = await prisma.organization.create({
    data: {
      name: 'Construtora Exemplo Ltda',
      slug: 'construtora-exemplo'
    }
  });
  console.log(`   ✅ ${org1.name}`);

  const org2 = await prisma.organization.create({
    data: {
      name: 'Engenharia e Obras SA',
      slug: 'engenharia-obras'
    }
  });
  console.log(`   ✅ ${org2.name}\n`);

  // Cria usuários
  console.log('👥 Criando usuários...');
  const hashedPassword = await bcrypt.hash('senha123', 10);

  const admin1 = await prisma.user.create({
    data: {
      email: 'admin@construtora.com',
      name: 'Admin Construtora',
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: org1.id
    }
  });
  console.log(`   ✅ ${admin1.email} (ADMIN)`);

  const member1 = await prisma.user.create({
    data: {
      email: 'joao@construtora.com',
      name: 'João Silva',
      password: hashedPassword,
      role: 'MEMBER',
      organizationId: org1.id
    }
  });
  console.log(`   ✅ ${member1.email} (MEMBER)`);

  const viewer1 = await prisma.user.create({
    data: {
      email: 'maria@construtora.com',
      name: 'Maria Santos',
      password: hashedPassword,
      role: 'VIEWER',
      organizationId: org1.id
    }
  });
  console.log(`   ✅ ${viewer1.email} (VIEWER)\n`);

  // Cria projetos para org1
  console.log('📁 Criando projetos...');
  const project1 = await prisma.project.create({
    data: {
      name: 'Edifício Centro Comercial',
      isCurrent: true,
      detailsChecklist: [
        { text: 'Licença aprovada', checked: true },
        { text: 'Contratar equipe', checked: true },
        { text: 'Finalizar fundação', checked: false }
      ],
      detailsText: 'Projeto de construção de edifício comercial com 15 andares no centro da cidade.',
      organizationId: org1.id
    }
  });
  console.log(`   ✅ ${project1.name} (ativo)`);

  const project2 = await prisma.project.create({
    data: {
      name: 'Residencial Jardim das Flores',
      isCurrent: false,
      detailsChecklist: [
        { text: 'Projeto aprovado', checked: true },
        { text: 'Terraplanagem concluída', checked: true }
      ],
      detailsText: 'Condomínio residencial com 50 unidades.',
      organizationId: org1.id
    }
  });
  console.log(`   ✅ ${project2.name}\n`);

  // Cria tarefas
  console.log('📋 Criando tarefas...');
  const now = new Date().toLocaleDateString('pt-BR') + ' 10:00';

  await prisma.task.create({
    data: {
      title: 'Comprar material elétrico',
      status: 'Criado',
      created: now,
      dates: { 'Criado': now },
      projectId: project1.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Instalar tubulação hidráulica',
      status: 'Em separação',
      created: now,
      dates: { 
        'Criado': now,
        'Em separação': now
      },
      projectId: project1.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Falta cabo 10mm',
      status: 'Pendencia',
      created: now,
      dates: { 'Pendencia': now },
      projectId: project1.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Revestimento cerâmico',
      status: 'Em romaneio',
      created: now,
      dates: { 
        'Criado': now,
        'Em separação': now,
        'Em romaneio': now
      },
      projectId: project1.id
    }
  });

  await prisma.task.create({
    data: {
      title: 'Instalação de portas',
      status: 'Entregue',
      created: now,
      dates: { 
        'Criado': now,
        'Em separação': now,
        'Em romaneio': now,
        'Entregue': now
      },
      projectId: project1.id
    }
  });

  console.log('   ✅ 5 tarefas criadas para Edifício Centro Comercial\n');

  await prisma.task.create({
    data: {
      title: 'Escavação do terreno',
      status: 'Criado',
      created: now,
      dates: { 'Criado': now },
      projectId: project2.id
    }
  });

  console.log('   ✅ 1 tarefa criada para Residencial Jardim das Flores\n');

  console.log('✨ Seed concluído com sucesso!\n');
  console.log('🔐 Credenciais de teste:');
  console.log('   • admin@construtora.com / senha123 (ADMIN)');
  console.log('   • joao@construtora.com / senha123 (MEMBER)');
  console.log('   • maria@construtora.com / senha123 (VIEWER)\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
