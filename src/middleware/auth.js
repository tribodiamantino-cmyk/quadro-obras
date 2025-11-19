const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação JWT
 * Verifica o token no header Authorization ou no cookie
 */
async function authenticate(req, res, next) {
  try {
    // Busca token no header ou cookie
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ 
        error: 'Autenticação necessária',
        code: 'NO_TOKEN' 
      });
    }

    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Adiciona dados do usuário na request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      organizationId: decoded.organizationId,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        code: 'EXPIRED_TOKEN' 
      });
    }
    return res.status(500).json({ 
      error: 'Erro na autenticação',
      details: error.message 
    });
  }
}

/**
 * Middleware de autorização por role
 * Uso: authorize('ADMIN') ou authorize(['ADMIN', 'MEMBER'])
 */
function authorize(allowedRoles = []) {
  // Converte string única em array
  if (typeof allowedRoles === 'string') {
    allowedRoles = [allowedRoles];
  }
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuário não autenticado' 
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Permissão negada',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware opcional de autenticação
 * Continua mesmo sem token, mas popula req.user se houver
 */
async function optionalAuth(req, res, next) {
  try {
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        organizationId: decoded.organizationId,
        role: decoded.role
      };
    }
  } catch (error) {
    // Ignora erros e continua sem autenticação
  }
  
  next();
}

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
