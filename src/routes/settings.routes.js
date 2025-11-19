const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Middleware de autenticação em todas as rotas
router.use(authenticate);

// ==================== STORES (Lojas) ====================
router.get('/stores', settingsController.getStores);
router.post('/stores', authorize('ADMIN'), settingsController.createStore);
router.patch('/stores/:id', authorize('ADMIN'), settingsController.updateStore);
router.delete('/stores/:id', authorize('ADMIN'), settingsController.deleteStore);

// ==================== WORK STATUSES ====================
router.get('/work-statuses', settingsController.getWorkStatuses);
router.post('/work-statuses', authorize('ADMIN'), settingsController.createWorkStatus);
router.patch('/work-statuses/:id', authorize('ADMIN'), settingsController.updateWorkStatus);
router.delete('/work-statuses/:id', authorize('ADMIN'), settingsController.deleteWorkStatus);

// ==================== USERS ====================
router.get('/users', authorize('ADMIN'), settingsController.getUsers);
router.patch('/users/:id/role', authorize('ADMIN'), settingsController.updateUserRole);

// ==================== INTEGRATORS ====================
router.get('/integrators', settingsController.getIntegrators);
router.post('/integrators', authorize('ADMIN'), settingsController.createIntegrator);
router.delete('/integrators/:id', authorize('ADMIN'), settingsController.deleteIntegrator);

// ==================== ASSEMBLERS ====================
router.get('/assemblers', settingsController.getAssemblers);
router.post('/assemblers', authorize('ADMIN'), settingsController.createAssembler);
router.delete('/assemblers/:id', authorize('ADMIN'), settingsController.deleteAssembler);

// ==================== ELECTRICIANS ====================
router.get('/electricians', settingsController.getElectricians);
router.post('/electricians', authorize('ADMIN'), settingsController.createElectrician);
router.delete('/electricians/:id', authorize('ADMIN'), settingsController.deleteElectrician);

module.exports = router;
