const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/role.middleware');
const {
    getAllUsers,
    addUser,
    updateUser,
    deleteUser,
    getUserStats,
    getEnrollmentDeadline,
    setEnrollmentDeadline
} = require('../../controllers/admin.controller');

// Departments route (no auth required for public access)
const supabase = require('../../supabase');
router.get('/departments', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        res.json(data);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Admin authentication - all routes below require auth
router.use(authenticate);
router.use(authorize('admin'));

// User management routes
router.get('/users', getAllUsers);
router.post('/users', addUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/stats', getUserStats);

// Enrollment deadline routes
router.get('/enrollment-deadline', getEnrollmentDeadline);
router.post('/enrollment-deadline', setEnrollmentDeadline);

module.exports = router;
