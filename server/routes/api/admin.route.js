const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const {
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    getUserStats
} = require('../../controllers/admin.controller');

// Admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// User management routes
router.get('/users', getAllUsers);
router.post('/users', addUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/stats', getUserStats);

module.exports = router;
