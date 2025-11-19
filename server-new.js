require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { PrismaClient } = require('@prisma/client');

// Rotas
const authRoutes = require('./src/routes/auth.routes');
const projectsRoutes = require('./src/routes/projects.routes');

// Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: CORS_ORIGIN } 
});

// ==================== MIDDLEWARE ====================

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Cache control para HTML
app.use((req, res, next) => {
  if (req.path === '/' || req.path.endsWith('.html')) {
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// ==================== ROTAS ====================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected' 
  });
});

// Auth routes (públicas e protegidas)
app.use('/api/auth', authRoutes);

// Projects routes (todas protegidas)
app.use('/api', projectsRoutes);

// Fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== ERROR HANDLING ====================

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('❌ Erro não tratado:', err);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Erro interno do servidor' 
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== SOCKET.IO ====================

// Map para rastrear usuários por organização
const organizationRooms = new Map();

io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  // Cliente envia organizationId ao conectar
  socket.on('join-organization', (organizationId) => {
    if (!organizationId) return;
    
    socket.join(`org:${organizationId}`);
    console.log(`📡 Socket ${socket.id} entrou na sala org:${organizationId}`);
    
    if (!organizationRooms.has(organizationId)) {
      organizationRooms.set(organizationId, new Set());
    }
    organizationRooms.get(organizationId).add(socket.id);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
    
    // Remove de todas as salas
    organizationRooms.forEach((sockets, orgId) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          organizationRooms.delete(orgId);
        }
      }
    });
  });
});

// Helper para emitir updates para organização específica
global.emitToOrganization = (organizationId, event, data) => {
  io.to(`org:${organizationId}`).emit(event, data);
};

// ==================== GRACEFUL SHUTDOWN ====================

async function shutdown(signal) {
  console.log(`\n🛑 ${signal} recebido. Encerrando graciosamente...`);
  
  server.close(async () => {
    console.log('📡 Servidor HTTP fechado');
    
    try {
      await prisma.$disconnect();
      console.log('🗄️  Conexão com banco fechada');
      process.exit(0);
    } catch (error) {
      console.error('❌ Erro ao fechar banco:', error);
      process.exit(1);
    }
  });

  // Timeout de 10s para shutdown forçado
  setTimeout(() => {
    console.error('⚠️  Shutdown forçado após timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
  shutdown('UNHANDLED_REJECTION');
});

// ==================== START SERVER ====================

async function start() {
  try {
    // Testa conexão com DB
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados');

    server.listen(PORT, '0.0.0.0', () => {
      const nets = os.networkInterfaces();
      const urls = [];
      
      Object.values(nets).flat().forEach(n => {
        if (n && n.family === 'IPv4' && !n.internal) {
          urls.push(`http://${n.address}:${PORT}`);
        }
      });

      console.log('\n🚀 Servidor rodando:');
      console.log(`   • Local:     http://localhost:${PORT}`);
      urls.forEach(u => console.log(`   • Na rede:  ${u}`));
      console.log(`   • Ambiente:  ${process.env.NODE_ENV || 'development'}`);
      console.log('\n📚 Endpoints:');
      console.log('   • POST /api/auth/register  - Criar conta');
      console.log('   • POST /api/auth/login     - Fazer login');
      console.log('   • GET  /api/auth/me        - Dados do usuário');
      console.log('   • GET  /api/state          - Estado completo');
      console.log('   • GET  /health             - Health check');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

start();
