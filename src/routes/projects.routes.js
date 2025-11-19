const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const projectsController = require('../controllers/projects.controller');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Estado geral
router.get('/state', projectsController.getState);

// Projetos
router.post('/project', authorize(['ADMIN', 'MEMBER']), projectsController.createProject);
router.patch('/project/:id', authorize(['ADMIN', 'MEMBER']), projectsController.updateProject);
router.delete('/project/:id', authorize(['ADMIN']), projectsController.deleteProject);

// Tarefas
router.post('/task', authorize(['ADMIN', 'MEMBER']), projectsController.createTask);
router.patch('/task/:id', authorize(['ADMIN', 'MEMBER']), projectsController.updateTask);
router.delete('/task/:id', authorize(['ADMIN', 'MEMBER']), projectsController.deleteTask);

// Ações especiais de tarefas
router.post('/task/:id/duplicate-pending', authorize(['ADMIN', 'MEMBER']), projectsController.duplicatePending);
router.post('/task/:id/advance-with-pending', authorize(['ADMIN', 'MEMBER']), projectsController.advanceWithPending);

// Operações em lote
router.post('/tasks/batch-copy', authorize(['ADMIN', 'MEMBER']), projectsController.batchCopy);
router.post('/tasks/batch-delete', authorize(['ADMIN', 'MEMBER']), projectsController.batchDelete);

module.exports = router;
