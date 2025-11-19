const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Gera um slug único a partir de um nome
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por -
    .replace(/-+/g, '-') // Remove -- duplicados
    .trim();
}

/**
 * POST /api/auth/register
 * Cria nova organização + primeiro usuário (ADMIN)
 */
async function register(req, res) {
  try {
    const { email, password, name, organizationName } = req.body;

    // Validações básicas
    if (!email || !password || !name || !organizationName) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: email, password, name, organizationName' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Senha deve ter no mínimo 6 caracteres' 
      });
    }

    // Verifica se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email já cadastrado' 
      });
    }

    // Gera slug único
    let slug = generateSlug(organizationName);
    let slugExists = await prisma.organization.findUnique({ 
      where: { slug } 
    });
    
    let counter = 1;
    while (slugExists) {
      slug = `${generateSlug(organizationName)}-${counter}`;
      slugExists = await prisma.organization.findUnique({ where: { slug } });
      counter++;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria organização + usuário em transação
    const result = await prisma.$transaction(async (tx) => {
      // Cria organização
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug
        }
      });

      // Cria primeiro usuário como ADMIN
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          role: 'ADMIN',
          organizationId: organization.id
        }
      });

      // Cria projeto inicial
      await tx.project.create({
        data: {
          name: 'Obra 1',
          isCurrent: true,
          organizationId: organization.id,
          detailsChecklist: [{ text: '', checked: false }],
          detailsText: ''
        }
      });

      return { user, organization };
    });

    // Gera token JWT
    const token = jwt.sign(
      {
        userId: result.user.id,
        email: result.user.email,
        organizationId: result.organization.id,
        role: result.user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Retorna token e dados do usuário (sem senha)
    res.status(201).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        organizationId: result.organization.id,
        organizationName: result.organization.name,
        organizationSlug: result.organization.slug
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ 
      error: 'Erro ao criar conta',
      details: error.message 
    });
  }
}

/**
 * POST /api/auth/login
 * Faz login e retorna token JWT
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email e senha são obrigatórios' 
      });
    }

    // Busca usuário com organização
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        organization: true
      }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'Email ou senha inválidos' 
      });
    }

    // Verifica senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Email ou senha inválidos' 
      });
    }

    // Gera token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        organizationId: user.organizationId,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organization.id,
        organizationName: user.organization.name,
        organizationSlug: user.organization.slug
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      error: 'Erro ao fazer login',
      details: error.message 
    });
  }
}

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        organization: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organization.id,
      organizationName: user.organization.name,
      organizationSlug: user.organization.slug,
      createdAt: user.createdAt
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar dados do usuário',
      details: error.message 
    });
  }
}

/**
 * POST /api/auth/invite
 * Convida novo usuário para a organização (apenas ADMIN)
 */
async function invite(req, res) {
  try {
    const { email, name, role = 'MEMBER' } = req.body;

    if (!email || !name) {
      return res.status(400).json({ 
        error: 'Email e nome são obrigatórios' 
      });
    }

    // Verifica se já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Usuário já existe' 
      });
    }

    // Gera senha temporária
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Cria usuário
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
        organizationId: req.user.organizationId
      }
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      temporaryPassword: tempPassword // Na produção, envie por email
    });

  } catch (error) {
    console.error('Erro ao convidar usuário:', error);
    res.status(500).json({ 
      error: 'Erro ao criar convite',
      details: error.message 
    });
  }
}

module.exports = {
  register,
  login,
  me,
  invite
};
