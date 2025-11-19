const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Rotas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rotas protegidas
router.get('/me', authenticate, authController.me);
router.post('/invite', authenticate, authorize(['ADMIN']), authController.invite);

module.exports = router;
