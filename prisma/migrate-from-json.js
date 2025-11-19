const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Script de migração: db.json -> PostgreSQL
 * 
 * USO:
 * node prisma/migrate-from-json.js
 */

async function migrate() {
  try {
    console.log('🔄 Iniciando migração do db.json para PostgreSQL...\n');

    // Lê db.json
    const dbPath = path.join(__dirname, '..', 'db.json');
    
    if (!fs.existsSync(dbPath)) {
      console.log('⚠️  Arquivo db.json não encontrado. Criando dados de exemplo...');
      await seedExample();
      return;
    }

    const rawData = fs.readFileSync(dbPath, 'utf8');
    const oldData = JSON.parse(rawData);

    if (!oldData.projects || oldData.projects.length === 0) {
      console.log('⚠️  Nenhum projeto encontrado no db.json');
      await seedExample();
      return;
    }

    console.log(`📦 Encontrados ${oldData.projects.length} projeto(s) no db.json\n`);

    // Cria organização padrão
    console.log('🏢 Criando organização...');
    const organization = await prisma.organization.create({
      data: {
        name: 'Empresa Migrada',
        slug: 'empresa-migrada'
      }
    });
    console.log(`   ✅ Organização criada: ${organization.name} (${organization.id})\n`);

    // Cria usuário admin padrão
    console.log('👤 Criando usuário admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'admin@empresa.com',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
        organizationId: organization.id
      }
    });
    console.log(`   ✅ Usuário criado: ${user.email}`);
    console.log(`   🔑 Senha padrão: admin123\n`);

    // Migra projetos
    console.log('📁 Migrando projetos...');
    let projectCount = 0;
    let taskCount = 0;

    for (const oldProject of oldData.projects) {
      const isCurrent = oldProject.id === oldData.currentProjectId;
      
      // Prepara checklist
      let detailsChecklist = [{ text: '', checked: false }];
      let detailsText = '';

      if (Array.isArray(oldProject.detailsChecklist)) {
        detailsChecklist = oldProject.detailsChecklist;
      } else if (Array.isArray(oldProject.details)) {
        detailsChecklist = oldProject.details;
      } else if (typeof oldProject.details === 'string') {
        detailsText = oldProject.details;
      }

      if (typeof oldProject.detailsText === 'string') {
        detailsText = oldProject.detailsText;
      }

      // Cria projeto
      const project = await prisma.project.create({
        data: {
          name: oldProject.name || 'Projeto sem nome',
          isCurrent,
          detailsChecklist,
          detailsText,
          organizationId: organization.id
        }
      });

      projectCount++;
      console.log(`   ✅ Projeto: ${project.name} (${isCurrent ? 'ATIVO' : 'inativo'})`);

      // Migra tarefas do projeto
      if (oldProject.tasks && oldProject.tasks.length > 0) {
        for (const oldTask of oldProject.tasks) {
          await prisma.task.create({
            data: {
              title: oldTask.title || 'Tarefa sem título',
              status: oldTask.status || 'Criado',
              created: oldTask.created || null,
              dates: oldTask.dates || {},
              history: oldTask.history || [],
              hasPending: oldTask.hasPending || false,
              parentId: oldTask.parentId || null,
              expanded: oldTask.expanded || false,
              projectId: project.id
            }
          });
          taskCount++;
        }
        console.log(`      └─ ${oldProject.tasks.length} tarefa(s) migradas`);
      }
    }

    console.log('\n✨ Migração concluída com sucesso!');
    console.log(`   📊 Resumo:`);
    console.log(`   • ${projectCount} projeto(s) migrados`);
    console.log(`   • ${taskCount} tarefa(s) migradas`);
    console.log(`\n   🔐 Credenciais de acesso:`);
    console.log(`   • Email: admin@empresa.com`);
    console.log(`   • Senha: admin123`);
    console.log(`\n   ⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n`);

    // Faz backup do db.json
    const backupPath = path.join(__dirname, '..', `db.json.backup.${Date.now()}`);
    fs.copyFileSync(dbPath, backupPath);
    console.log(`   💾 Backup criado: ${path.basename(backupPath)}\n`);

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Cria dados de exemplo se não houver db.json
 */
async function seedExample() {
  try {
    console.log('🌱 Criando dados de exemplo...\n');

    const organization = await prisma.organization.create({
      data: {
        name: 'Empresa Exemplo',
        slug: 'empresa-exemplo'
      }
    });

    const hashedPassword = await bcrypt.hash('demo123', 10);
    await prisma.user.create({
      data: {
        email: 'demo@exemplo.com',
        name: 'Usuário Demo',
        password: hashedPassword,
        role: 'ADMIN',
        organizationId: organization.id
      }
    });

    const project = await prisma.project.create({
      data: {
        name: 'Obra Exemplo',
        isCurrent: true,
        detailsChecklist: [
          { text: 'Definir escopo', checked: true },
          { text: 'Aprovar orçamento', checked: false }
        ],
        detailsText: 'Projeto de exemplo criado automaticamente',
        organizationId: organization.id
      }
    });

    await prisma.task.create({
      data: {
        title: 'Tarefa de exemplo',
        status: 'Criado',
        created: new Date().toLocaleDateString('pt-BR'),
        dates: { 'Criado': new Date().toLocaleDateString('pt-BR') },
        projectId: project.id
      }
    });

    console.log('✅ Dados de exemplo criados!');
    console.log(`   🔐 Login: demo@exemplo.com / demo123\n`);

  } catch (error) {
    console.error('❌ Erro ao criar dados de exemplo:', error);
    throw error;
  }
}

// Executa
migrate()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
